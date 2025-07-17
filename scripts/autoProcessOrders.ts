// scripts/autoProcessOrders.ts

import fs from "fs/promises";
import { format } from "date-fns";
import fetch from "node-fetch";
import dotenv from "dotenv";

import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
import { locationMap } from "../src/config/locationMap.js";
import { locationAliases } from "../src/config/locationAliases.js";
import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";
import { getFreshToken } from "../utils/getToken";

dotenv.config();

interface Order {
  ORDER_ID: string;
  ORDER_DATE: string;
  CUSTOMER_NAME: string;
  CIRCLE_CODE: string;
  BA_CODE: string;
  RMN?: string;
  PHONE_NO?: string;
  EMAIL?: string;
  ADDRESS?: string;
  installation_pincode?: string;
}

interface OrderApiResponse {
  ROWSET: Order[];
}

// 🗄️ orders-log.json కు రాయడానికి helper
async function logOrders(orders: Order[]) {
  const timestamp = new Date().toISOString();
  const entry = orders.map(o => ({ ...o, loggedAt: timestamp }));
  const token = await getFreshToken();

  await fs.appendFile("orders-log.json", JSON.stringify(entry, null, 2) + ",\n");
}

export async function autoProcessOrders(): Promise<void> {
  console.log("🟢 Auto Create start...");

  try {
    // 1️⃣ BSNL orders ఫెచ్
    const ordersRes = await fetch(
      "https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          EKEY: process.env.EKEY || "",
        },
        body: JSON.stringify({
          vendorCode: "IPTV_ULKA_TV",
          iptvStatus: "Open",
        }),
      }
    );
    const ordersData = (await ordersRes.json()) as OrderApiResponse;

    // 2️⃣ **లాగ్**: fetch అయిన అన్ని orders లోకల్ ఫైల్‌లో రాసేదుకు
    const allOrders = ordersData.ROWSET || [];
    await logOrders(allOrders);

    // 3️⃣ filter only latest 1-hour orders
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const orders = allOrders.filter(order => {
      if (!order.ORDER_DATE) return false;
      try {
        const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split('/');
        const [yyyy, time] = yyyyAndTime.split(' ');
        const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
        return orderDate > oneHourAgo;
      } catch {
        return false;
      }
    });

    console.log("📦 Received Orders:", orders.length);
    console.log("🧾 Orders Preview:", orders.slice(0, 2));

    // …ఈ తర్వాత మిగతా process మీ దగ్గర ఉన్న కోడ్ ప్రకారం…
    
  } catch (err: any) {
    console.error("❌ Auto Process Error:", err.message);
  }
}
