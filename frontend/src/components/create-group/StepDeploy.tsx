"use client";

import { useEffect, useMemo, useState } from "react";
import { getAddress, isAddress, decodeEventLog } from "viem";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import SplitwiseGenomeAbi from "@/abi/SplitwiseGenome.json";
import { smartcontracts } from "@/const/smartcontracts";

type Props = {
  onSuccess: (params: { groupAddress: `0x${string}`; name: string; participants: `0x${string}`[]; txHash: `0x${string}` }) => void;
  onError: (message: string) => void;
  initialName?: string;
  initialParticipants?: string[];
};

export default function StepDeploy({ onSuccess, onError, initialName = "", initialParticipants = [] }: Props) {
  const { address: connectedAddress, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [name, setName] = useState(initialName);
  const [newParticipant, setNewParticipant] = useState("");
  const [participants, setParticipants] = useState<string[]>(initialParticipants);
  const [localError, setLocalError] = useState<string | null>(null);
  const [handledTx, setHandledTx] = useState<`0x${string}` | null>(null);

  useEffect(() => {
    if (connectedAddress) {
      const normalized = getAddress(connectedAddress);
      setParticipants(prev => (prev.includes(normalized) ? prev : [normalized, ...prev]));
    }
  }, [connectedAddress]);

  const canSubmit = useMemo(() => isConnected && name.trim().length > 0 && participants.length > 0, [isConnected, name, participants.length]);

  function addParticipant() {
    setLocalError(null);
    const raw = newParticipant.trim();
    if (!raw) return;
    if (!isAddress(raw)) {
      setLocalError("Invalid address");
      return;
    }
    const normalized = getAddress(raw);
    setParticipants(prev => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setNewParticipant("");
  }

  function removeParticipant(p: string) {
    setParticipants(prev => prev.filter(x => x !== p));
  }

  const { data: txHash, isPending, error, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ chainId: 11155111, hash: txHash });

  useEffect(() => {
    const detectGroup = async () => {
      if (!isSuccess || !txHash || handledTx === txHash) return;
      try {
        if (!connector) throw new Error("Wallet connector not available");
        const provider = (await connector.getProvider()) as import("ethers").Eip1193Provider;
        const receipt = (await provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        })) as { logs?: Array<{ address: string; data: `0x${string}`; topics: `0x${string}`[] }> } | null;

        let newGroup: `0x${string}` | null = null;
        if (receipt?.logs?.length) {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({ abi: SplitwiseGenomeAbi, data: log.data, topics: log.topics as unknown as [`0x${string}`, ...`0x${string}`[]] });
              if ((decoded as { eventName?: string }).eventName === "GroupCreated") {
                const args = (decoded as unknown as { args?: Record<string, unknown> }).args;
                const groupValue = args?.group;
                console.log("groupValue", groupValue);
                if (typeof groupValue === "string") newGroup = getAddress(groupValue) as `0x${string}`;
                break;
              }
            } catch {}
          }
        }
        if (!newGroup) throw new Error("Unable to detect new group address from receipt");
        setHandledTx(txHash as `0x${string}`);
        onSuccess({
          groupAddress: newGroup,
          name,
          participants: Array.from(new Set([...(connectedAddress ? [getAddress(connectedAddress)] : []), ...participants.map(a => getAddress(a))])) as `0x${string}`[],
          txHash: txHash as `0x${string}`,
        });
      } catch (e: unknown) {
        onError(e instanceof Error ? e.message : String(e));
      }
    };
    void detectGroup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, txHash]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!isConnected) {
      setLocalError("Connect your wallet first");
      return;
    }
    const list = Array.from(new Set([...(connectedAddress ? [getAddress(connectedAddress)] : []), ...participants.map(a => getAddress(a))])) as `0x${string}`[];
    if (list.length === 0) {
      setLocalError("Add at least one participant");
      return;
    }
    if (chainId !== 11155111) {
      try {
        await switchChain({ chainId: 11155111 });
      } catch {
        setLocalError("Please switch to Sepolia (11155111)");
        return;
      }
    }
    try {
      await writeContractAsync({ chainId: 11155111, address: smartcontracts.splitwiseGenome as `0x${string}`, abi: SplitwiseGenomeAbi, functionName: "createGroup", args: [list, name] });
    } catch {
      setLocalError("Transaction failed");
    }
  }

  return (
    <div className="space-y-3">
      {/* <h3 className="text-lg font-semibold">Step 1 — Deploy group</h3> */}
      <form onSubmit={onSubmit} className="space-y-3">
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
            <button type="button" onClick={addParticipant} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">Add</button>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Participants ({participants.length})</p>
            {participants.length === 0 ? (
              <p className="text-sm text-white/60">No participants yet.</p>
            ) : (
              <ul className="space-y-2">
                {participants.map(p => (
                  <li key={p} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="font-mono text-sm break-all">{p}</span>
                    <button type="button" onClick={() => removeParticipant(p)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {chainId !== 11155111 && (
          <div className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-3 text-sm">
            <p className="mb-2">Current chain: {chainId}. Switch to Sepolia (11155111) to create.</p>
            <button type="button" onClick={() => switchChain({ chainId: 11155111 })} className="px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black">Switch to Sepolia</button>
          </div>
        )}

        {localError && <p className="text-sm text-red-400">{localError}</p>}
        {error && <p className="text-sm text-red-400">Contract error: {error.message}</p>}
        {isPending && <p className="text-sm text-white/70">Sending transaction…</p>}
        {isConfirming && <p className="text-sm text-white/70">Waiting for confirmation…</p>}

        <div>
          <button type="submit" disabled={!canSubmit || isPending} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">Create</button>
        </div>
      </form>
    </div>
  );
}


