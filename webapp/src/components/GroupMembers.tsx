export default function GroupMembers({ groupAddress }: { groupAddress: `0x${string}` }) {
  return (
    <div>
      <h3>Group Members</h3>
      <p>{groupAddress}</p>
    </div>
  );
}