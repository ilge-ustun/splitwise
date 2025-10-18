"use client";

import { useState } from "react";
import { ProtectedData } from "@iexec/dataprotector";
import StepDeploy from "./create-group/StepDeploy";
import StepProtect from "./create-group/StepProtect";
import StepPush from "./create-group/StepPush";

export default function CreateGroup() {
  const [deployed, setDeployed] = useState<{
    groupAddress: `0x${string}`;
    name: string;
    participants: `0x${string}`[];
    txHash: `0x${string}`;
  } | null>(null);
  const [protectedData, setProtectedData] = useState<ProtectedData | null>(null);
  const [pushDone, setPushDone] = useState(false);
  const [errors, setErrors] = useState<{ deploy?: string; protect?: string; push?: string }>({});

  function onDeploySuccess(d: { groupAddress: `0x${string}`; name: string; participants: `0x${string}`[]; txHash: `0x${string}` }) {
    setErrors(prev => ({ ...prev, deploy: undefined }));
    setDeployed(d);
  }
  function onDeployError(msg: string) {
    setErrors(prev => ({ ...prev, deploy: msg }));
  }

  function onProtectSuccess(data: ProtectedData) {
    setErrors(prev => ({ ...prev, protect: undefined }));
    setProtectedData(data);
  }
  function onProtectError(msg: string) {
    setErrors(prev => ({ ...prev, protect: msg }));
  }

  function onPushSuccess() {
    setErrors(prev => ({ ...prev, push: undefined }));
    setPushDone(true);
  }
  function onPushError(msg: string) {
    setErrors(prev => ({ ...prev, push: msg }));
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm space-y-6">
      <h2 className="text-xl font-semibold">Create Group</h2>

      <StepDeploy onSuccess={onDeploySuccess} onError={onDeployError} />
      {errors.deploy && <p className="text-sm text-red-400">{errors.deploy}</p>}

      <div>
        <StepProtect
          name={deployed?.name || ""}
          participants={(deployed?.participants as unknown as string[]) || []}
          onSuccess={onProtectSuccess}
          onError={onProtectError}
          initialData={protectedData}
        />
        {errors.protect && <p className="text-sm text-red-400">{errors.protect}</p>}
      </div>

      <StepPush
        groupAddress={deployed?.groupAddress ?? null}
        protectedDataAddress={(protectedData?.address as `0x${string}`) ?? null}
        onSuccess={onPushSuccess}
        onError={onPushError}
      />
      {errors.push && <p className="text-sm text-red-400">{errors.push}</p>}
      {pushDone && <p className="text-sm text-green-400">All steps completed.</p>}
    </div>
  );
}
