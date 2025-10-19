"use client";

import { useReadContract } from "wagmi";
import GroupAbi from "@/abi/Group.json";
import MembersFromIExec from "@/components/MembersFromIExec";

export default function GroupMembers({ groupAddress, initialMembers, onMembersFetched }: {
  groupAddress: `0x${string}`;
  initialMembers?: string[] | undefined;
  onMembersFetched?: (members: string[]) => void;
}) {
  const { data, isLoading, error } = useReadContract({
    address: groupAddress,
    abi: GroupAbi,
    functionName: "getPdMembers",
    chainId: 11155111, // Sepolia (same chain as SplitwiseGenome)
    query: {
      refetchOnWindowFocus: false,
    },
  });

  const pdMembers = (data as `0x${string}` | undefined) ?? undefined;

  return (
    <div className="px-4 py-3 space-y-2">
      <h3 className="text-base font-semibold">Group Members</h3>
      <div className="text-sm">
        <div>
          <span className="font-medium">Group address:</span> <span className="font-mono break-all">{groupAddress}</span>
        </div>
        <div>
          <span className="font-medium">Protected members (getPdMembers):</span>{" "}
          {isLoading && <span>loading…</span>}
          {error && <span className="text-red-400">failed to load</span>}
          {!isLoading && !error && (
            <span className="font-mono break-all">{pdMembers ?? "—"}</span>
          )}
        </div>
      </div>
      {!isLoading && !error && pdMembers && (
        <MembersFromIExec
          pdAddress={pdMembers}
          initialMembers={initialMembers}
          onMembersFetched={onMembersFetched}
        />
      )}
    </div>
  );
}