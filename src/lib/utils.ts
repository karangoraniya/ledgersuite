import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});
