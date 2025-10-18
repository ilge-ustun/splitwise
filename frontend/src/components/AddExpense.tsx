"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import SplitwiseGenomeAbi from "@/abi/SplitwiseGenome.json";
import { smartcontracts } from "@/const/smartcontracts";

type IncludedMember = { address: `0x${string}`; name: string; included: boolean };

const MOCK_MEMBERS: { address: `0x${string}`; name: string }[] = [
  { address: "0x1111111111111111111111111111111111111111" as `0x${string}`, name: "Alice" },
  { address: "0x2222222222222222222222222222222222222222" as `0x${string}`, name: "Bob" },
  { address: "0x3333333333333333333333333333333333333333" as `0x${string}`, name: "Charlie" },
  { address: "0x4444444444444444444444444444444444444444" as `0x${string}`, name: "Diana" },
];

export default function AddExpense() {
  const { isConnected, address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: smartcontracts.splitwiseGenome as `0x${string}`,
    abi: SplitwiseGenomeAbi,
    functionName: "getGroups",
    args: [address as `0x${string}`],
    chainId: 11155111,
    query: { enabled: Boolean(isConnected && address), refetchOnWindowFocus: false },
  });

  const groups = (data as `0x${string}`[] | undefined) ?? [];

  const [selectedGroup, setSelectedGroup] = useState<`0x${string}` | "">("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseDate, setExpenseDate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [members, setMembers] = useState<IncludedMember[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
    setSuccessMsg(null);
    // Initialize mocked members for the chosen group
    setMembers(MOCK_MEMBERS.map(m => ({ ...m, included: true })));
  }, [selectedGroup]);

  const canSubmit = useMemo(() => {
    const hasIncluded = members.some(m => m.included);
    return (
      isConnected &&
      selectedGroup !== "" &&
      expenseName.trim().length > 0 &&
      expenseDate.trim().length > 0 &&
      Number(amount) > 0 &&
      hasIncluded
    );
  }, [isConnected, selectedGroup, expenseName, expenseDate, amount, members]);

  function toggleIncluded(addr: `0x${string}`) {
    setMembers(prev => prev.map(m => (m.address === addr ? { ...m, included: !m.included } : m)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    if (!isConnected) {
      setLocalError("Connect your wallet first");
      return;
    }
    if (!selectedGroup) {
      setLocalError("Select a group");
      return;
    }
    if (!expenseName.trim()) {
      setLocalError("Enter expense name");
      return;
    }
    if (!expenseDate) {
      setLocalError("Pick a date");
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setLocalError("Enter a valid amount");
      return;
    }
    const included = members.filter(m => m.included).map(m => m.address);
    if (included.length === 0) {
      setLocalError("Select at least one member");
      return;
    }

    // Here we would call the group contract's add-expense method when available.
    // For now, we just show a confirmation.
    console.log("AddExpense payload", {
      group: selectedGroup,
      name: expenseName,
      date: expenseDate,
      amount: parsedAmount,
      members: included,
    });
    setSuccessMsg("Expense prepared. Submit to chain when contract supports it.");
  }

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Add Expense</h2>
        <p className="text-sm text-yellow-300">Connect your wallet to continue.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Add Expense</h2>
        <p className="text-sm text-white/70">Loading groups…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Add Expense</h2>
        <p className="text-sm text-red-400">Failed to load groups.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-xl border border-white/10 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">Add Expense</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Group</label>
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value as `0x${string}` | "")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a group…</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Expense name</label>
          <input
            type="text"
            value={expenseName}
            onChange={e => setExpenseName(e.target.value)}
            placeholder="e.g. Dinner at Sushi Bar"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            value={expenseDate}
            onChange={e => setExpenseDate(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Include members</label>
          {members.length === 0 ? (
            <p className="text-sm text-white/60">No members available.</p>
          ) : (
            <ul className="space-y-2">
              {members.map(m => (
                <li key={m.address} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={m.included} onChange={() => toggleIncluded(m.address)} />
                    <span className="text-sm">{m.name}</span>
                    <span className="font-mono text-[11px] text-white/60 break-all">{m.address}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {localError && <p className="text-sm text-red-400">{localError}</p>}
        {successMsg && <p className="text-sm text-green-400">{successMsg}</p>}

        <div>
          <button type="submit" disabled={!canSubmit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">Add expense</button>
        </div>
      </form>
    </div>
  );
}