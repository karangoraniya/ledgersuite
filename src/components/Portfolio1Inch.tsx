"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { WalletIcon, SearchIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
type TimeRange = "1day" | "1week" | "1month" | "1year" | "3years";

interface PortfolioData {
  totalValueUSD: number;
  totalPnLUSD: number;
  averageRoi: number;
  tokens: TokenData[];
  chainData: ChainData[];
}

interface TokenData {
  chainId: number;
  address: string;
  amount: string;
  price_usd: string;
  value_usd: number;
  abs_profit_usd: number;
  roi: number;
  status: number;
  symbol: string;
  chainName: string;
  formattedValue?: string;
}

interface ChainData {
  chainName: string;
  pnl: number;
  value: number;
}

export const SUPPORTED_CHAINS = [
  { id: 1, name: "Ethereum", symbol: "ETH" },
  { id: 137, name: "Polygon", symbol: "MATIC" },
  { id: 56, name: "BSC", symbol: "BNB" },
  { id: 42161, name: "Arbitrum", symbol: "ARB" },
  { id: 10, name: "Optimism", symbol: "OP" },
  { id: 8453, name: "Base", symbol: "ETH" },
] as const;

const ChainSelector = ({
  selectedChain,
  onChainSelect,
}: {
  selectedChain: string;
  onChainSelect: (chainId: string) => void;
}) => {
  const chains = [
    { id: 1, name: "Ethereum", symbol: "ETH" },
    { id: 137, name: "Polygon", symbol: "MATIC" },
    { id: 56, name: "BSC", symbol: "BNB" },
    { id: 42161, name: "Arbitrum", symbol: "ARB" },
    { id: 10, name: "Optimism", symbol: "OP" },
    { id: 8453, name: "Base", symbol: "ETH" },
  ];

  return (
    <Select value={selectedChain} onValueChange={onChainSelect}>
      <SelectTrigger className="w-[180px] bg-muted text-foreground">
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {chains.map((chain) => (
          <SelectItem key={chain.id} value={chain.id.toString()}>
            {chain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const PortfolioDashboard = () => {
  const [searchAddress, setSearchAddress] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>("1month");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
    null
  );
  const [selectedChain, setSelectedChain] = useState(
    SUPPORTED_CHAINS[0].id.toString()
  );
  const [isChainSwitching, setIsChainSwitching] = useState(false);

  //new
  // const [selectedChain, setSelectedChain] = useState("1"); // Default to Ethereum
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>(
    []
  ); // Specify the type for chartData

  // const [distributionData, setDistributionData] = useState([]);
  const [distributionData, setDistributionData] = useState<
    { name: string; value: number; color: string }[]
  >([]); // Define the type for distributionData

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const processChartData = (tokens: any[]) => {
    // Process token data for charts
    const tokenDistribution = tokens.map((token, index) => ({
      name: token.symbol,
      value: parseFloat(token.price_usd) * parseFloat(token.amount),
      color: COLORS[index % COLORS.length],
    }));

    setDistributionData(tokenDistribution);

    // Create dummy historical data for animation demo
    // In real implementation, this would come from your API
    const historicalData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(
        Date.now() - (29 - i) * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      value:
        tokens.reduce(
          (acc: number, token: { price_usd: string; amount: string }) =>
            acc + parseFloat(token.price_usd) * parseFloat(token.amount),
          0
        ) *
        (0.9 + Math.random() * 0.2),
    }));

    setChartData(historicalData);
  };

  useEffect(() => {
    if (portfolioData?.tokens) {
      processChartData(portfolioData.tokens);
    }
  }, [portfolioData]);
  /// new end

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active: boolean;
    payload: any[];
    label: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatValue = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const fetchPortfolioData = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setIsChainSwitching(true); // Add chain switching state

    try {
      // Use selectedChain instead of hardcoded "1"
      const [currentValueRes, detailsRes, profitLossRes, protocolsRes] =
        await Promise.all([
          fetch(
            `/api/portfolio/current-value?address=${address}&chainId=${selectedChain}`
          ),
          fetch(
            `/api/portfolio/details?address=${address}&chainId=${selectedChain}`
          ),
          fetch(
            `/api/portfolio/profit-loss?address=${address}&chainId=${selectedChain}&timerange=${selectedTimeRange}`
          ),
          fetch(
            `/api/portfolio/protocols?address=${address}&chainId=${selectedChain}`
          ),
        ]);

      const [currentValue, details, profitLoss, protocols] = await Promise.all([
        currentValueRes.json(),
        detailsRes.json(),
        profitLossRes.json(),
        protocolsRes.json(),
      ]);

      // Get current chain info
      const currentChain = SUPPORTED_CHAINS.find(
        (chain) => chain.id.toString() === selectedChain
      );

      // Check if there's no data for this chain
      if (details.result.length === 0) {
        setError(`No assets found on ${currentChain?.name || "this chain"}`);
        setPortfolioData(null);
        return;
      }

      // Process token details with dynamic chain symbol
      const tokens = details.result.map((token: any) => ({
        chainId: token.chain_id,
        address: token.contract_address,
        amount: token.amount.toString(),
        price_usd: token.price_to_usd.toString(),
        value_usd: token.value_usd,
        abs_profit_usd: token.abs_profit_usd,
        roi: token.roi,
        status: token.status,
        symbol:
          token.contract_address ===
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
            ? currentChain?.symbol || "TOKEN"
            : `${currentChain?.name || ""}-Token`,
        chainName: currentChain?.name || "Unknown Chain",
      }));

      // Calculate totals
      const totalValue = currentValue.result.reduce(
        (acc: number, item: any) => {
          return (
            acc +
            item.result.reduce((sum: number, chain: any) => {
              return sum + (chain.value_usd || 0);
            }, 0)
          );
        },
        0
      );

      const totalPnL = profitLoss.result.reduce((acc: number, item: any) => {
        return acc + (item.abs_profit_usd || 0);
      }, 0);

      const averageRoi = profitLoss.result[0]?.roi || 0;

      setPortfolioData({
        totalValueUSD: totalValue,
        totalPnLUSD: totalPnL,
        averageRoi: averageRoi,
        tokens: tokens.filter(
          (token: { status: number; amount: string }) =>
            token.status === 1 && parseFloat(token.amount) > 0
        ),
        chainData: [
          {
            chainName: currentChain?.name || "Unknown Chain",
            pnl: totalPnL,
            value: totalValue,
          },
        ],
      });
    } catch (err) {
      setError(
        `Failed to fetch data from ${
          SUPPORTED_CHAINS.find(
            (chain) => chain.id.toString() === selectedChain
          )?.name
        }. Please try again.`
      );
      console.error("Error fetching portfolio data:", err);
    } finally {
      setIsLoading(false);
      setIsChainSwitching(false);
    }
  };

  const handleChainSwitch = (chain: string) => {
    if (chain === selectedChain) return;
    setSelectedChain(chain);
    if (searchAddress) {
      fetchPortfolioData(searchAddress);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      fetchPortfolioData(searchAddress);
    }
  };

  useEffect(() => {
    if (searchAddress) {
      fetchPortfolioData(searchAddress);
    }
  }, [selectedTimeRange, selectedChain]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          {/* Header Section */}
          <CardHeader className="border-b border-border/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <CardTitle>Portfolio Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your cross-chain portfolio performance
                </p>
              </div>
              <Select
                value={selectedTimeRange}
                onValueChange={(value) =>
                  setSelectedTimeRange(value as TimeRange)
                }
              >
                <SelectTrigger className="w-[180px] bg-muted text-foreground">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">24 Hours</SelectItem>
                  <SelectItem value="1week">1 Week</SelectItem>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="3years">3 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by wallet address..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="pl-10 bg-muted text-foreground"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isLoading || !searchAddress}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </form>

            {/* Chain Selector */}
            <div className="flex justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Chain:</span>
                <ChainSelector
                  selectedChain={selectedChain}
                  onChainSelect={handleChainSwitch}
                />
              </div>
              {portfolioData && (
                <div className="text-sm text-muted-foreground">
                  Viewing assets on{" "}
                  {
                    SUPPORTED_CHAINS.find(
                      (chain) => chain.id.toString() === selectedChain
                    )?.name
                  }
                </div>
              )}
            </div>

            {/* Main Content */}
            {isLoading ? (
              // Loading State
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isChainSwitching
                    ? `Switching to ${
                        SUPPORTED_CHAINS.find(
                          (chain) => chain.id.toString() === selectedChain
                        )?.name
                      }...`
                    : "Fetching portfolio data..."}
                </p>
              </div>
            ) : error ? (
              // Error State
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="text-destructive text-center p-4 bg-destructive/10 rounded-lg">
                  {error}
                </div>
              </div>
            ) : portfolioData ? (
              // Data Display
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Value Card */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-muted/50 p-6 rounded-lg border border-border/50"
                  >
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Total Value
                    </h3>
                    <p className="text-2xl font-bold mt-2">
                      {formatValue(portfolioData.totalValueUSD)}
                    </p>
                  </motion.div>

                  {/* Chart Card */}

                  {/* Portfolio Value Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-muted/50 p-6 rounded-lg border border-border/50"
                  >
                    <h3 className="text-lg font-semibold mb-4">
                      Portfolio Value Over Time
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="colorValue"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#8884d8"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#8884d8"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "var(--foreground)" }}
                            tickLine={{ stroke: "var(--foreground)" }}
                          />
                          <YAxis
                            tick={{ fill: "var(--foreground)" }}
                            tickLine={{ stroke: "var(--foreground)" }}
                            tickFormatter={(value) =>
                              `$${(value / 1000).toFixed(1)}k`
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#f0f0f0",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorValue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Asset Distribution Pie Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-muted/50 p-6 rounded-lg border border-border/50"
                  >
                    <h3 className="text-lg font-semibold mb-4">
                      Asset Distribution
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatValue(Number(value))}
                            contentStyle={{
                              backgroundColor: "var(--background)",
                              border: "1px solid var(--border)",
                              borderRadius: "4px",
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* PnL Card */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-muted/50 p-6 rounded-lg border border-border/50"
                  >
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Total PnL
                    </h3>
                    <p
                      className={`text-2xl font-bold mt-2 ${
                        portfolioData.totalPnLUSD >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {formatValue(portfolioData.totalPnLUSD)}
                    </p>
                  </motion.div>

                  {/* ROI Card */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-muted/50 p-6 rounded-lg border border-border/50"
                  >
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Average ROI
                    </h3>
                    <p
                      className={`text-2xl font-bold mt-2 ${
                        portfolioData.averageRoi >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {(portfolioData.averageRoi * 100).toFixed(2)}%
                    </p>
                  </motion.div>
                </div>

                {/* Token List */}
                {portfolioData.tokens.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Assets</h3>
                      <span className="text-sm text-muted-foreground">
                        {portfolioData.tokens.length} assets found
                      </span>
                    </div>
                    <div className="space-y-2">
                      {portfolioData.tokens.map((token, index) => (
                        <motion.div
                          key={`${token.address}-${token.chainName}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-muted/50 p-4 rounded-lg border border-border/50 flex justify-between items-center hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                              {token.symbol.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{token.symbol}</p>
                              <p className="text-sm text-muted-foreground">
                                {token.chainName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatValue(
                                parseFloat(token.price_usd) *
                                  parseFloat(token.amount)
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {parseFloat(token.amount).toFixed(4)}{" "}
                              {token.symbol}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No assets found on{" "}
                      {
                        SUPPORTED_CHAINS.find(
                          (chain) => chain.id.toString() === selectedChain
                        )?.name
                      }
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try switching to a different chain
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <WalletIcon className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Enter a wallet address to view portfolio details
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Supports multiple chains including Ethereum, Polygon, BSC,
                    and more
                  </p>
                </div>
              </div>
            )}

            {/* Chain Switching Overlay */}
            {isChainSwitching && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PortfolioDashboard;
