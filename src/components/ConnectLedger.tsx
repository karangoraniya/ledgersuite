"use client";
import { useEffect, useState } from "react";
import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceSdk,
  DeviceSdkBuilder,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDAError,
  GetAddressDAIntermediateValue,
  GetAddressDAOutput,
  KeyringEth,
  KeyringEthBuilder,
} from "@ledgerhq/device-signer-kit-ethereum";
import { firstValueFrom } from "rxjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { WalletIcon, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SendTransaction } from "@/components/SendTransaction";
import { useNetwork } from "@/context/NetworkContext";
import { Copy, Check } from "lucide-react";
import { ethers } from "ethers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { NetworkIcon } from "lucide-react";
interface WalletState {
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
}

interface Balance {
  formatted: string;
  symbol: string;
  loading: boolean;
}

export default function WalletConnection() {
  const [sdk, setSdk] = useState<DeviceSdk | null>(null);
  const [deviceSessionId, setSessionId] = useState<DeviceSessionId>();
  const [connectionError, setConnectionError] = useState<unknown>();
  const [keyringEth, setKeyringEth] = useState<KeyringEth | null>(null);
  const [balance, setBalance] = useState<Balance>({
    formatted: "0",
    symbol: "ETH",
    loading: false,
  });
  const [copied, setCopied] = useState(false);

  const { currentNetwork, provider } = useNetwork();

  // Wallet states
  const [walletState, setWalletState] = useState<WalletState>({
    isConnecting: false,
    isConnected: false,
    address: null,
    error: null,
  });

  // Address states
  const [derivationPath] = useState("44'/60'/0'/0/0");
  const [getAddressOutput, setGetAddressOutput] =
    useState<GetAddressDAOutput>();
  const [getAddressError, setGetAddressError] = useState<
    GetAddressDAError | Error | unknown
  >();
  const [getAddressState, setGetAddressState] =
    useState<
      DeviceActionState<
        GetAddressDAOutput,
        GetAddressDAError,
        GetAddressDAIntermediateValue
      >
    >();

  // Initialize SDK on component mount
  useEffect(() => {
    const initializeSdk = () => {
      const newSdk = new DeviceSdkBuilder().build();
      setSdk(newSdk);
    };

    initializeSdk();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (provider && walletState.address) {
        setBalance((prev) => ({ ...prev, loading: true }));
        try {
          const balance = await provider.getBalance(walletState.address);
          const formatted = ethers.formatEther(balance);
          setBalance({
            formatted: (+formatted).toFixed(4),
            symbol: currentNetwork.symbol || "ETH",
            loading: false,
          });
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchBalance();
    // Set up interval to refresh balance
    const interval = setInterval(fetchBalance, 50000); // every 15 seconds

    return () => clearInterval(interval);
  }, [provider, walletState.address, currentNetwork]);

  const copyAddress = async () => {
    if (walletState.address) {
      await navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Connect to Ledger device
  const connectWallet = async () => {
    if (!sdk) return;

    try {
      setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

      const loadingToastId = toast.loading("Searching for Ledger device...", {
        description: "Please make sure your device is connected and unlocked.",
      });

      const discoveredDevice = await firstValueFrom(sdk.startDiscovering());

      toast.loading("Device found! Establishing connection...", {
        id: loadingToastId,
      });

      const sessionId = await sdk.connect({ deviceId: discoveredDevice.id });

      setConnectionError(undefined);
      setSessionId(sessionId);

      // Create Ethereum keyring and store it in state
      const newKeyringEth = new KeyringEthBuilder({
        sdk,
        sessionId: sessionId,
      }).build();

      setKeyringEth(newKeyringEth);

      toast.loading("Getting Ethereum address...", {
        id: loadingToastId,
        description: "Please confirm on your Ledger device.",
      });

      newKeyringEth
        .getAddress(derivationPath)
        .observable.subscribe((getAddressDAState) => {
          setGetAddressState(getAddressDAState);

          switch (getAddressDAState.status) {
            case DeviceActionStatus.Completed:
              setGetAddressOutput(getAddressDAState.output);
              setWalletState({
                isConnecting: false,
                isConnected: true,
                address: getAddressDAState.output.address,
                error: null,
              });
              toast.success("Successfully connected!", {
                id: loadingToastId,
                description: "Your Ledger wallet is now connected.",
              });
              break;

            case DeviceActionStatus.Error:
              setGetAddressError(getAddressDAState.error);
              setWalletState((prev) => ({
                ...prev,
                isConnecting: false,
                error: "Failed to get address",
              }));
              toast.error("Error", {
                id: loadingToastId,
                description:
                  "Failed to get Ethereum address. Please try again.",
              });
              break;

            default:
              break;
          }
        });
    } catch (error) {
      setConnectionError(error);
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: "Failed to connect wallet",
      }));
      toast.error("Connection failed", {
        description:
          "Unable to connect to Ledger device. Please ensure it's properly connected.",
      });
    }
  };

  const disconnectWallet = () => {
    setSessionId(undefined);
    setKeyringEth(null);
    setWalletState({
      isConnecting: false,
      isConnected: false,
      address: null,
      error: null,
    });
    toast.success("Wallet disconnected", {
      description: "Your Ledger wallet has been disconnected.",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Ledger Wallet</CardTitle>
            <CardDescription>
              Connect your Ledger hardware wallet
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Info Badge */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
          <NetworkIcon className="h-4 w-4" />
          <span className="text-sm">
            {currentNetwork.name}
            {currentNetwork.isTestnet && (
              <span className="ml-1 text-xs text-muted-foreground">
                (Testnet)
              </span>
            )}
          </span>
        </div>

        {/* Error Alert */}
        {walletState.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{walletState.error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {!sdk && (
          <div className="space-y-3">
            <Skeleton className="h-[20px] w-[100px]" />
            <Skeleton className="h-[20px] w-full" />
          </div>
        )}

        {/* Wallet Not Connected State */}
        {sdk && !walletState.isConnected && (
          <Button
            onClick={connectWallet}
            disabled={walletState.isConnecting}
            className="w-full"
          >
            {walletState.isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <WalletIcon className="mr-2 h-4 w-4" />
                Connect Ledger Wallet
              </>
            )}
          </Button>
        )}

        {/* Connected State */}
        {walletState.isConnected && walletState.address && (
          <div className="space-y-4">
            {/* Address and Balance Display */}
            <div className="p-4 rounded-lg border bg-muted">
              <div className="space-y-3">
                {/* First row: Address and Copy button */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="text-sm font-medium mb-1">
                      Connected Address
                    </div>
                    <div className="font-mono text-xs break-all flex items-center gap-2 group">
                      {walletState.address}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={copyAddress}
                            >
                              {copied ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copied ? "Copied!" : "Copy address"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium mb-1">Balance</div>
                    <div className="text-sm">
                      {balance.loading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <span className="font-medium">
                          {balance.formatted} {balance.symbol}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explorer Link */}
                <a
                  href={`${currentNetwork.blockExplorer}/address/${walletState.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-block"
                >
                  View on {currentNetwork.name} Explorer
                </a>
              </div>
            </div>

            {/* Transaction Component */}
            {keyringEth && (
              <SendTransaction
                keyringEth={keyringEth}
                derivationPath={derivationPath}
                address={walletState.address}
                network={currentNetwork}
                provider={provider}
              />
            )}

            {/* Disconnect Button */}
            <Button
              onClick={disconnectWallet}
              variant="destructive"
              className="w-full"
            >
              <WalletIcon className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
