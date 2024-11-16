"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { JsonRpcProvider } from "ethers";
import { toast } from "sonner";
import { formatEther } from "ethers";

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer: string;
  isTestnet: boolean;
}

interface Balance {
  formatted: string;
  symbol: string;
  loading: boolean;
}

interface NetworkContextType {
  currentNetwork: NetworkConfig;
  setCurrentNetwork: (network: NetworkConfig) => void;
  provider: JsonRpcProvider | null;
  switchNetwork: (chainId: number) => void;
  availableNetworks: NetworkConfig[];
  isNetworkSwitching: boolean;
  balance: Balance;
  updateBalance: (address: string | null) => Promise<void>;
}

export const NETWORKS: { [key: string]: NetworkConfig } = {
  base_mainnet: {
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
    symbol: "SepoliaETH",
    blockExplorer: "https://eth-sepolia.blockscout.com/",
    isTestnet: true,
  },
  base: {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    symbol: "GoerliETH",
    blockExplorer: "https://base-sepolia.blockscout.com/",
    isTestnet: true,
  },
};

// Helper to get provider for a network
const getProvider = (network: NetworkConfig): JsonRpcProvider | null => {
  try {
    return new JsonRpcProvider(network.rpcUrl);
  } catch (error) {
    console.error("Error creating provider:", error);
    return null;
  }
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig>(
    NETWORKS.sepolia
  );
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [balance, setBalance] = useState<Balance>({
    formatted: "0",
    symbol: NETWORKS.sepolia.symbol,
    loading: false,
  });

  // Convert NETWORKS object to array for easier use in UI
  const availableNetworks = Object.values(NETWORKS);

  // Initialize provider on client-side only
  useEffect(() => {
    setIsMounted(true);
    const initialProvider = getProvider(NETWORKS.sepolia);
    setProvider(initialProvider);
  }, []);

  const updateBalance = useCallback(
    async (address: string | null) => {
      if (!provider || !address) {
        setBalance((prev) => ({ ...prev, formatted: "0", loading: false }));
        return;
      }

      setBalance((prev) => ({ ...prev, loading: true }));
      try {
        const rawBalance = await provider.getBalance(address);
        setBalance({
          formatted: (+formatEther(rawBalance)).toFixed(4),
          symbol: currentNetwork.symbol,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance((prev) => ({ ...prev, loading: false }));
      }
    },
    [provider, currentNetwork.symbol]
  );

  // Update balance when network changes
  useEffect(() => {
    if (isMounted) {
      const lastConnectedAddress = localStorage.getItem("lastConnectedAddress");
      if (lastConnectedAddress) {
        updateBalance(lastConnectedAddress);
      }
    }
  }, [currentNetwork, updateBalance, isMounted]);

  const handleNetworkChange = useCallback(
    (network: NetworkConfig) => {
      setIsNetworkSwitching(true);
      try {
        const newProvider = getProvider(network);
        setCurrentNetwork(network);
        setProvider(newProvider);

        // Update balance with new provider
        const lastConnectedAddress = localStorage.getItem(
          "lastConnectedAddress"
        );
        if (lastConnectedAddress && newProvider) {
          updateBalance(lastConnectedAddress);
        }
      } catch (error) {
        console.error("Error changing network:", error);
        toast.error("Failed to change network");
      } finally {
        setIsNetworkSwitching(false);
      }
    },
    [updateBalance]
  );

  const switchNetwork = useCallback(
    async (chainId: number) => {
      setIsNetworkSwitching(true);
      const targetNetwork = availableNetworks.find(
        (network) => network.chainId === chainId
      );

      if (!targetNetwork) {
        toast.error("Network not supported", {
          description: `Chain ID ${chainId} is not supported`,
        });
        setIsNetworkSwitching(false);
        return;
      }

      try {
        handleNetworkChange(targetNetwork);
        toast.success("Network switched", {
          description: `Successfully switched to ${targetNetwork.name}`,
        });
      } catch (error) {
        console.error("Error switching network:", error);
        toast.error("Failed to switch network", {
          description: "Please try again",
        });
      } finally {
        setIsNetworkSwitching(false);
      }
    },
    [availableNetworks, handleNetworkChange]
  );

  // Don't render until mounted (client-side)
  if (!isMounted) {
    return null;
  }

  return (
    <NetworkContext.Provider
      value={{
        currentNetwork,
        setCurrentNetwork: handleNetworkChange,
        provider,
        switchNetwork,
        availableNetworks,
        isNetworkSwitching,
        balance,
        updateBalance,
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
