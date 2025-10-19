"use client";

import { useEffect, useMemo, useState } from "react";

type IncludedMember = { address: `0x${string}`; included: boolean };

export default function AddExpense({ groupAddress, members: memberAddresses }: { groupAddress: `0x${string}`; members: `0x${string}`[] }) {
  const [expenseName, setExpenseName] = useState("");
  const [expenseDate, setExpenseDate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [members, setMembers] = useState<IncludedMember[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
    setSuccessMsg(null);
    setMembers((memberAddresses ?? []).map(addr => ({ address: addr, included: true })));
  }, [memberAddresses]);

  const canSubmit = useMemo(() => {
    const hasIncluded = members.some(m => m.included);
    return (
      Boolean(groupAddress) &&
      expenseName.trim().length > 0 &&
      expenseDate.trim().length > 0 &&
      Number(amount) > 0 &&
      hasIncluded
    );
  }, [groupAddress, expenseName, expenseDate, amount, members]);

  function toggleIncluded(addr: `0x${string}`) {
    setMembers(prev => prev.map(m => (m.address === addr ? { ...m, included: !m.included } : m)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    if (!groupAddress) {
      setLocalError("Invalid group address");
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
      group: groupAddress,
      name: expenseName,
      date: expenseDate,
      amount: parsedAmount,
      members: included,
    });
    setSuccessMsg("Expense prepared. Submit to chain when contract supports it.");
  }

  console.log("=======members in AddExpense", members)
  return (
    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
      <h3 className="text-lg font-semibold">Add Expense</h3>

      <form onSubmit={onSubmit} className="space-y-4">
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

         <div className="space-y-2 w-full">
          <label className="block text-sm font-medium">Include members</label>
          {members.length === 0 ? (
            <p className="text-sm ">No members available.</p>
          ) : (
             <ul>
              {members.map(m => (
                 <li key={m.address}>
                  <label>
                    <input style={{ all: 'revert' }} type="checkbox" checked={m.included} onChange={() => toggleIncluded(m.address)} />
                    <span> {m.address}</span>
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