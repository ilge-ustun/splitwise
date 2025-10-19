import GroupMembers from "@/components/GroupMembers";

export default function Group({ groupAddress, initialMembers, onMembersFetched }: {
  groupAddress: `0x${string}`;
  initialMembers?: string[] | undefined;
  onMembersFetched?: (members: string[]) => void;
}) {
  return (
    <>
      <GroupMembers groupAddress={groupAddress} initialMembers={initialMembers} onMembersFetched={onMembersFetched} />
    </>
  );
}