"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FUNCTION_PATTERNS, SUPPORTED_CHAINS } from "@/lib/helpers";
import { Chain, ERC7730Template } from "@/lib/types";

const ERC7730Generator = () => {
  const [selectedChain, setSelectedChain] = useState<Chain>(
    SUPPORTED_CHAINS[0]
  );
  const [contractAddress, setContractAddress] = useState("");
  const [projectId, setProjectId] = useState("");
  const [owner, setOwner] = useState("");
  const [url, setUrl] = useState("");
  const [legalName, setLegalName] = useState("");
  const [abi, setAbi] = useState("");
  const [generatedTemplate, setGeneratedTemplate] =
    useState<ERC7730Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFunctionType = (functionName: string) => {
    const lowerName = functionName.toLowerCase();
    for (const [type, config] of Object.entries(FUNCTION_PATTERNS)) {
      if (config.patterns.some((pattern) => lowerName.includes(pattern))) {
        return {
          type,
          intent: config.intent,
          color: config.color,
        };
      }
    }
    return null;
  };

  const getInputFormat = (type: string) => {
    if (type.includes("uint") || type.includes("int")) return "amount";
    if (type === "address") return "addressName";
    if (type === "bool") return "boolean";
    if (type.includes("bytes")) return "hex";
    return "raw";
  };

  const parseAbiFunction = (abiFunction: any) => {
    if (abiFunction.type !== "function") return null;

    const functionType = getFunctionType(abiFunction.name);
    if (!functionType) return null;

    const functionSignature = `${abiFunction.name}(${abiFunction.inputs
      .map((i: any) => i.type)
      .join(",")})`;

    return {
      [functionSignature]: {
        $id: abiFunction.name,
        intent: functionType.intent,
        fields: abiFunction.inputs.map((input: any) => ({
          path: input.name || input.type,
          label: input.name ? toHumanReadable(input.name) : input.type,
          format: getInputFormat(input.type),
          ...(input.type === "address" && {
            params: {
              types: ["token"],
            },
          }),
        })),
        required: abiFunction.inputs.map(
          (input: any) => input.name || input.type
        ),
      },
    };
  };

  const toHumanReadable = (str: string) => {
    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  };

  const generateTemplate = () => {
    try {
      const abiJson = JSON.parse(abi);
      const formats = abiJson
        .map(parseAbiFunction)
        .filter(Boolean)
        .reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {});

      const template: ERC7730Template = {
        $schema: "../../specs/erc7730-v1.schema.json",
        context: {
          $id: projectId,
          contract: {
            abi: `${selectedChain.explorer}?module=contract&action=getabi&address=${contractAddress}`,
            deployments: [
              {
                chainId: selectedChain.id,
                address: contractAddress,
              },
            ],
          },
        },
        metadata: {
          owner: owner,
          info: {
            url: url,
            legalName: legalName,
            lastUpdate: new Date().toISOString(),
          },
        },
        display: {
          formats: formats,
        },
      };

      setGeneratedTemplate(template);
    } catch (error) {
      console.error("Error generating template:", error);
      setError("Error generating template. Please check your inputs.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>ERC-7730 Metadata Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block font-medium">Chain</label>
                <Select
                  onValueChange={(value) => {
                    const chain = SUPPORTED_CHAINS.find(
                      (c) => c.id.toString() === value
                    );
                    if (chain) setSelectedChain(chain);
                  }}
                  defaultValue={selectedChain.id.toString()}
                >
                  <SelectTrigger className="w-full bg-muted text-foreground">
                    <SelectValue placeholder="Select Chain" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CHAINS.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Contract Address</label>
                <input
                  type="text"
                  className="w-full bg-muted text-foreground p-2 border rounded placeholder:text-muted-foreground"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Project ID</label>
                <input
                  type="text"
                  className="w-full bg-muted text-foreground p-2 border rounded placeholder:text-muted-foreground"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="e.g., MyProtocolBridge"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Owner</label>
                <input
                  type="text"
                  className="w-full bg-muted text-foreground p-2 border rounded placeholder:text-muted-foreground"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Protocol Owner"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium">URL</label>
                <input
                  type="text"
                  className="w-full bg-muted text-foreground p-2 border rounded placeholder:text-muted-foreground"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Legal Name</label>
                <input
                  type="text"
                  className="w-full bg-muted text-foreground p-2 border rounded placeholder:text-muted-foreground"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Legal Entity Name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Contract ABI</label>
              <textarea
                className="w-full bg-muted text-foreground p-2 border rounded h-48 font-mono text-sm placeholder:text-muted-foreground"
                value={abi}
                onChange={(e) => setAbi(e.target.value)}
                placeholder="Paste contract ABI here"
              />
            </div>

            {error && (
              <div className="text-destructive p-2 rounded bg-destructive/10">
                {error}
              </div>
            )}

            <button
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
              onClick={generateTemplate}
              disabled={!abi}
            >
              Generate Template
            </button>

            {generatedTemplate && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Generated ERC-7730 Template:</h3>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        JSON.stringify(generatedTemplate, null, 2)
                      )
                    }
                    className="text-sm px-3 py-1 bg-muted hover:bg-muted/80 text-foreground rounded"
                  >
                    Copy
                  </button>
                </div>
                <pre className="bg-muted text-foreground p-4 rounded overflow-x-auto text-sm">
                  {JSON.stringify(generatedTemplate, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ERC7730Generator;
