"use client";

import StepDeploy from "./createGroup/StepDeploy";
import StepProtect from "./createGroup/StepProtect";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getAddress, isAddress } from "viem";
import type { ProtectedData } from "@iexec/dataprotector";

export default function CreateGroup() {
  const { address: connectedAddress } = useAccount();
  const [name, setName] = useState("");
  const [newMember, setNewMember] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pdMembers, setPdMembers] = useState<ProtectedData | null>(null);
  const [deployed, setDeployed] = useState<{ address: `0x${string}`; txHash: `0x${string}` } | null>(null);

  useEffect(() => {
    if (connectedAddress) {
      const normalized = getAddress(connectedAddress);
      setMembers(prev => (prev.includes(normalized) ? prev : [normalized, ...prev]));
    }
  }, [connectedAddress]);

  function addParticipant() {
    setLocalError(null);
    const raw = newMember.trim();
    if (!raw) return;
    if (!isAddress(raw)) {
      setLocalError("Invalid address");
      return;
    }
    const normalized = getAddress(raw);
    setMembers(prev => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setNewMember("");
  }

  function removeParticipant(p: string) {
    const current = connectedAddress ? getAddress(connectedAddress) : null;
    if (current && p === current) return;
    setMembers(prev => prev.filter(x => x !== p));
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm space-y-6">
      <h2 className="text-xl font-semibold">Create Group</h2>

      <div className="space-y-3">
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
            value={newMember}
            onChange={e => setNewMember(e.target.value)}
              placeholder="0x..."
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={addParticipant} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">Add</button>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Members ({members.length})</p>
            {members.length === 0 ? (
              <p className="text-sm text-white/60">No participants yet.</p>
            ) : (
              <ul className="space-y-2">
                {members.map(p => {
                  const isSelf = connectedAddress ? getAddress(connectedAddress) === p : false;
                  return (
                    <li key={p} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="font-mono text-sm break-all">{p}{isSelf ? " (you)" : ""}</span>
                      <button type="button" onClick={() => removeParticipant(p)} disabled={isSelf} className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50">Remove</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {localError && <p className="text-sm text-red-400">{localError}</p>}
        </div>
      </div>

      <StepProtect
        name={name}
        members={members}
        onSuccess={data => setPdMembers(data)}
        onError={() => {}}
      />
      <StepDeploy
        name={name}
        members={members}
        pdMembersAddress={pdMembers?.address as `0x${string}` | undefined}
        onSuccess={({ groupAddress, txHash }) => setDeployed({ address: groupAddress, txHash })}
        onError={() => {}}
      />
    </div>
  );
}
