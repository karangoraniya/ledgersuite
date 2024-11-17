import { useState, useEffect } from "react";
import { normalize } from "viem/ens";
import { isAddress, hexToBytes } from "viem";
import { getCoderByCoinName } from "@ensdomains/address-encoder";
import { publicClient } from "@/lib/utils";

const COIN_TYPES = {
  BITCOIN: 0,
  ETHEREUM: 60,
  BASE: 2147492101,
};

export function useResolveAddress(input: string, selectedChain: string) {
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEns = input.toLowerCase().endsWith(".eth");

  useEffect(() => {
    const resolveAddress = async () => {
      setIsLoading(true);
      setError(null);
      setResolvedAddress(null);

      if (!input) {
        setIsLoading(false);
        return;
      }

      try {
        let address: string | null = null;

        if (isEns) {
          // Get the resolver for the ENS name
          const coinType =
            selectedChain === "ethereum"
              ? COIN_TYPES.ETHEREUM
              : selectedChain === "base"
              ? COIN_TYPES.BASE
              : selectedChain === "bitcoin"
              ? COIN_TYPES.BITCOIN
              : undefined;

          if (!coinType) {
            throw new Error("Unsupported chain");
          }

          // Resolve ENS name using Viem's publicClient
          const resolved = await publicClient.getEnsAddress({
            name: normalize(input),
            coinType,
          });

          if (resolved) {
            if (selectedChain === "bitcoin") {
              const btcCoder = getCoderByCoinName("btc");
              const dataAsBytes = hexToBytes(resolved as `0x${string}`);
              address = btcCoder.encode(dataAsBytes);
            } else {
              address = resolved;
            }
          }
        } else if (selectedChain === "ethereum" || selectedChain === "base") {
          // For Ethereum and Base, validate the address format
          if (isAddress(input)) {
            address = input;
          }
        } else if (selectedChain === "bitcoin") {
          // For Bitcoin, assume the input is a valid address
          // You might want to add Bitcoin address validation here
          address = input;
        }

        if (address) {
          setResolvedAddress(address);
        } else {
          setError("Invalid address format");
        }
      } catch (err) {
        console.error("Error resolving address:", err);
        setError(
          err instanceof Error ? err.message : "Error resolving address"
        );
      } finally {
        setIsLoading(false);
      }
    };

    resolveAddress();
  }, [input, selectedChain, isEns]);

  return { resolvedAddress, error, isLoading };
}
