"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import SplitwiseGenomeAbi from "@/abi/SplitwiseGenome.json";
import { smartcontracts } from "@/const/smartcontracts";
import Group from "@/components/Group";

export default function MyGroups() {
  const { isConnected, address } = useAccount();
  const [openGroup, setOpenGroup] = useState<`0x${string}` | null>(null);

  const { data, isLoading, error } = useReadContract({
    address: smartcontracts.splitwiseGenome as `0x${string}`,
    abi: SplitwiseGenomeAbi,
    functionName: "getGroups",
    args: [address as `0x${string}`],
    chainId: 11155111, // sepolia
    query: {
      enabled: Boolean(isConnected && address),
      refetchOnWindowFocus: false,
    },
  });

  const groups = (data as `0x${string}`[] | undefined) ?? [];

  // accordion view shows full address; shorten not needed

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

  return (
    <div className="w-2xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">My Groups</h2>
      {groups.length === 0 ? (
        <p className="text-sm text-white/60">No groups found.</p>
      ) : (
        <ul className="space-y-3 w-full">
          {groups.map(g => (
            <li key={g} className="rounded-lg border border-white/15 bg-white/5 shadow-sm">
              <button
                type="button"
                onClick={() => setOpenGroup(prev => (prev === g ? null : g))}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors"
                aria-expanded={openGroup === g}
              >
                <span className="font-mono text-sm break-all text-left">{g}</span>
                <svg
                  className={`h-4 w-4 text-black transition-transform ${openGroup === g ? "rotate-90" : "rotate-0"}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {openGroup === g && (
                <Group groupAddress={g} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
