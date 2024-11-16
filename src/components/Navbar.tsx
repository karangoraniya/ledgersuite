"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletIcon, NetworkIcon, Loader2 } from "lucide-react";
import { useNetwork } from "@/context/NetworkContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Navbar = () => {
  const {
    currentNetwork,
    switchNetwork,
    availableNetworks,
    isNetworkSwitching,
    balance,
  } = useNetwork();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <WalletIcon className="h-6 w-6 mr-2" />
              <Link href="/">
                <span className="text-lg font-semibold">LedgerSuite</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <Link
                href="/portfolio"
                className="text-foreground/80 hover:text-foreground transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Portfolio
              </Link>
              <Link
                href="/generator"
                className="text-foreground/80 hover:text-foreground transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                ERC7730 Generator
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Balance Display */}
            {window.localStorage.getItem("lastConnectedAddress") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center bg-muted px-3 py-1.5 rounded-md text-sm">
                      <WalletIcon className="h-4 w-4 mr-2" />
                      {balance.loading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        <span>
                          {balance.formatted} {balance.symbol}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Wallet Balance</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Network Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  disabled={isNetworkSwitching}
                >
                  {isNetworkSwitching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <NetworkIcon className="h-4 w-4" />
                  )}
                  <span>{currentNetwork.name}</span>
                  {currentNetwork.isTestnet && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Testnet
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {availableNetworks.map((network) => (
                  <DropdownMenuItem
                    key={network.chainId}
                    onClick={() => switchNetwork(network.chainId)}
                    className="flex items-center justify-between"
                    disabled={network.chainId === currentNetwork.chainId}
                  >
                    <div className="flex items-center space-x-2">
                      <NetworkIcon className="h-4 w-4" />
                      <span>{network.name}</span>
                    </div>
                    {network.isTestnet && (
                      <Badge variant="secondary" className="text-xs">
                        Testnet
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
