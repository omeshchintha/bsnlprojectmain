// pages/api/updateBsnlOrder.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const bsnlPayload = req.body;

    const response = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        EKEY: "b28272183c64fcb45b11d9098a7dd97df51f89bc1bae9448e4126258fd9446d1", // ✅ working EKEY
      },
      body: JSON.stringify(bsnlPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🟥 BSNL Error:", data);
      return res.status(response.status).json({ error: "BSNL API Error", details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ BSNL API Error:", err);
    return res.status(500).json({ error: "BSNL API Error" });
  }
}
