// utils/generateChecksum.ts
import * as crypto from "crypto";
import { PRODUCTION_CONFIG } from "@/src/config/productionConfig";

export function generateChecksum(orderId: string, vendorCode: string, phoneNo: string): string {
  const message = `${orderId}|${vendorCode}|${phoneNo}`;
  const secretKey = PRODUCTION_CONFIG.bsnlSecretKey; // ✅ Use env-based key

  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex")
    .toUpperCase();
}
