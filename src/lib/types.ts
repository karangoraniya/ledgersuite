//chain type
export type Chain = {
  id: number;
  name: string;
  explorer: string;
  apiKey?: string;
};

//template Type
export type ERC7730Template = {
  $schema: string;
  context: {
    $id: string;
    contract: {
      abi: string;
      deployments: Array<{
        chainId: number;
        address: string;
      }>;
    };
  };
  metadata: {
    owner: string;
    info: {
      url: string;
      legalName: string;
      lastUpdate: string;
    };
  };
  display: {
    formats: Record<
      string,
      {
        $id: string;
        intent: string;
        fields: Array<{
          path: string;
          label: string;
          format: string;
          params?: {
            types?: string[];
          };
        }>;
        required: string[];
      }
    >;
  };
};

// API ROutes

export type TimeRange = "1day" | "1week" | "1month" | "1year" | "3years";

export interface ChainAPi {
  id: number;
  name: string;
  symbol: string;
}

export interface PortfolioData {
  totalValueUSD: number;
  totalPnLUSD: number;
  averageRoi: number;
  tokens: Token[];
}

export interface Token {
  symbol: string;
  address: string;
  chainName: string;
  price_usd: string;
  amount: string;
  chainId: number;
}

export interface PortfolioData {
  totalValueUSD: number;
  totalPnLUSD: number;
  averageRoi: number;
  chainData: ChainAPi[];
  tokens: Token[];
}
