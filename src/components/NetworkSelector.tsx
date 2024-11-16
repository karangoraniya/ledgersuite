"use client";

import React, { createContext, useContext, useState } from "react";
import { JsonRpcProvider } from "ethers";
import { getProvider, NetworkConfig, NETWORKS } from "@/config/networks";
// import { ethers } from "ethers-v5";

interface NetworkContextType {
  currentNetwork: NetworkConfig;
  setCurrentNetwork: (network: NetworkConfig) => void;
  // provider: ethers.providers.JsonRpcProvider | null;
  provider: JsonRpcProvider | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig>(
    NETWORKS.sepolia
  );
  // useState<ethers.providers.JsonRpcProvider | null>(() =>
  const [provider, setProvider] = useState<JsonRpcProvider | null>(() =>
    getProvider(NETWORKS.sepolia)
  );

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
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};
