import GroupMembers from "@/components/GroupMembers";
import AddExpense from "@/components/AddExpense";

export default function Group({ groupAddress, initialMembers, onMembersFetched }: {
  groupAddress: `0x${string}`;
  initialMembers?: string[] | undefined;
  onMembersFetched?: (members: string[]) => void;
}) {
  return (
    <>
      <GroupMembers groupAddress={groupAddress} initialMembers={initialMembers} onMembersFetched={onMembersFetched} />
      <AddExpense groupAddress={groupAddress} members={(initialMembers ?? []) as `0x${string}`[]} />
    </>
  );
}