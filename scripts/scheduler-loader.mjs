// scripts/scheduler.mts
// ✅ scripts/scheduler.mts
import cron from "node-cron";
import { autoProcessOrders } from "../backend/autoProcessOrders.js";

import dotenv from "dotenv";
dotenv.config();

const startScheduler = () => {
  console.log("⏰ IPTV Auto Processor Scheduler Started");

  // Run immediately once
  autoProcessOrders();

  // Every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("🔁 Running IPTV Auto Processor...");
    await autoProcessOrders();
  });
};

startScheduler();

