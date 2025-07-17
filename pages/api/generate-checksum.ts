// pages/api/generate-checksum.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createHmac } from "crypto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  
  const { orderId, vendorCode, phoneNo } = req.body;

  if (!orderId || !vendorCode || !phoneNo) {
    return res.status(400).json({ error: "Missing input fields" });
  }

  const secretKey = process.env.BSNL_EKEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Missing BSNL_EKEY in environment" });
  }

  const message = `${orderId}|${vendorCode}|${phoneNo}`;
  const checksum = createHmac("sha256", secretKey)
    .update(message)
    .digest("hex")
    .toUpperCase();

  res.status(200).json({ checksum });
}
