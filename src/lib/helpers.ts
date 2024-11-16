import { Chain } from "@/lib/types";

export const FUNCTION_PATTERNS = {
  TRANSFER: {
    patterns: ["transfer", "send", "transmit"],
    intent: "Transfer",
    color: "bg-blue-100 text-blue-800",
  },
  APPROVAL: {
    patterns: ["approve", "permit", "allowance"],
    intent: "Approve",
    color: "bg-green-100 text-green-800",
  },
  DEPOSIT: {
    patterns: ["deposit", "stake", "provide"],
    intent: "Deposit",
    color: "bg-purple-100 text-purple-800",
  },
  WITHDRAW: {
    patterns: ["withdraw", "unstake", "remove", "redeem"],
    intent: "Withdraw",
    color: "bg-orange-100 text-orange-800",
  },
  SWAP: {
    patterns: ["swap", "trade", "exchange", "convert"],
    intent: "Swap",
    color: "bg-pink-100 text-pink-800",
  },
};

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 1,
    name: "Ethereum",
    explorer: "https://api.etherscan.io/api",
  },
  {
    id: 8453,
    name: "Base",
    explorer: "https://api.basescan.org/api",
  },
  {
    id: 137,
    name: "Polygon",
    explorer: "https://api.polygonscan.com/api",
  },
  {
    id: 10,
    name: "Optimism",
    explorer: "https://api-optimistic.etherscan.io/api",
  },
  {
    id: 100,
    name: "Gnosis",
    explorer: "https://api.gnosisscan.io/api",
  },
  {
    id: 42161,
    name: "Arbitrum",
    explorer: "https://api.arbiscan.io/api",
  },
];
