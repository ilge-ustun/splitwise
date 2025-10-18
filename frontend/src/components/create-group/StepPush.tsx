"use client";

import { useEffect, useMemo, useState } from "react";
import { useWriteContract } from "wagmi";
import GroupDataAbi from "@/abi/GroupData.json";
import { getAddress, isAddress } from "viem";

type Props = {
  groupAddress: `0x${string}` | null;
  protectedDataAddress: `0x${string}` | null;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export default function StepPush({ groupAddress, protectedDataAddress, onSuccess, onError }: Props) {
  const { writeContractAsync, error } = useWriteContract();
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localGroup, setLocalGroup] = useState<string>(groupAddress ?? "");
  const [localData, setLocalData] = useState<string>(protectedDataAddress ?? "");

  useEffect(() => {
    if (groupAddress && groupAddress !== localGroup) setLocalGroup(groupAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupAddress]);
  useEffect(() => {
    if (protectedDataAddress && protectedDataAddress !== localData) setLocalData(protectedDataAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protectedDataAddress]);

  const canRun = useMemo(() => isAddress(localGroup || "0x") && isAddress(localData || "0x") && !isRunning, [localGroup, localData, isRunning]);


  async function run() {
    setLocalError(null);
    setIsRunning(true);
    console.log("running");
    console.log(localGroup, localData);
    try {
      if (!isAddress(localGroup) || !isAddress(localData)) throw new Error("Invalid group or data address");
      const normalizedGroup = getAddress(localGroup);
      const normalizedData = getAddress(localData);
      await writeContractAsync({ chainId: 421614, address: normalizedGroup, abi: GroupDataAbi, functionName: "pushData", args: [normalizedData] });
      setDone(true);
      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setLocalError(message);
      onError(message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Step 3 — Save reference on-chain</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Group address</label>
          <input
            type="text"
            value={localGroup}
            onChange={e => setLocalGroup(e.target.value.trim())}
            placeholder="0x..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Protected data address</label>
          <input
            type="text"
            value={localData}
            onChange={e => setLocalData(e.target.value.trim())}
            placeholder="0x..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={run} disabled={!canRun} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">
          {done ? "Re-run" : isRunning ? "Saving…" : "Run"}
        </button>
      </div>
      {!isRunning && (!isAddress(localGroup || "0x") || !isAddress(localData || "0x")) && (
        <p className="text-xs text-white/60">Enter valid 0x addresses for both fields to enable this step.</p>
      )}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {error && <p className="text-sm text-red-400">Contract error: {error.message}</p>}
      {done && <p className="text-sm text-green-400">Reference saved successfully.</p>}
    </div>
  );
}


