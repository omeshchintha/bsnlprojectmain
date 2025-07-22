// scripts/autoProcessScheduler.ts
import { autoProcessOrders } from "../backend/autoProcessOrders.js";

console.log("🚀 BSNL IPTV Order Automation Scheduler Started...");

setInterval(async () => {
  console.log("⏳ Running every 30 seconds - Checking BSNL orders...");
  try {
    await autoProcessOrders();
  } catch (err: any) {
    console.error("❌ Error:", err.message || err);
  }
}, 30000); // 🔄 10000 ms = 10 seconds


// import { autoProcessOrders } from "@/backend/autoProcessOrders";

// async function continuousProcessor() {
//   console.log("🌀 Continuous IPTV Order Processor Started...");

//   while (true) {
//     try {
//       await autoProcessOrders();
//     } catch (err) {
//       console.error("❌ Error during processing:", err);
//     }

//     // ⏱ Wait for 60 seconds before checking again
//     await new Promise((res) => setTimeout(res, 60000));
//   }
// }

// continuousProcessor();
