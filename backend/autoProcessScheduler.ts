import { autoProcessOrders } from "@/backend/autoProcessOrders";

const POLL_INTERVAL = 60 * 1000; // 60 seconds (1 minute)

async function startScheduler() {
  console.log("🚀 BSNL IPTV Order Automation Started...");

  setInterval(async () => {
    console.log("⏳ Checking for new orders...");
    await autoProcessOrders();
  }, POLL_INTERVAL);
}

startScheduler();
