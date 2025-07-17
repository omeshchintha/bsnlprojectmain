// app/api/proxy-orders/generate-checksum.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { generateChecksum } from "../../../../utils/generateChecksum";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId, vendorCode, phoneNo } = req.body;

  if (!orderId || !vendorCode || !phoneNo) {
    return res.status(400).json({ error: "Missing input fields" });
  }

  const checksum = generateChecksum(orderId, vendorCode, phoneNo);
  res.status(200).json({ checksum });
}
