"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useIExecDataProtector } from "@/hooks/useIExecDataProtector";

type Props = {
  pdAddress: `0x${string}`;
};

export default function MembersFromIExec({ pdAddress }: Props) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isReady, core, authorizedApp } = useIExecDataProtector();

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<string[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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
          // Wait for chain change; rerun effect on next render
          return;
        }

        if (!authorizedApp) {
          throw new Error("iApp not configured. Set NEXT_PUBLIC_IEXEC_APP_ARBITRUM_SEPOLIA");
        }

        // Ensure this wallet has access to the protected data for this app
        if (!address) throw new Error("Connect your wallet");
        // Owners can always process their own protected data; check first
        const meta = await core.getProtectedData({ protectedDataAddress: pdAddress });
        const isOwner = Array.isArray(meta) && meta.length > 0 && meta[0]?.owner?.toLowerCase?.() === address.toLowerCase();
        if (!isOwner) {
          const access = await core.getGrantedAccess({
            protectedData: pdAddress,
            authorizedApp: authorizedApp,
            authorizedUser: address,
            isUserStrict: true,
            pageSize: 10,
          });
          if (!access || access.count === 0) {
            throw new Error("Access not granted for this wallet");
          }
        }

        // Process the protected data using the authorized app as current requester
        const appMaxPrice = Number(process.env.NEXT_PUBLIC_IEXEC_MAX_APP_PRICE ?? 0);
        const workerpoolMaxPrice = Number(process.env.NEXT_PUBLIC_IEXEC_MAX_WORKERPOOL_PRICE ?? 0);
        const dataMaxPrice = Number(process.env.NEXT_PUBLIC_IEXEC_MAX_DATA_PRICE ?? 0);

        const { result } = await core.processProtectedData({
          protectedData: pdAddress,
          app: authorizedApp,
          path: "result.json",
          dataMaxPrice,
          appMaxPrice,
          workerpoolMaxPrice,
          onStatusUpdate: ({ title, isDone }) => {
            setStatus(`${title}${isDone ? " ✓" : "…"}`);
          },
        });

        // result already contains the requested file (result.json)
        const text = new TextDecoder().decode(result);

        console.log("=======text", text)

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
          "members" in (parsed as Record<string, unknown>) &&
          typeof (parsed as Record<string, unknown>).members === "object"
        ) {
          const obj = (parsed as { members: Record<string, unknown> }).members;
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
        // Clear transient status after finish
        setTimeout(() => setStatus(null), 1500);
      }
    };

    void fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isReady, core, pdAddress]);

  console.log("=======members", members)

  return (
    <div className="mt-2 rounded-lg border border-white/15 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Members (from iExec)</h4>
        {(isRunning || status) && (
          <span className="text-xs text-white/60">{status ?? "fetching…"}</span>
        )}
      </div>
      {needArbitrum && (
        <div className="mt-2 rounded-md border border-yellow-300/30 bg-yellow-300/10 p-2 text-xs text-yellow-200">
          <div className="flex items-center justify-between gap-2">
            <span>Current chain: {chainId}. Switch to Arbitrum Sepolia (421614) to read.</span>
            <button
              type="button"
              onClick={() => switchChain({ chainId: 421614 })}
              className="px-2 py-1 rounded bg-yellow-400 text-black hover:bg-yellow-300"
            >
              Switch network
            </button>
          </div>
        </div>
      )}
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


