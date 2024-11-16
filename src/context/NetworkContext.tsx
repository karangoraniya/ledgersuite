"use client";

// import { ethers } from "ethers-v5";
import React, { createContext, useContext, useState } from "react";
import { JsonRpcProvider } from "ethers";

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const NETWORKS: { [key: string]: NetworkConfig } = {
  base_mainnet: {
    name: "Base",
    chainId: 8453,
    rpcUrl:
      "https://base-mainnet.g.alchemy.com/v2/BV4ewEkuij6IPYL_GGJ4PRTUcmDlBjvn",
    symbol: "ETH",
    blockExplorer: "https://base.blockscout.com/",
    isTestnet: false,
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl:
      "https://eth-sepolia.g.alchemy.com/v2/BV4ewEkuij6IPYL_GGJ4PRTUcmDlBjvn",
    symbol: "SepoliaETH",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  base: {
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
  // return new ethers.providers.JsonRpcProvider(network.rpcUrl);
  return new JsonRpcProvider(network.rpcUrl);
};

interface NetworkContextType {
  currentNetwork: NetworkConfig;
  setCurrentNetwork: (network: NetworkConfig) => void;
  provider: JsonRpcProvider | null;
  // provider: ethers.providers.JsonRpcProvider | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig>(
    NETWORKS.sepolia
  );
  const [provider, setProvider] = useState<JsonRpcProvider | null>(() =>
    getProvider(NETWORKS.sepolia)
  );
  // useState<ethers.providers.JsonRpcProvider | null>(() =>
  //   getProvider(NETWORKS.sepolia)
  // );

  const handleNetworkChange = (network: NetworkConfig) => {
    setCurrentNetwork(network);
    setProvider(getProvider(network));
  };

  return (
    <NetworkContext.Provider
      value={{
        currentNetwork,
        setCurrentNetwork: handleNetworkChange,
        provider,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};
