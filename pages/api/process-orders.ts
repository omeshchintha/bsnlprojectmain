// // pages/api/process-orders.ts
// import type { NextApiRequest, NextApiResponse } from 'next';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   try {
//     // Example: log request
//     console.log("Received order:", req.body);

//     // You can add processing logic here
//     res.status(200).json({ message: "Orders processed" });
//   } catch (err) {
//     console.error("Error in /api/process-orders:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }


// pages/api/process-orders.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { autoProcessOrders } from "../../backend/autoProcessOrders";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    await autoProcessOrders(); // ✅ orders ni process cheyyadam
    return res.status(200).json({ message: "Orders processed" });
  } catch (err: any) {
    console.error("❌ Error in handler:", err);
    return res.status(500).json({ message: "Processing failed", error: err?.message });
  }
}
