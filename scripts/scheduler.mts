// scripts/scheduler.mts
import { autoProcessOrders } from "@/backend/autoProcessOrders";

import cron from "node-cron";

cron.schedule("*/10 * * * *", async () => {
  console.log("⏰ Running IPTV Auto Processor...");
  await autoProcessOrders();
});
