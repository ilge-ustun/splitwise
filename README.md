# Split3
Privacy-first, on-chain Splitwise for frens. Split bills, track debts, and settle up in crypto.

## Architecture
- Contracts (Sepolia)
  - `SplitwiseGenome`: clones `Group` (EIP‑1167), initializes with name + iExec Protected Data address, indexes group per user.
  - `Group`: stores `name`, `pd_members` (dataset), `expenses[]`, `debts`.
- iApp (Arbitrum Sepolia 421614)
  - Confidential app reads encrypted members and outputs `result.json`.
- Webapp (Next.js + wagmi)
  - Lists user groups, reads group dataset address, runs iExec job, shows members, then allows adding expenses locally.

## Data flow
1) Protect members (iExec): create dataset `{ members: { "0": "0x..." } }` and grant iApp access to owner + members.
2) Deploy group (contract): `createGroup(users[], name, pd_members)` → group address stored for each user.
3) View group: read `getPdMembers()` → `processProtectedData({ path: "result.json" })` → parse and display members.
4) Add expense: UI uses the fetched member addresses (future on-chain write).

## Deployment
Prereqs: Node 18+, wallet with ETH (Sepolia, Arbitrum Sepolia), requester with staked RLC.

1) Contracts
- Set `groupImplementation` in `webapp/src/const/smartcontracts.ts` if changed.
- Deploy `SplitwiseGenome` and `Group`

2) iApp (Arbitrum Sepolia)
- Build and deploy with `iapp` CLI from `iapp/crypto-splitwise`.
- Publish a 0-price App Order (owner wallet, correct TEE tag).

3) Webapp
- `cd webapp && cp .env.local.example .env.local` (create if needed) and set:
  - `NEXT_PUBLIC_IEXEC_APP_ARBITRUM_SEPOLIA=0xYourIAppAddress`
  - `NEXT_PUBLIC_IEXEC_MAX_APP_PRICE=0`
  - `NEXT_PUBLIC_IEXEC_MAX_DATA_PRICE=0`
  - `NEXT_PUBLIC_IEXEC_MAX_WORKERPOOL_PRICE=1000000000`
- `npm i && npm run dev`

4) Usage
- Create dataset and grants via the UI (StepProtect), then deploy a group.
- Open a group → switch to Arbitrum Sepolia when prompted → view members.
- Add expense: UI uses the fetched member addresses (future on-chain write).

## TODO:
- Show expenses and debts in the group
- Simplify debts and store them in iExec Protected Data

- **Secret payout address**: Users sign in with their wallet, and add a secret wallet address that is stored in iExec Protected Data and is used to for sending the tokens to them.
- **Private payments**: using Zama private tokens.
  - Deploy contract to wrap/unwrap ERC20 to Zama private tokens.
  - Members who owe send private tokens to the iApp wallet
  - When all debts are settled, the iApp wallet sends private tokens to the members who are owed.
- **Multichain**: separate vaults per chain: debtors repay on their preferred chain; creditors are just happy to get repaid.
