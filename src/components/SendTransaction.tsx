"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseEther, parseUnits } from "viem";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect, SetStateAction } from "react";
import { ethers, Signature as EthersSignature, Transaction } from "ethers";
import { NetworkConfig } from "@/config/networks";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { BigNumber } from "ethers-v5";
import { useResolveAddress } from "@/hooks/useENS";

interface SendTransactionProps {
  keyringEth: any;
  derivationPath: string;
  address: string;
  network: NetworkConfig;
  provider: any;
}

export const SendTransaction = ({
  keyringEth,
  derivationPath,
  address,
  network,
  provider,
}: SendTransactionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<string>("0");
  const [nonce, setNonce] = useState<number>(0);
  const [gasPrice, setGasPrice] = useState<string>("");
  const { resolvedAddress, error: resolveError } = useResolveAddress(
    recipient,
    "ethereum"
  );
  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setGasPrice("");
  };

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (provider && address) {
        try {
          // Get balance
          const balance = await provider.getBalance(address);
          console.log("Raw balance:", balance); // This is already a bigint
          console.log("Formatted balance (ETH):", ethers.formatEther(balance));
          setBalance(ethers.formatEther(balance));

          // Get nonce
          const nonce = await provider.getTransactionCount(address);
          setNonce(nonce);
          console.log(nonce, address);

          // Get gas price - properly handle BigNumber
          const feeData = await provider.getFeeData();

          const currentGasPrice = await provider.getFeeData();
          // Convert BigNumber to string first to avoid formatting issues
          // const gasPriceString = gasPriceResult.toString();
          setGasPrice(currentGasPrice);

          console.log("Gas Price (original):", currentGasPrice);
          // console.log(
          //   "Gas Price (formatted):",
          //   ethers.formatUnits(gasPriceString, "gwei")
          // );
        } catch (error) {
          console.error("Error fetching account info:", error);
          // Optionally add more specific error handling here
          if (error instanceof Error) {
            console.error("Error details:", error.message);
          }
        }
      }
    };

    fetchAccountInfo();
  }, [provider, address, network]);

  const handleSendTransaction = async () => {
    if (!keyringEth || !recipient || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const toastId = toast.loading("Preparing transaction...");
      const recipientAddress = resolvedAddress || recipient;

      // Get the latest nonce
      const currentNonce = await provider.getTransactionCount(address);
      console.log("Current nonce:", currentNonce);
      console.log("address get", address);
      // Get gas price
      // const feeData = await provider.getFeeData();

      const currentGasPrice = await provider.getFeeData();
      console.log("Current gas price:", currentGasPrice.toString());

      // Convert amount to wei using ethers v5 BigNumber
      const valueInWei = BigNumber.from(ethers.parseEther(amount).toString());
      console.log("Value in wei:", valueInWei.toString());
      console.log("recipientAddress", recipientAddress);
      const transaction = {
        to: recipientAddress,
        gasPrice: currentGasPrice.gasPrice,
        // gasPrice: ethers.parseUnits(currentGasPrice, "wei"),
        gasLimit: 21000,
        nonce: await provider.getTransactionCount(address),
        chainId: network.chainId,
        data: "0x",
        value: ethers.parseEther(amount),
      };

      const txx = Transaction.from(transaction);

      const serializedTx = txx.unsignedSerialized.substring(2);
      console.log("Serialized transaction:", serializedTx);

      // Log the transaction object for debugging
      console.log("Transaction object:", {
        to: txx.to,
        value: txx.value.toString(),
        gasPrice: txx.gasPrice?.toString(),
        gasLimit: txx.gasLimit.toString(),
        nonce: nonce,
        // nonce: txx.nonce,
        chainId: txx.chainId,
        data: txx.data,
      });

      toast.loading("Please confirm the transaction on your Ledger device...", {
        id: toastId,
      });

      // Sign transaction
      keyringEth.signTransaction(derivationPath, txx).observable.subscribe({
        next: async (state: any) => {
          console.log("Sign state:", state);

          if (state.status === DeviceActionStatus.Completed) {
            try {
              // Get the signed transaction hex string
              const signature = state.output;
              console.log("signature in call", signature);
              txx.signature = EthersSignature.from(signature);

              const serializedTx = txx.serialized;
              console.log("serializedTx", serializedTx);
              console.log("signedTx", txx);

              const { hash } = await provider.broadcastTransaction(
                serializedTx
              );
              console.log("Transaction response:", hash);

              toast.success("Transaction sent!", {
                id: toastId,
                description: (
                  <a
                    href={`${network.blockExplorer}/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View on {network.name} Explorer
                  </a>
                ),
              });
              resetForm();
            } catch (broadcastError: any) {
              console.error("Broadcast error:", broadcastError);
              toast.error("Failed to broadcast transaction", {
                id: toastId,
                description:
                  broadcastError?.message || "Unknown broadcast error",
              });
            }
          } else if (state.status === DeviceActionStatus.Error) {
            console.error("Signing error:", state.error);
            toast.error("Failed to sign transaction", {
              id: toastId,
              description: state.error?.message || "Unknown signing error",
            });
          }
        },
        error: (error: any) => {
          console.error("Subscription error:", error);
          toast.error("Transaction failed", {
            id: toastId,
            description: error?.message || "Unknown error occurred",
          });
        },
        complete: () => {
          setIsLoading(false);
        },
      });
    } catch (error: any) {
      console.error("Transaction creation error:", error);
      toast.error("Failed to create transaction", {
        description: error?.message || "Unknown error in transaction creation",
      });
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full">
          <SendHorizontal className="mr-2 h-4 w-4" />
          Send {network.symbol}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Send {network.symbol}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-xs font-mono break-all">From: {address}</p>
                  <p className="text-xs">
                    Balance: {balance} {network.symbol}
                  </p>
                  <p className="text-xs">Network: {network.name}</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <div className="space-y-2">
                <Input
                  id="recipient"
                  placeholder="ENS name or address (0x...)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className={resolveError ? "border-red-500" : ""}
                />
                {resolvedAddress && recipient !== resolvedAddress && (
                  <div className="px-2 py-1 text-xs bg-muted border rounded-md">
                    Resolved: {resolvedAddress}
                  </div>
                )}
                {resolveError && (
                  <div className="px-2 py-1 text-xs text-destructive bg-destructive/10 border-destructive/20 rounded-md">
                    {resolveError}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({network.symbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.0001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gasPrice">Gas Price (Gwei) - Optional</Label>
              <Input
                id="gasPrice"
                type="number"
                placeholder="Enter gas price in Gwei"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
              />
            </div>

            {/* <Button
              className="w-full"
              onClick={handleSendTransaction}
              disabled={isLoading || !recipient || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Send {network.symbol}
                </>
              )}
            </Button> */}
            <Button
              className="w-full"
              onClick={handleSendTransaction}
              disabled={isLoading || !recipient || !amount || !!resolveError}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Send {network.symbol}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
