"use client";

import { useEffect, useMemo, useState } from "react";
import { getAddress, decodeEventLog } from "viem";
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import SplitwiseGenomeAbi from "@/abi/SplitwiseGenome.json";
import { smartcontracts } from "@/const/smartcontracts";

type Props = {
  name: string;
  members: string[];
  pdMembersAddress?: `0x${string}`;
  onSuccess: (params: { groupAddress: `0x${string}`; name: string; participants: `0x${string}`[]; txHash: `0x${string}` }) => void;
  onError: (message: string) => void;
};

export default function StepDeploy({ name, members, pdMembersAddress, onSuccess, onError }: Props) {
  const { isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [localError, setLocalError] = useState<string | null>(null);
  const [handledTx, setHandledTx] = useState<`0x${string}` | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ address: `0x${string}`; txHash: `0x${string}` } | null>(null);

  const canSubmit = useMemo(
    () => isConnected && name.trim().length > 0 && members.length > 0 && Boolean(pdMembersAddress),
    [isConnected, name, members.length, pdMembersAddress],
  );

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
        setCreatedGroup({ address: newGroup, txHash: txHash as `0x${string}` });
        onSuccess({
          groupAddress: newGroup,
          name,
          participants: Array.from(new Set(members.map(a => getAddress(a)))) as `0x${string}`[],
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
    const list = Array.from(new Set(members.map(a => getAddress(a)))) as `0x${string}`[];
    if (list.length === 0) {
      setLocalError("Add at least one participant");
      return;
    }
    if (!pdMembersAddress) {
      setLocalError("Protect participants first to get PD address");
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
      await writeContractAsync({
        chainId: 11155111,
        address: smartcontracts.splitwiseGenome as `0x${string}`,
        abi: SplitwiseGenomeAbi,
        functionName: "createGroup",
        args: [list, name, pdMembersAddress],
      });
    } catch {
      setLocalError("Transaction failed");
    }
  }

  return (
    <div className="space-y-3">
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
        <button type="button" onClick={onSubmit} disabled={!canSubmit || isPending} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">Create group</button>
      </div>

      {createdGroup && (
        <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 text-blue-900">
          <h4 className="text-base font-semibold mb-2">Group created</h4>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Address:</strong> {createdGroup.address}
              {(
                <a
                  href={`https://sepolia.etherscan.io/address/${createdGroup.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline"
                >
                  View
                </a>
              )}
            </p>
            <p>
              <strong>Tx:</strong> {createdGroup.txHash}
              {(
                <a
                  href={`https://sepolia.etherscan.io/tx/${createdGroup.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline"
                >
                  View
                </a>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


