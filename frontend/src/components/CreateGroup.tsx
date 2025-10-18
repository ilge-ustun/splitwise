"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, getAddress, isAddress } from "viem";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import GroupDataAbi from "@/abi/GroupData.json";
import SplitwiseBaseAbi from "@/abi/SplitwiseBase.json";
import { smartcontracts } from "@/const/smartcontracts";
import { ProtectedData } from "@iexec/dataprotector";
import { useIExecDataProtector } from "@/hooks/useIExecDataProtector";

export default function CreateGroup() {
  const { address: connectedAddress, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [name, setName] = useState("");
  const [newParticipant, setNewParticipant] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const { isReady: isIExecReady, protectParticipants, getExplorerUrl } = useIExecDataProtector();

  // Ensure the connected wallet is always included
  useEffect(() => {
    if (connectedAddress) {
      const normalized = getAddress(connectedAddress);
      setParticipants(prev => {
        if (prev.includes(normalized)) return prev;
        return [normalized, ...prev];
      });
    }
  }, [connectedAddress]);

  const canSubmit = useMemo(() => {
    return isConnected && name.trim().length > 0 && participants.length > 0;
  }, [isConnected, name, participants.length]);

  function addParticipant() {
    setLocalError(null);
    const raw = newParticipant.trim();
    if (!raw) return;
    if (!isAddress(raw)) {
      setLocalError("Invalid address");
      return;
    }
    const normalized = getAddress(raw);
    setParticipants(prev => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized];
    });
    setNewParticipant("");
  }

  function removeParticipant(p: string) {
    setParticipants(prev => prev.filter(x => x !== p));
  }

  const { data: txHash, isPending, error, writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    chainId: 421614,
    hash: txHash,
  });

  const [postStep, setPostStep] = useState<"idle" | "protecting" | "pushing" | "done">("idle");
  const [groupAddress, setGroupAddress] = useState<`0x${string}` | null>(null);
  const [protectedDataInfo, setProtectedDataInfo] = useState<ProtectedData | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  // iExec ready state is provided by the hook

  // After tx success: decode group address, protect participants via iExec, then pushData
  useEffect(() => {
    const runPostFlow = async () => {
      if (!isSuccess || !txHash || postStep !== "idle") return;
      try {
        setPostError(null);

        // 1) Decode GroupCreated to get group address
        if (!connector) throw new Error("Wallet connector not available");
        const eip1193Provider = (await connector.getProvider()) as import("ethers").Eip1193Provider;
        const receipt = (await eip1193Provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        })) as {
          logs?: Array<{ address: string; data: `0x${string}`; topics: `0x${string}`[] }>;
        } | null;

        let newGroup: `0x${string}` | null = null;
        if (receipt && receipt.logs?.length) {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: SplitwiseBaseAbi,
                data: log.data,
                topics: log.topics as unknown as [`0x${string}`, ...`0x${string}`[]],
              });
              if ((decoded as { eventName?: string }).eventName === "GroupCreated") {
                const potentialArgs = (decoded as unknown as { args?: Record<string, unknown> }).args;
                const groupValue = potentialArgs?.group;
                if (typeof groupValue === "string") {
                  newGroup = getAddress(groupValue) as `0x${string}`;
                }
                break;
              }
            } catch {
              // skip non-matching logs
            }
          }
        }
        if (!newGroup) throw new Error("Unable to detect new group address from receipt");
        console.log("newGroup", newGroup);
        setGroupAddress(newGroup);

        // 2) Protect participants array with iExec DataProtector
        setPostStep("protecting");
        console.log("protecting");
        if (!isIExecReady) throw new Error("iExec DataProtector not initialized");
        const protectedRes: ProtectedData = await protectParticipants(
          `Splitwise Group Participants - ${name}`,
          participants,
        );
        setProtectedDataInfo(protectedRes);
        console.log("protectedRes", protectedRes);

        // 3) pushData(protectedData.address) on the newly created group
        setPostStep("pushing");
        await writeContractAsync({
          chainId: 421614,
          address: newGroup,
          abi: GroupDataAbi,
          functionName: "pushData",
          args: [protectedRes.address as `0x${string}`],
        });

        setPostStep("done");
        console.log("done");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setPostError(message || "Post-deploy flow failed");
        setPostStep("idle");
      }
    };
    void runPostFlow();
  }, [isSuccess, txHash, postStep, name, participants, writeContractAsync, isIExecReady, protectParticipants, connector]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!isConnected) {
      setLocalError("Connect your wallet first");
      return;
    }

    // Ensure connected address is present and deduped
    const list = Array.from(
      new Set([...(connectedAddress ? [getAddress(connectedAddress)] : []), ...participants.map(a => getAddress(a))]),
    ) as `0x${string}`[];

    if (list.length === 0) {
      setLocalError("Add at least one participant");
      return;
    }

    if (chainId !== 421614) {
      try {
        await switchChain({ chainId: 421614 });
      } catch {
        setLocalError("Please switch to Arbitrum Sepolia (421614)");
        return;
      }
    }

    try {
      await writeContractAsync({
        chainId: 421614,
        address: smartcontracts.splitwiseBase as `0x${string}`,
        abi: SplitwiseBaseAbi,
        functionName: "createGroup",
        args: [list, name],
      });
    } catch {
      setLocalError("Transaction failed");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Create Group</h2>

      {!isConnected && <p className="text-sm text-yellow-300 mb-4">Connect your wallet to create a group.</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Rome Trip"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Add participant address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newParticipant}
              onChange={e => setNewParticipant(e.target.value)}
              placeholder="0x..."
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addParticipant}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Participants ({participants.length})</p>
          {participants.length === 0 ? (
            <p className="text-sm text-white/60">No participants yet.</p>
          ) : (
            <ul className="space-y-2">
              {participants.map(p => (
                <li
                  key={p}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="font-mono text-sm break-all">{p}</span>
                  <button
                    type="button"
                    onClick={() => removeParticipant(p)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {chainId !== 421614 && (
          <div className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-3 text-sm">
            <p className="mb-2">Current chain: {chainId}. Switch to Arbitrum Sepolia (421614) to create.</p>
            <button
              type="button"
              onClick={() => switchChain({ chainId: 421614 })}
              className="px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black"
            >
              Switch to Arbitrum Sepolia
            </button>
          </div>
        )}

        {localError && <p className="text-sm text-red-400">{localError}</p>}
        {error && <p className="text-sm text-red-400">Contract error: {error.message}</p>}
        {isPending && <p className="text-sm text-white/70">Sending transaction…</p>}
        {txHash && <p className="text-sm text-white/70">Tx sent: {txHash}</p>}
        {isConfirming && <p className="text-sm text-white/70">Waiting for confirmation…</p>}
        {isSuccess && <p className="text-sm text-green-400">Group created!</p>}
        {groupAddress && <p className="text-sm text-white/70">New group: {groupAddress}</p>}
        {postStep === "protecting" && <p className="text-sm text-white/70">Protecting participants with iExec…</p>}
        {postStep === "pushing" && <p className="text-sm text-white/70">Saving protected data reference on-chain…</p>}
        {protectedDataInfo && (
          <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 mt-4 text-blue-900">
            <h3 className="text-base font-semibold mb-2">✅ Participants protected successfully</h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Name:</strong> {protectedDataInfo.name}
              </p>
              <p>
                <strong>Address:</strong> {protectedDataInfo.address}
                {getExplorerUrl(protectedDataInfo.address, "dataset") && (
                  <a
                    href={getExplorerUrl(protectedDataInfo.address, "dataset")!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 underline"
                  >
                    View Protected Data
                  </a>
                )}
              </p>
              <p>
                <strong>Owner:</strong> {protectedDataInfo.owner}
                {getExplorerUrl(protectedDataInfo.owner, "address") && (
                  <a
                    href={getExplorerUrl(protectedDataInfo.owner, "address")!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 underline"
                  >
                    View Owner
                  </a>
                )}
              </p>
            </div>
          </div>
        )}
        {postError && <p className="text-sm text-red-400">{postError}</p>}

        <div>
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      </form>
    </div>
  );
}
