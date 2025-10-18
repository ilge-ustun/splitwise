"use client";

import { useState } from "react";
import { ProtectedData } from "@iexec/dataprotector";
import { useIExecDataProtector } from "@/hooks/useIExecDataProtector";

type Props = {
  name: string;
  participants: string[];
  onSuccess: (data: ProtectedData) => void;
  onError: (message: string) => void;
  initialData?: ProtectedData | null;
};

export default function StepProtect({ name, participants, onSuccess, onError, initialData = null }: Props) {
  const { isReady, protectParticipants, getExplorerUrl } = useIExecDataProtector();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ProtectedData | null>(initialData);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setIsRunning(true);
    try {
      if (!isReady) throw new Error("iExec not initialized");
      const res = await protectParticipants(`Splitwise Group Participants - ${name}`, participants);
      setResult(res);
      onSuccess(res);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      onError(message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Step 2 — Protect participants</h3>
      {!isReady && <p className="text-sm text-yellow-300">Initialize wallet to use iExec.</p>}
      <div className="flex gap-2">
        <button type="button" onClick={run} disabled={!isReady || isRunning} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">
          {isRunning ? "Protecting…" : result ? "Re-run" : "Run"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && (
        <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 text-blue-900">
          <h4 className="text-base font-semibold mb-2">Protected data created</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {result.name}</p>
            <p>
              <strong>Address:</strong> {result.address}
              {getExplorerUrl(result.address, "dataset") && (
                <a href={getExplorerUrl(result.address, "dataset")!} target="_blank" rel="noopener noreferrer" className="ml-2 underline">View</a>
              )}
            </p>
            <p>
              <strong>Owner:</strong> {result.owner}
              {getExplorerUrl(result.owner, "address") && (
                <a href={getExplorerUrl(result.owner, "address")!} target="_blank" rel="noopener noreferrer" className="ml-2 underline">View</a>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


