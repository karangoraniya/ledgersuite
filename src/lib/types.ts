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
