"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  IExecDataProtector,
  IExecDataProtectorCore,
  ProtectedData,
  GrantedAccess,
  DataObject,
} from "@iexec/dataprotector";
import { explorerSlugs } from "@/config/wagmiNetworks";

type GrantAccessParams = {
  protectedDataAddress: string;
  authorizedApp: string;
  authorizedUser: string;
  pricePerAccess?: number;
  numberOfAccess?: number;
  onStatusUpdate?: (p: { title: string; isDone: boolean }) => void;
};

export function useIExecDataProtector() {
  const { isConnected, connector } = useAccount();
  const chainId = useChainId();

  const [core, setCore] = useState<IExecDataProtectorCore | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (!isConnected || !connector) {
        setCore(null);
        return;
      }
      try {
        const provider = (await connector.getProvider()) as import("ethers").Eip1193Provider;
        const dp = new IExecDataProtector(provider, { allowExperimentalNetworks: true });
        setCore(dp.core);
        setInitError(null);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setInitError(message);
        setCore(null);
      }
    };
    void initialize();
  }, [isConnected, connector]);

  const isReady = useMemo(() => Boolean(core), [core]);

  const authorizedApp = useMemo(() => {
    const byChain: Record<number, string | undefined> = {
      421614: process.env.NEXT_PUBLIC_IEXEC_APP_ARBITRUM_SEPOLIA,
      42161: process.env.NEXT_PUBLIC_IEXEC_APP_ARBITRUM_ONE,
      100: process.env.NEXT_PUBLIC_IEXEC_APP_GNOSIS,
    };
    return byChain[chainId];
  }, [chainId]);

  const getExplorerUrl = useCallback(
    (address?: string, type: "address" | "dataset" | "apps" = "address") => {
      const slug = explorerSlugs[chainId];
      if (!slug) return null;
      if (!address) return `https://explorer.iex.ec/${slug}/${type}`;
      return `https://explorer.iex.ec/${slug}/${type}/${address}`;
    },
    [chainId],
  );

  const protectJson = useCallback(
    async (name: string, data: DataObject): Promise<ProtectedData> => {
      if (!core) throw new Error("iExec DataProtector not initialized");
      return await core.protectData({ name, data });
    },
    [core],
  );

  const protectMembers = useCallback(
    async (name: string, members: string[]): Promise<ProtectedData> => {
      const membersObject = members.reduce<Record<string, string>>((acc, addr, idx) => {
        acc[String(idx)] = addr;
        return acc;
      }, {});
      return await protectJson(name, { members: membersObject });
    },
    [protectJson],
  );

  const grantAccess = useCallback(
    async (params: GrantAccessParams): Promise<GrantedAccess> => {
      if (!core) throw new Error("iExec DataProtector not initialized");
      const res = await core.grantAccess({
        protectedData: params.protectedDataAddress,
        authorizedApp: params.authorizedApp,
        authorizedUser: params.authorizedUser,
        pricePerAccess: params.pricePerAccess ?? 0,
        numberOfAccess: params.numberOfAccess ?? 1,
        onStatusUpdate: params.onStatusUpdate,
      });
      return res;
    },
    [core],
  );

  return {
    core,
    isReady,
    initError,
    getExplorerUrl,
    protectJson,
    protectMembers,
    grantAccess,
    authorizedApp,
  } as const;
}


