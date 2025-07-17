// import cron from "node-cron";
// import fetch from "node-fetch";

// // Run every day at 8:00 AM
// cron.schedule("0 8 * * *", async () => {
//   console.log("⏰ Running scheduled task (8:00 AM)...");

//   try {
//     const res = await fetch("http://localhost:3000/api/process-orders", {
//       method: "POST",
//     });

//     const data = await res.json() as { message: string };
//     console.log(`✅ ${data.message}`);
//   } catch (err) {
//     console.error("⛔ Failed to call process-orders API:", err);
//   }
// });



// //scripts/scheduler.ts
// import { autoProcessOrders } from "../backend/autoProcessOrders";
// import dotenv from "dotenv";
// dotenv.config();

// let isProcessing = false;

// const runProcessor = async () => {
//   if (isProcessing) {
//     console.log("⚠️ Still processing previous run. Skipping this cycle...");
//     return;
//   }

//   isProcessing = true;
//   console.log("🔁 Running IPTV Auto Processor...");
//   try {
//     await autoProcessOrders();
//     console.log("✅ Completed current run.");
//   } catch (error) {
//     console.error("❌ Error in Auto Processor:", error);
//   } finally {
//     isProcessing = false;
//   }
// };

// // First run immediately
// runProcessor();

// // Schedule every 30 minutes
// setInterval(runProcessor, 30 * 60 * 1000); // 30 * 60 * 1000 ms = 30 mins

// scripts/scheduler.ts
// import { autoProcessOrders } from "../backend/autoProcessOrders";
// import dotenv from "dotenv";
// dotenv.config();

// let isProcessing = false;

// // 🛠️ Just schedule, no immediate auto-run here
// const runProcessor = async () => {
//   if (isProcessing) {
//     console.log("⚠️ Still processing previous run. Skipping this cycle...");
//     return;
//   }

//   isProcessing = true;
//   console.log("🔁 Running IPTV Auto Processor...");
//   try {
//     const orders = await autoProcessOrders();      // I changed this to return Order[]
//     console.log("📦 Final Orders Details:", JSON.stringify(orders, null, 2));
//     console.log("✅ Completed current run.");
//   } catch (error) {
//     console.error("❌ Error in Auto Processor:", error);
//   } finally {
//     isProcessing = false;
//   }
// };

// // Schedule every 30 minutes, first run after 30 min
// setInterval(runProcessor, 30 * 60 * 1000);
// runProcessor(); // 👉 oka sari matrame instant run

// //scripts/scheduler.ts

// scripts/scheduler.ts
import cron from "node-cron";
import { autoProcessOrders } from "../backend/autoProcessOrders.js";

cron.schedule("*/10 * * * * *", async () => {
  console.log("⏰ Running IPTV Auto Processor every 10 seconds...");
  await autoProcessOrders();
});
