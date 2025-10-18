import {
  arbitrumSepolia,
  gnosis,
} from '@reown/appkit/networks';

export { arbitrumSepolia, gnosis } from '@reown/appkit/networks';

// export const bellecour: AppKitNetwork = {
//   id: 0x86,
//   name: 'iExec Sidechain',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'xRLC',
//     symbol: 'xRLC',
//   },
//   rpcUrls: {
//     public: { http: ['https://bellecour.iex.ec'] },
//     default: { http: ['https://bellecour.iex.ec'] },
//   },
//   blockExplorers: {
//     etherscan: {
//       name: 'Blockscout',
//       url: 'https://blockscout-bellecour.iex.ec',
//     },
//     default: { name: 'Blockscout', url: 'https://blockscout-bellecour.iex.ec' },
//   },
// };

// Explorer slugs mapping for iExec explorer
export const explorerSlugs: Record<number, string> = {
  134: 'bellecour', // iExec Sidechain (Bellecour)
  42161: 'arbitrum-mainnet', // Arbitrum One
  421614: 'arbitrum-sepolia-testnet', // Arbitrum Sepolia
  100: 'gnosis-chain', // Gnosis
};

const wagmiNetworks = {
  arbitrumSepolia,
  gnosis,
};

export default wagmiNetworks;
