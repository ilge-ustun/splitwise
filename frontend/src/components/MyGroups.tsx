"use client";

import { useAccount, useReadContract } from "wagmi";
import SplitwiseBaseAbi from "@/abi/SplitwiseBase.json";
import { smartcontracts } from "@/const/smartcontracts";

export default function MyGroups() {
  const { isConnected, address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: smartcontracts.splitwiseBase as `0x${string}`,
    abi: SplitwiseBaseAbi,
    functionName: "getGroups",
    args: [address as `0x${string}`],
    chainId: 421614,
    query: {
      enabled: Boolean(isConnected && address),
      refetchOnWindowFocus: false,
    },
  });

  const groups = (data as `0x${string}`[] | undefined) ?? [];

  function shorten(addr: string) {
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">My Groups</h2>
        <p className="text-sm text-yellow-300">Connect your wallet to view your groups.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">My Groups</h2>
        <p className="text-sm text-white/70">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">My Groups</h2>
        <p className="text-sm text-red-400">Failed to load groups.</p>
      </div>
    );
  }

  console.log(groups.length, groups);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">My Groups</h2>
      {groups.length === 0 ? (
        <p className="text-sm text-white/60">No groups found.</p>
      ) : (
        <ul className="space-y-2">
          {groups.map(g => (
            <li
              key={g}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <span className="font-mono text-sm break-all">{g}</span>
              <span className="text-white/60 text-sm">{shorten(g)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
