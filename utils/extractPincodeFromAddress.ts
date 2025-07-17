// src/utils/extractPincodeFromAddress.ts

export function extractPincodeFromAddress(address: string): string {
  const match = address.match(/\b\d{6}\b/);
  return match ? match[0] : "000000";
}
