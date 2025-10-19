"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useIExecDataProtector } from "@/hooks/useIExecDataProtector";

type Props = {
  pdAddress: `0x${string}`;
  authorizedApp: `0x${string}`;
};

export default function MembersFromIExec({ pdAddress, authorizedApp }: Props) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isReady, core } = useIExecDataProtector();

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<string[] | null>(null);

  const needArbitrum = useMemo(() => chainId !== 421614, [chainId]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!isConnected || !isReady || !core) return;
      setError(null);
      setIsRunning(true);
      try {
        // Ensure correct chain for iExec
        if (needArbitrum) {
          try {
            await switchChain({ chainId: 421614 });
          } catch {
            throw new Error("Please switch to Arbitrum Sepolia (421614)");
          }
        }

        // Ensure this wallet has access to the protected data for this app
        if (!address) throw new Error("Connect your wallet");
        const access = await core.getGrantedAccess({
          protectedData: pdAddress,
          authorizedApp,
          authorizedUser: address,
          isUserStrict: true,
          pageSize: 10,
        });
        if (!access || access.count === 0) {
          throw new Error("Access not granted for this wallet");
        }

        // Process the protected data using the authorized app as current requester
        const { result } = await core.processProtectedData({
          protectedData: pdAddress,
          app: authorizedApp,
          dataMaxPrice: 0,
          appMaxPrice: 0,
          workerpoolMaxPrice: 0,
        });

        // `result` is an ArrayBuffer of the app's output; decode it to string
        const text = new TextDecoder().decode(result);
        // Expecting JSON object like { participants: { "0": "0x..", ... } }
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error("Unexpected result format from iExec app");
        }
        const addresses: string[] = [];
        if (
          parsed &&
          typeof parsed === "object" &&
          "participants" in (parsed as Record<string, unknown>) &&
          typeof (parsed as Record<string, unknown>).participants === "object"
        ) {
          const obj = (parsed as { participants: Record<string, unknown> }).participants;
          for (const key of Object.keys(obj)) {
            const v = obj[key];
            if (typeof v === "string") addresses.push(v);
          }
        }
        setMembers(addresses);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        setMembers(null);
      } finally {
        setIsRunning(false);
      }
    };

    void fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isReady, core, pdAddress, authorizedApp]);

  return (
    <div className="mt-2 rounded-lg border border-white/15 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Members (from iExec)</h4>
        {isRunning && <span className="text-xs text-white/60">fetching…</span>}
      </div>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
      {!error && members && members.length === 0 && (
        <p className="text-sm text-white/70 mt-1">No members found.</p>
      )}
      {!error && members && members.length > 0 && (
        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
          {members.map((m) => (
            <li key={m} className="font-mono break-all">{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}


