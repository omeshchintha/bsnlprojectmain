// pages/api/createOrders.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orders } = body;

  console.log("Received orders to create:", orders);

  return NextResponse.json({ message: "Orders created!", data: orders }, { status: 200 });
}
