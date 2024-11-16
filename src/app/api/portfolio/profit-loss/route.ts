import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BASE_URL = "https://api.1inch.dev/portfolio/portfolio/v4";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const chainId = searchParams.get("chainId");
  const timerange = searchParams.get("timerange");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }
  const validTimeranges = ["1day", "1week", "1month", "1year", "3years"];
  if (!validTimeranges.includes(timerange as string)) {
    return NextResponse.json({ error: "Invalid timerange" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${BASE_URL}/overview/erc20/profit_and_loss?addresses=${address}&chain_id=${chainId}&timerange=${timerange}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching profit/loss data:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio data" },
      { status: 500 }
    );
  }
}
