import { JsonRpcProvider, ethers } from "ethers";

// import { ethers } from "ethers-v5";

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const NETWORKS: { [key: string]: NetworkConfig } = {
  ethereum_mainnet: {
    name: "Base",
    chainId: 8453,
    rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    symbol: "ETH",
    blockExplorer: "https://base.blockscout.com/",
    isTestnet: false,
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    symbol: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  goerli: {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    symbol: "GoerliETH",
    blockExplorer: "https://sepolia-explorer.base.org",
    isTestnet: true,
  },
};

// Helper to get provider for a network
export const getProvider = (network: NetworkConfig) => {
  return new JsonRpcProvider(network.rpcUrl);
  // return new ethers.providers.JsonRpcProvider(network.rpcUrl);
};
