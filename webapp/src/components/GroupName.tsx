"use client";

import { useReadContract } from "wagmi";
import GroupAbi from "@/abi/Group.json";

export default function GroupName({ address }: { address: `0x${string}` }) {
  const { data, isLoading, error } = useReadContract({
    address,
    abi: GroupAbi,
    functionName: "name",
    chainId: 11155111, // Sepolia
    query: { refetchOnWindowFocus: false },
  });

  if (isLoading) return <span className="text-sm text-white/70">Loading…</span>;
  if (error) return <span className="text-sm text-red-400">Name unavailable</span>;

  const name = (data as string | undefined) ?? "Unnamed";
  return <span className="font-semibold text-sm">{name}</span>;
}


