import GroupMembers from "@/components/GroupMembers";

export default function Group({ groupAddress }: { groupAddress: `0x${string}` }) {
  return (
    <>
      <GroupMembers groupAddress={groupAddress} />
    </>
  );
}