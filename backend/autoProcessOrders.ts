// // ✅ autoProcessOrders.ts (Complete with Debugging)
// import fs from "fs";
// import { format } from "date-fns";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
// import { locationMap } from "../src/config/locationMap.js";
// import { locationAliases } from "../src/config/locationAliases.js";
// import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";

// dotenv.config();

// interface Order {
//   ORDER_ID: string;
//   ORDER_DATE: string;
//   CUSTOMER_NAME: string;
//   CIRCLE_CODE: string;
//   BA_CODE: string;
//   RMN?: string;
//   PHONE_NO?: string;
//   EMAIL?: string;
//   ADDRESS?: string;
//   installation_pincode?: string;
// }

// interface OrderApiResponse {
//   ROWSET: Order[];
// }

// interface ExistingMobileResponse {
//   message?: string;
// }

// interface SubscriberResponse {
//   success: boolean;
//   status: number;
//   data?: {
//     id?: number;
//   };
// }

// interface ChecksumResponse {
//   checksum?: string;
// }

// interface BsnlUpdateResponse {
//   ROWSET?: { REMARKS?: string }[];
//   STATUS?: string;
// }

// function getLastProcessedDate(): Date {
//   try {
//     const dateStr = fs.readFileSync("lastProcessedOrderDate.txt", "utf-8").trim();
//     const [dd, MM, yyyyAndTime] = dateStr.split("/");
//     const [yyyy, time] = yyyyAndTime.split(" ");
//     return new Date(`${yyyy}-${MM}-${dd}T${time}`);
//   } catch {
//     return new Date("2000-01-01T00:00:00");
//   }
// }

// function saveLastProcessedDate(orderDate: string) {
//   fs.writeFileSync("lastProcessedOrderDate.txt", orderDate, "utf-8");
// }

// async function tryCheckExisting(mobile: string, order: Order): Promise<ExistingMobileResponse | null> {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const res = await fetch(`http://localhost:3000/api/existingMobiles`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phoneNo: mobile, orderId: order.ORDER_ID, vendorCode: "IPTV_ULKA_TV" }),
//       });
//       return (await res.json()) as ExistingMobileResponse;
//     } catch (e: any) {
//       console.warn(`📡 Retry existingMobiles (${i + 1}/3):`, e.message);
//       await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
//     }
//   }
//   return null;
// }

// export async function autoProcessOrders(): Promise<void> {
//   console.log("🟢 Auto Create start...");

//   const token = process.env.NEXT_PUBLIC_PROD_TOKEN;
//   if (!token) {
//     console.error("❌ Missing Bearer Token in .env (NEXT_PUBLIC_PROD_TOKEN)");
//     return;
//   }

//   const lastProcessedDate = getLastProcessedDate();
//   console.log("📍 Last Processed Order Date:", lastProcessedDate.toISOString());

//   try {
//     const ordersRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//       body: JSON.stringify({ vendorCode: "IPTV_ULKA_TV", iptvStatus: "Open" }),
//     });

//     const ordersData = (await ordersRes.json()) as OrderApiResponse;
//     const allOrders = ordersData.ROWSET || [];

//     const orders = allOrders.filter((order) => {
//       try {
//         const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split("/");
//         const [yyyy, time] = yyyyAndTime.split(" ");
//         const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
//         return orderDate > lastProcessedDate;
//       } catch {
//         return false;
//       }
//     });

//     console.log("📦 Received New Orders:", orders.length);
//     console.log("🖾 Orders Preview:", orders.slice(0, 2));

//     const processedPhones = new Set<string>();

//     for (const order of orders) {
//       const mobile = order.RMN || order.PHONE_NO || "9999999999";
//       if (processedPhones.has(mobile)) continue;

//       const existing = await tryCheckExisting(mobile, order);
//       console.log(`✅ Check Existing Done for: ${mobile} → ${existing?.message || "Not Registered"}`);
//       if (existing?.message === "Already Registered") continue;

//       const address = order.ADDRESS || "N/A";
//       const pincode = extractPincodeFromAddress(address);

//       let locKey = order.BA_CODE || order.CIRCLE_CODE;
//       if (locationAliases[locKey]) locKey = locationAliases[locKey];
//       const locInfo = locationMap[locKey] || {
//         sublocation_id: PRODUCTION_CONFIG.sublocationId,
//         cdn_id: PRODUCTION_CONFIG.cdnId,
//       };

//       const subPayload = {
//         billing_address: { addr: address, pincode },
//         fname: order.CUSTOMER_NAME || "N/A",
//         mname: "",
//         lname: "Customer",
//         mobile_no: mobile,
//         phone_no: "",
//         email: order.EMAIL?.trim() || "user@example.com",
//         installation_address: address,
//         pincode: order.installation_pincode || "138871",
//         formno: "",
//         gender: PRODUCTION_CONFIG.defaultGender,
//         dob: null,
//         customer_type: PRODUCTION_CONFIG.customerType,
//         sublocation_id: locInfo.sublocation_id,
//         cdn_id: locInfo.cdn_id,
//         flatno: "1",
//         floor: "1",
//       };

//       console.log("📤 Creating Subscriber with Payload:", subPayload);
//       const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify(subPayload),
//       });

//       const subData = (await subRes.json()) as SubscriberResponse;
//       const subscriberId = subData?.data?.id;
//       console.log("🎫 Subscriber Response:", subData);
//       if (!subscriberId) continue;

//       const acctPayload = {
//         subscriber_id: subscriberId,
//         iptvuser_id: mobile,
//         iptvuser_password: "Bsnl@123",
//         scheme_id: PRODUCTION_CONFIG.schemeId,
//         bouque_ids: PRODUCTION_CONFIG.bouquetIds,
//         rperiod_id: PRODUCTION_CONFIG.rperiodId,
//         cdn_id: locInfo.cdn_id,
//         sublocation_id: locInfo.sublocation_id,
//       };

//       console.log("📤 Creating Account with Payload:", acctPayload);
//       const acctRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/account?vr=railtel1.1`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify(acctPayload),
//       });

//       console.log("🎫 Account Creation Status:", acctRes.status);
//       if (!acctRes.ok) continue;

//       const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           orderId: order.ORDER_ID,
//           vendorCode: "IPTV_ULKA_TV",
//           phoneNo: order.PHONE_NO,
//         }),
//       });

//       const chkData = (await checksumRes.json()) as ChecksumResponse;
//       const checksum = chkData?.checksum;
//       console.log("🔐 Generated Checksum:", checksum);
//       if (!checksum) continue;

//       const bsnlPayload = {
//         iptvorderdata: {
//           activity: "SUB_CREATED",
//           orderId: order.ORDER_ID,
//           phoneNo: order.PHONE_NO,
//           vendorCode: "IPTV_ULKA_TV",
//           iptvStatus: "Active",
//           subsId: mobile,
//           orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
//           remarks: "SUB_CREATED",
//           checksum,
//         },
//       };

//       console.log("📡 Sending to BSNL:", JSON.stringify(bsnlPayload, null, 2));
//       const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
//         method: "POST",
//         headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//         body: JSON.stringify(bsnlPayload),
//       });

//       const bsnlUpdateData = await bsnlUpdateRes.json() as BsnlUpdateResponse;
//       const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
//       const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

//       console.log("📨 BSNL Response:", bsnlUpdateData);

//       if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
//         console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
//         saveLastProcessedDate(order.ORDER_DATE);
//       } else {
//         console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
//       }

//       processedPhones.add(mobile);
//       console.log(`✅ Order ${order.ORDER_ID} processed.`);
//     }
//   } catch (err: any) {
//     console.error("❌ Auto Process Error:", err.message);
//   }
// }

// // Trigger once for now
// autoProcessOrders();

// // ✅ autoProcessOrders.ts (Complete with Debugging)
// import fs from "fs";
// import { format } from "date-fns";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
// import { locationMap } from "../src/config/locationMap.js";
// import { locationAliases } from "../src/config/locationAliases.js";
// import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";

// dotenv.config();

// interface Order {
//   ORDER_ID: string;
//   ORDER_DATE: string;
//   CUSTOMER_NAME: string;
//   CIRCLE_CODE: string;
//   BA_CODE: string;
//   RMN?: string;
//   PHONE_NO?: string;
//   EMAIL?: string;
//   ADDRESS?: string;
//   installation_pincode?: string;
// }

// interface OrderApiResponse {
//   ROWSET: Order[];
// }

// interface ExistingMobileResponse {
//   message?: string;
// }

// interface SubscriberResponse {
//   success: boolean;
//   status: number;
//   data?: {
//     id?: number;
//   };
// }

// interface ChecksumResponse {
//   checksum?: string;
// }

// interface BsnlUpdateResponse {
//   ROWSET?: { REMARKS?: string }[];
//   STATUS?: string;
// }

// function getLastProcessedDate(): Date {
//   try {
//     const dateStr = fs.readFileSync("lastProcessedOrderDate.txt", "utf-8").trim();
//     const [dd, MM, yyyyAndTime] = dateStr.split("/");
//     const [yyyy, time] = yyyyAndTime.split(" ");
//     return new Date(`${yyyy}-${MM}-${dd}T${time}`);
//   } catch {
//     return new Date("2000-01-01T00:00:00");
//   }
// }

// function saveLastProcessedDate(orderDate: string) {
//   fs.writeFileSync("lastProcessedOrderDate.txt", orderDate, "utf-8");
// }

// async function tryCheckExisting(mobile: string, order: Order): Promise<ExistingMobileResponse | null> {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const res = await fetch(`http://localhost:3000/api/existingMobiles`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phoneNo: mobile, orderId: order.ORDER_ID, vendorCode: "IPTV_ULKA_TV" }),
//       });
//       return (await res.json()) as ExistingMobileResponse;
//     } catch (e: any) {
//       console.warn(`📡 Retry existingMobiles (${i + 1}/3):`, e.message);
//       await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
//     }
//   }
//   return null;
// }

// export async function autoProcessOrders(): Promise<void> {
//   console.log("🟢 Auto Create start...");

//   const token = process.env.NEXT_PUBLIC_PROD_TOKEN;
//   if (!token) {
//     console.error("❌ Missing Bearer Token in .env (NEXT_PUBLIC_PROD_TOKEN)");
//     return;
//   }

//   const lastProcessedDate = getLastProcessedDate();
//   console.log("📍 Last Processed Order Date:", lastProcessedDate.toISOString());

//   try {
//     const ordersRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//       body: JSON.stringify({ vendorCode: "IPTV_ULKA_TV", iptvStatus: "Open" }),
//     });

//     const ordersData = (await ordersRes.json()) as OrderApiResponse;
//     const allOrders = ordersData.ROWSET || [];

//     const orders = allOrders.filter((order) => {
//       try {
//         const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split("/");
//         const [yyyy, time] = yyyyAndTime.split(" ");
//         const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
//         return orderDate > lastProcessedDate;
//       } catch {
//         return false;
//       }
//     });

//     console.log("📦 Received New Orders:", orders.length);
//     console.log("🖾 Orders Preview:", orders.slice(0, 2));

//     const processedPhones = new Set<string>();

//     for (const order of orders) {
//     // inside for (const order of orders) { ... } loop lo update cheyyali

//     const mobile = order.RMN || order.PHONE_NO || "9999999999";
//     if (processedPhones.has(mobile)) continue;

//     const existing = await tryCheckExisting(mobile, order);
//     const isExisting = existing?.message === "Already Registered";
//     console.log(`✅ Check Existing Done for: ${mobile} → ${isExisting ? "Already Registered" : "New User"}`);

//     // Always create subscriber
//     const address = order.ADDRESS || "N/A";
//     const pincode = extractPincodeFromAddress(address);

//     let locKey = order.BA_CODE || order.CIRCLE_CODE;
//     if (locationAliases[locKey]) locKey = locationAliases[locKey];
//     const locInfo = locationMap[locKey] || {
//       sublocation_id: PRODUCTION_CONFIG.sublocationId,
//       cdn_id: PRODUCTION_CONFIG.cdnId,
//     };

//     const subPayload = {
//       billing_address: { addr: address, pincode },
//       fname: order.CUSTOMER_NAME || "N/A",
//       mname: "",
//       lname: "Customer",
//       mobile_no: mobile,
//       phone_no: "",
//       email: order.EMAIL?.trim() || "user@example.com",
//       installation_address: address,
//       pincode: order.installation_pincode || "138871",
//       formno: "",
//       gender: PRODUCTION_CONFIG.defaultGender,
//       dob: null,
//       customer_type: PRODUCTION_CONFIG.customerType,
//       sublocation_id: locInfo.sublocation_id,
//       cdn_id: locInfo.cdn_id,
//       flatno: "1",
//       floor: "1",
//     };

//     console.log("📤 Creating Subscriber with Payload:", subPayload);
//     const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify(subPayload),
//     });

//     const subData = (await subRes.json()) as SubscriberResponse;
//     const subscriberId = subData?.data?.id;
//     console.log("🎫 Subscriber Response:", subData);

//     // ✅ Account create only if NOT already registered
//     if (!isExisting && subscriberId) {
//       const acctPayload = {
//         subscriber_id: subscriberId,
//         iptvuser_id: mobile,
//         iptvuser_password: "Bsnl@123",
//         scheme_id: PRODUCTION_CONFIG.schemeId,
//         bouque_ids: PRODUCTION_CONFIG.bouquetIds,
//         rperiod_id: PRODUCTION_CONFIG.rperiodId,
//         cdn_id: locInfo.cdn_id,
//         sublocation_id: locInfo.sublocation_id,
//       };

//       console.log("📤 Creating Account with Payload:", acctPayload);
//       const acctRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/account?vr=railtel1.1`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify(acctPayload),
//       });

//       console.log("🎫 Account Creation Status:", acctRes.status);
//       if (!acctRes.ok) continue;
//     }

//     // ✅ Always generate checksum and send SMS
//     const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         orderId: order.ORDER_ID,
//         vendorCode: "IPTV_ULKA_TV",
//         phoneNo: order.PHONE_NO,
//       }),
//     });

//     const chkData = (await checksumRes.json()) as ChecksumResponse;
//     const checksum = chkData?.checksum;
//     console.log("🔐 Generated Checksum:", checksum);
//     if (!checksum) continue;

//     const bsnlPayload = {
//       iptvorderdata: {
//         activity: "SUB_CREATED",
//         orderId: order.ORDER_ID,
//         phoneNo: order.PHONE_NO,
//         vendorCode: "IPTV_ULKA_TV",
//         iptvStatus: "Active",
//         subsId: mobile,
//         orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
//         remarks: "SUB_CREATED",
//         checksum,
//       },
//     };

//     console.log("📡 Sending to BSNL:", JSON.stringify(bsnlPayload, null, 2));
//     const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//       body: JSON.stringify(bsnlPayload),
//     });

//     const bsnlUpdateData = await bsnlUpdateRes.json() as BsnlUpdateResponse;
//     const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
//     const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

//     console.log("📨 BSNL Response:", bsnlUpdateData);

//     if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
//       console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
//       saveLastProcessedDate(order.ORDER_DATE);
//     } else {
//       console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
//     }

//     processedPhones.add(mobile);
//     console.log(`✅ Order ${order.ORDER_ID} processed.`);

//     }
//   } catch (err: any) {
//     console.error("❌ Auto Process Error:", err.message);
//   }
// }

// // Trigger once for now
// autoProcessOrders();



// ✅ autoProcessOrders.ts (Modified to send SMS even for existing users)
// import fs from "fs";
// import { format } from "date-fns";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
// import { locationMap } from "../src/config/locationMap.js";
// import { locationAliases } from "../src/config/locationAliases.js";
// import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";

// dotenv.config();

// interface Order {
//   ORDER_ID: string;
//   ORDER_DATE: string;
//   CUSTOMER_NAME: string;
//   CIRCLE_CODE: string;
//   BA_CODE: string;
//   RMN?: string;
//   PHONE_NO?: string;
//   EMAIL?: string;
//   ADDRESS?: string;
//   installation_pincode?: string;
// }

// interface OrderApiResponse {
//   ROWSET: Order[];
// }

// interface ExistingMobileResponse {
//   message?: string;
// }

// interface SubscriberResponse {
//   success: boolean;
//   status: number;
//   data?: {
//     id?: number;
//   };
// }

// interface ChecksumResponse {
//   checksum?: string;
// }

// interface BsnlUpdateResponse {
//   ROWSET?: { REMARKS?: string }[];
//   STATUS?: string;
// }

// function getLastProcessedDate(): Date {
//   try {
//     const dateStr = fs.readFileSync("lastProcessedOrderDate.txt", "utf-8").trim();
//     const [dd, MM, yyyyAndTime] = dateStr.split("/");
//     const [yyyy, time] = yyyyAndTime.split(" ");
//     return new Date(`${yyyy}-${MM}-${dd}T${time}`);
//   } catch {
//     return new Date("2000-01-01T00:00:00");
//   }
// }

// function saveLastProcessedDate(orderDate: string) {
//   fs.writeFileSync("lastProcessedOrderDate.txt", orderDate, "utf-8");
// }

// async function tryCheckExisting(mobile: string, order: Order): Promise<ExistingMobileResponse | null> {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const res = await fetch(`http://localhost:3000/api/existingMobiles`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phoneNo: mobile, orderId: order.ORDER_ID, vendorCode: "IPTV_ULKA_TV" }),
//       });
//       return (await res.json()) as ExistingMobileResponse;
//     } catch (e: any) {
//       console.warn(`📡 Retry existingMobiles (${i + 1}/3):`, e.message);
//       await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
//     }
//   }
//   return null;
// }

// export async function autoProcessOrders(): Promise<void> {
//   console.log("🟢 Auto Create start...");

//   const token = process.env.NEXT_PUBLIC_PROD_TOKEN;
//   if (!token) {
//     console.error("❌ Missing Bearer Token in .env (NEXT_PUBLIC_PROD_TOKEN)");
//     return;
//   }

//   const lastProcessedDate = getLastProcessedDate();
//   console.log("📍 Last Processed Order Date:", lastProcessedDate.toISOString());

//   try {
//     const ordersRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//       body: JSON.stringify({ vendorCode: "IPTV_ULKA_TV", iptvStatus: "Open" }),
//     });

//     const ordersData = (await ordersRes.json()) as OrderApiResponse;
//     const allOrders = ordersData.ROWSET || [];

//     const orders = allOrders.filter((order) => {
//       try {
//         const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split("/");
//         const [yyyy, time] = yyyyAndTime.split(" ");
//         const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
//         return orderDate > lastProcessedDate;
//       } catch {
//         return false;
//       }
//     });

//     console.log("📦 Received New Orders:", orders.length);
//     console.log("🖾 Orders Preview:", orders.slice(0, 2));

//     const processedPhones = new Set<string>();

//     for (const order of orders) {
//       const mobile = order.RMN || order.PHONE_NO || "9999999999";
//       if (processedPhones.has(mobile)) continue;

//       const existing = await tryCheckExisting(mobile, order);
//       const isExisting = existing?.message === "Already Registered";
//       console.log(`✅ Check Existing Done for: ${mobile} → ${isExisting ? "Already Registered" : "New User"}`);

//       const address = order.ADDRESS || "N/A";
//       const pincode = extractPincodeFromAddress(address);

//       let locKey = order.BA_CODE || order.CIRCLE_CODE;
//       if (locationAliases[locKey]) locKey = locationAliases[locKey];
//       const locInfo = locationMap[locKey] || {
//         sublocation_id: PRODUCTION_CONFIG.sublocationId,
//         cdn_id: PRODUCTION_CONFIG.cdnId,
//       };

//       const subPayload = {
//         billing_address: { addr: address, pincode },
//         fname: order.CUSTOMER_NAME || "N/A",
//         mname: "",
//         lname: "Customer",
//         mobile_no: mobile,
//         phone_no: "",
//         email: order.EMAIL?.trim() || "user@example.com",
//         installation_address: address,
//         pincode: order.installation_pincode || "138871",
//         formno: "",
//         gender: PRODUCTION_CONFIG.defaultGender,
//         dob: null,
//         customer_type: PRODUCTION_CONFIG.customerType,
//         sublocation_id: locInfo.sublocation_id,
//         cdn_id: locInfo.cdn_id,
//         flatno: "1",
//         floor: "1",
//       };

//       console.log("📤 Creating Subscriber with Payload:", subPayload);
//       const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify(subPayload),
//       });

//       const subData = (await subRes.json()) as SubscriberResponse;
//       const subscriberId = subData?.data?.id;
//       console.log("🎫 Subscriber Response:", subData);

//       // ✅ 1. Create account ONLY if new
//       if (!isExisting && subscriberId) {
//         const acctPayload = {
//           subscriber_id: subscriberId,
//           iptvuser_id: mobile,
//           iptvuser_password: "Bsnl@123",
//           scheme_id: PRODUCTION_CONFIG.schemeId,
//           bouque_ids: PRODUCTION_CONFIG.bouquetIds,
//           rperiod_id: PRODUCTION_CONFIG.rperiodId,
//           cdn_id: locInfo.cdn_id,
//           sublocation_id: locInfo.sublocation_id,
//         };

//         console.log("📤 Creating Account with Payload:", acctPayload);
//         const acctRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/account?vr=railtel1.1`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(acctPayload),
//         });

//         console.log("🎫 Account Creation Status:", acctRes.status);
//         if (!acctRes.ok) continue;
//       }

//       // ✅ 2. Always generate checksum and send BSNL SMS (even if already registered)
//       const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           orderId: order.ORDER_ID,
//           vendorCode: "IPTV_ULKA_TV",
//           phoneNo: order.PHONE_NO,
//         }),
//       });

//       const chkData = (await checksumRes.json()) as ChecksumResponse;
//       const checksum = chkData?.checksum;
//       console.log("🔐 Generated Checksum:", checksum);
//       if (!checksum) continue;

//       const bsnlPayload = {
//         iptvorderdata: {
//           activity: "SUB_CREATED",
//           orderId: order.ORDER_ID,
//           phoneNo: order.PHONE_NO,
//           vendorCode: "IPTV_ULKA_TV",
//           iptvStatus: "Active",
//           subsId: mobile,
//           orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
//           remarks: "SUB_CREATED",
//           checksum,
//         },
//       };

//       console.log("📡 Sending to BSNL:", JSON.stringify(bsnlPayload, null, 2));
//       const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
//         method: "POST",
//         headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//         body: JSON.stringify(bsnlPayload),
//       });

//       const bsnlUpdateData = (await bsnlUpdateRes.json()) as BsnlUpdateResponse;
//       const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
//       const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

//       console.log("📨 BSNL Response:", bsnlUpdateData);

//       if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
//         console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
//         saveLastProcessedDate(order.ORDER_DATE);
//       } else {
//         console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
//       }

//       processedPhones.add(mobile);
//       console.log(`✅ Order ${order.ORDER_ID} processed.`);
//     }
//   } catch (err: any) {
//     console.error("❌ Auto Process Error:", err.message);
//   }
// }

// // Run the function
// autoProcessOrders();




//edhi production 14/07/2025 cradencials dhi edhi...


// ✅ autoProcessOrders.ts (Fully fixed TypeScript version)
// import fs from "fs";
// import { format } from "date-fns";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
// import { locationMap } from "../src/config/locationMap.js";
// import { locationAliases } from "../src/config/locationAliases.js";
// import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";

// dotenv.config();

// interface Order {
//   ORDER_ID: string;
//   ORDER_DATE: string;
//   CUSTOMER_NAME: string;
//   CIRCLE_CODE: string;
//   BA_CODE: string;
//   RMN?: string;
//   PHONE_NO?: string;
//   EMAIL?: string;
//   ADDRESS?: string;
//   installation_pincode?: string;
// }

// interface OrderApiResponse {
//   ROWSET: Order[];
// }

// interface ExistingMobileResponse {
//   message?: string;
// }

// interface SubscriberResponse {
//   success: boolean;
//   status: number;
//   data?: {
//     id?: number;
//   };
// }

// interface ChecksumResponse {
//   checksum?: string;
// }

// interface BsnlUpdateResponse {
//   ROWSET?: { REMARKS?: string }[];
//   STATUS?: string;
// }

// function getLastProcessedDate(): Date {
//   try {
//     const dateStr = fs.readFileSync("lastProcessedOrderDate.txt", "utf-8").trim();
//     const [dd, MM, yyyyAndTime] = dateStr.split("/");
//     const [yyyy, time] = yyyyAndTime.split(" ");
//     return new Date(`${yyyy}-${MM}-${dd}T${time}`);
//   } catch {
//     return new Date("2000-01-01T00:00:00");
//   }
// }

// function saveLastProcessedDate(orderDate: string) {
//   fs.writeFileSync("lastProcessedOrderDate.txt", orderDate, "utf-8");
// }

// async function tryCheckExisting(mobile: string, order: Order): Promise<ExistingMobileResponse | null> {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const res = await fetch("http://localhost:3000/api/existingMobiles", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phoneNo: mobile, orderId: order.ORDER_ID, vendorCode: "IPTV_ULKA_TV" }),
//       });
//       return (await res.json()) as ExistingMobileResponse;
//     } catch (e: any) {
//       console.warn(`📡 Retry existingMobiles (${i + 1}/3):`, e.message);
//       await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
//     }
//   }
//   return null;
// }

// export async function autoProcessOrders(): Promise<void> {
//   console.log("🟢 Auto Create start...");

//   const token = process.env.NEXT_PUBLIC_PROD_TOKEN;
//   if (!token) {
//     console.error("❌ Missing Bearer Token in .env (NEXT_PUBLIC_PROD_TOKEN)");
//     return;
//   }

//   const lastProcessedDate = getLastProcessedDate();
//   console.log("📍 Last Processed Order Date:", lastProcessedDate.toISOString());

//   try {
//     const ordersRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//       body: JSON.stringify({ vendorCode: "IPTV_ULKA_TV", iptvStatus: "Open" }),
//     });

//     const ordersData = (await ordersRes.json()) as OrderApiResponse;
//     const allOrders = ordersData.ROWSET || [];

//     const orders = allOrders.filter((order) => {
//       try {
//         const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split("/");
//         const [yyyy, time] = yyyyAndTime.split(" ");
//         const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
//         return orderDate > lastProcessedDate;
//       } catch {
//         return false;
//       }
//     });

//     console.log("📦 Received New Orders:", orders.length);
//     console.log("🖾 Orders Preview:", orders.slice(0, 2));

//     const processedPhones = new Set<string>();

//     for (const order of orders) {
//       const mobile = order.RMN || order.PHONE_NO || "9999999999";
//       if (processedPhones.has(mobile)) continue;

//       const existing = await tryCheckExisting(mobile, order);
//       const isExisting = existing?.message === "Already Registered";
//       console.log(`✅ Check Existing Done for: ${mobile} → ${isExisting ? "Already Registered" : "New User"}`);

//       const address = order.ADDRESS || "N/A";
//       const pincode = extractPincodeFromAddress(address);

//       let locKey = order.BA_CODE || order.CIRCLE_CODE;
//       if (locationAliases[locKey]) locKey = locationAliases[locKey];
//       const locInfo = locationMap[locKey] || {
//         sublocation_id: PRODUCTION_CONFIG.sublocationId,
//         cdn_id: PRODUCTION_CONFIG.cdnId,
//       };

//       const subPayload = {
//         billing_address: { addr: address, pincode },
//         fname: order.CUSTOMER_NAME || "N/A",
//         mname: "",
//         lname: "Customer",
//         mobile_no: mobile,
//         phone_no: "",
//         email: order.EMAIL?.trim() || "user@example.com",
//         installation_address: address,
//         pincode: order.installation_pincode || "138871",
//         formno: "",
//         gender: PRODUCTION_CONFIG.defaultGender,
//         dob: null,
//         customer_type: PRODUCTION_CONFIG.customerType,
//         sublocation_id: locInfo.sublocation_id,
//         cdn_id: locInfo.cdn_id,
//         flatno: "1",
//         floor: "1",
//       };

//       console.log("📤 Creating Subscriber with Payload:", subPayload);
//       const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(subPayload),
//       });

//       const subData = (await subRes.json()) as SubscriberResponse;
//       const subscriberId = subData?.data?.id;
//       console.log("🎫 Subscriber Response:", subData);

//       if (isExisting) {
//         console.log(`ℹ️ Existing user detected: ${mobile}. Skipping account creation.`);
//       } else {
//         console.log(`🆕 New user detected: ${mobile}. Proceeding to account creation.`);
//       }

//       if (subscriberId && !isExisting) {
//         const acctPayload = {
//           subscriber_id: subscriberId,
//           iptvuser_id: mobile,
//           iptvuser_password: "Bsnl@123",
//           scheme_id: PRODUCTION_CONFIG.schemeId,
//           bouque_ids: PRODUCTION_CONFIG.bouquetIds,
//           rperiod_id: PRODUCTION_CONFIG.rperiodId,
//           cdn_id: locInfo.cdn_id,
//           sublocation_id: locInfo.sublocation_id,
//         };

//         console.log("📤 Creating Account with Payload:", acctPayload);
//         const acctRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/account?vr=railtel1.1`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(acctPayload),
//         });

//         console.log("🎫 Account Creation Status:", acctRes.status);
//         if (!acctRes.ok) continue;
//       }

//       const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           orderId: order.ORDER_ID,
//           vendorCode: "IPTV_ULKA_TV",
//           phoneNo: order.PHONE_NO,
//         }),
//       });

//       const chkData = (await checksumRes.json()) as ChecksumResponse;
//       const checksum = chkData?.checksum;
//       console.log("🔐 Generated Checksum:", checksum);
//       if (!checksum) continue;

//       const bsnlPayload = {
//         iptvorderdata: {
//           activity: "SUB_CREATED",
//           orderId: order.ORDER_ID,
//           phoneNo: order.PHONE_NO,
//           vendorCode: "IPTV_ULKA_TV",
//           iptvStatus: "Active",
//           subsId: mobile,
//           orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
//           remarks: "SUB_CREATED",
//           checksum,
//         },
//       };

//       console.log("📡 Sending to BSNL:", JSON.stringify(bsnlPayload, null, 2));
//       const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
//         method: "POST",
//         headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//         body: JSON.stringify(bsnlPayload),
//       });

//       const bsnlUpdateData = (await bsnlUpdateRes.json()) as BsnlUpdateResponse;
//       const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
//       const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

//       console.log("📨 BSNL Response:", bsnlUpdateData);

//       if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
//         console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
//         saveLastProcessedDate(order.ORDER_DATE);
//       } else {
//         console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
//       }

//       processedPhones.add(mobile);
//       console.log(`✅ Order ${order.ORDER_ID} processed.`);
//     }
//   } catch (err: any) {
//     console.error("❌ Auto Process Error:", err.message);
//   }
// }

// // Run the function
// autoProcessOrders();




//edhi staging cradencials

// import fs from "fs";
// import { format } from "date-fns";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
// import { locationMap } from "../src/config/locationMap.js";
// import { locationAliases } from "../src/config/locationAliases.js";
// import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";

// dotenv.config();

// interface Order {
//   ORDER_ID: string;
//   ORDER_DATE: string;
//   CUSTOMER_NAME: string;
//   CIRCLE_CODE: string;
//   BA_CODE: string;
//   RMN?: string;
//   PHONE_NO?: string;
//   EMAIL?: string;
//   ADDRESS?: string;
//   installation_pincode?: string;
// }

// interface OrderApiResponse {
//   ROWSET: Order[];
// }

// interface ExistingMobileResponse {
//   message?: string;
// }

// interface SubscriberResponse {
//   success: boolean;
//   status: number;
//   data?: {
//     id?: number;
//     mobile_no?: string; // ⭐ Add this line
//   };
// }

// interface IPTVUserResponse {
//   success: boolean;
//   status: number;
//   data?: any;
// }

// interface BsnlUpdateResponse {
//   ROWSET?: { REMARKS?: string }[];
//   STATUS?: string;
// }

// function getLastProcessedDate(): Date {
//   try {
//     const dateStr = fs.readFileSync("lastProcessedOrderDate.txt", "utf-8").trim();
//     const [dd, MM, yyyyAndTime] = dateStr.split("/");
//     const [yyyy, time] = yyyyAndTime.split(" ");
//     return new Date(`${yyyy}-${MM}-${dd}T${time}`);
//   } catch {
//     return new Date("2000-01-01T00:00:00");
//   }
// }

// function saveLastProcessedDate(orderDate: string) {
//   fs.writeFileSync("lastProcessedOrderDate.txt", orderDate, "utf-8");
// }

// async function tryCheckExisting(mobile: string, order: Order): Promise<ExistingMobileResponse | null> {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const res = await fetch("http://localhost:3000/api/existingMobiles", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phoneNo: mobile, orderId: order.ORDER_ID, vendorCode: "IPTV_ULKA_TV" }),
//       });
//       return (await res.json()) as ExistingMobileResponse;
//     } catch (e: any) {
//       console.warn(`📡 Retry existingMobiles (${i + 1}/3):`, e.message);
//       await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
//     }
//   }
//   return null;
// }

// async function createIPTVUser(subscriberId: number, orderId: string): Promise<IPTVUserResponse> {
//   const payload = {
//     subscriber_id: subscriberId.toString(),
//     iptvuser_id: `ULKATV${subscriberId}`,
//     iptvuser_password: "ULKA@123",
//     account_id: `ACCT${subscriberId}`,
//     order_id: orderId,
//   };

//   console.log("📤 Creating IPTV User with:", payload);

//   const res = await fetch("http://202.62.66.122/api/railtel.php/v1/iptvuser?vr=railtel1.1", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   const data = await res.json() as IPTVUserResponse;
//   console.log("🎫 IPTV User Response:", data);
//   return data;
// }

// export async function autoProcessOrders(): Promise<void> {
//   console.log("🟢 Auto Create start...");

//   const token = process.env.NEXT_PUBLIC_PROD_TOKEN;
//   if (!token) {
//     console.error("❌ Missing Bearer Token in .env (NEXT_PUBLIC_PROD_TOKEN)");
//     return;
//   }

//   const lastProcessedDate = getLastProcessedDate();
//   console.log("📍 Last Processed Order Date:", lastProcessedDate.toISOString());

//   try {
//     const ordersRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//       body: JSON.stringify({ vendorCode: "IPTV_ULKA_TV", iptvStatus: "Open" }),
//     });

//     const ordersData = (await ordersRes.json()) as OrderApiResponse;
//     const allOrders = ordersData.ROWSET || [];

//     const orders = allOrders.filter((order) => {
//       try {
//         const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split("/");
//         const [yyyy, time] = yyyyAndTime.split(" ");
//         const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
//         return orderDate > lastProcessedDate;
//       } catch {
//         return false;
//       }
//     });

//     console.log("📦 Received New Orders:", orders.length);
//     console.log("🖾 Orders Preview:", orders.slice(0, 2));

//     const processedPhones = new Set<string>();

//     for (const order of orders) {
//       const mobile = order.RMN || order.PHONE_NO || "9999999999";
//       if (processedPhones.has(mobile)) continue;

//       const existing = await tryCheckExisting(mobile, order);
//       const isExisting = existing?.message === "Already Registered";
//       console.log(`✅ Check Existing Done for: ${mobile} → ${isExisting ? "Already Registered" : "New User"}`);

//       const address = order.ADDRESS || "N/A";
//       const pincode = extractPincodeFromAddress(address);

//       let locKey = order.BA_CODE?.trim() || order.CIRCLE_CODE?.trim();
//       if (locationAliases[locKey]) locKey = locationAliases[locKey];

//       const locInfo = locationMap[locKey];
//       if (!locInfo) {
//         console.warn(`⚠️ Unknown location key: '${locKey}' for order ${order.ORDER_ID}`);
//         continue;
//       }

//       const subPayload = {
//         billing_address: { addr: address, pincode },
//         fname: order.CUSTOMER_NAME || "N/A",
//         mname: "",
//         lname: "Customer",
//         mobile_no: mobile,
//         phone_no: "",
//         email: order.EMAIL?.trim() || "user@example.com",
//         installation_address: address,
//         pincode: order.installation_pincode || pincode,
//         formno: "",
//         gender: PRODUCTION_CONFIG.defaultGender,
//         dob: null,
//         customer_type: PRODUCTION_CONFIG.customerType,
//         sublocation_id: locInfo.sublocation_id,
//         cdn_id: locInfo.cdn_id,
//         flatno: "1",
//         floor: "1",
//       };

//       console.log("📤 Creating Subscriber with Payload:", subPayload);

//       const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(subPayload),
//       });

//       const subData = await subRes.json() as SubscriberResponse;
//       const subscriberId = subData?.data?.id;
//       const registeredMobile = subData?.data?.mobile_no; // ⭐ fetched actual mobile from response
//       console.log("🎫 Subscriber Response:", subData);

//       if (!subscriberId || !registeredMobile) {
//         console.error(`❌ Subscriber creation failed for mobile ${mobile} (Order: ${order.ORDER_ID})`);
//         continue;
//       }

//       if (!isExisting) {
//         // ⭐ Create IPTV User using registeredMobile
//         await createIPTVUser(subscriberId, order.ORDER_ID);

//         // ⭐ Use subscriber_id and registeredMobile for account creation
//         const acctPayload = {
//           subscriber_id: subscriberId,
//           iptvuser_id: registeredMobile,
//           iptvuser_password: "Bsnl@123",
//           scheme_id: 1,
//           bouque_ids: [1],
//           rperiod_id: 3,
//           cdn_id: 1,
//         };
        
//         // Convert to `application/x-www-form-urlencoded` format
//         const formBody = new URLSearchParams();
//         Object.entries(acctPayload).forEach(([key, value]) => {
//           if (Array.isArray(value)) {
//             value.forEach((v) => formBody.append(`${key}[]`, v.toString()));
//           } else {
//             formBody.append(key, value.toString());
//           }
//         });
        
//         // 🔥 API Call
//         const acctRes = await fetch("http://202.62.66.122/api/railtel.php/v1/account?vr=railtel1.1", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             Authorization: `Bearer ${token}`,
//           },
//           body: formBody.toString(),
//         });
        
//         const acctJson = await acctRes.json();
//         console.log("📨 Account Response:", acctJson);
        
//         if (!acctRes.ok) {
//           console.error(`❌ Account creation failed for ${registeredMobile}`);
//           continue;
//         }

//         // ⭐ Remaining steps same (checksum + BSNL update)
//         const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             orderId: order.ORDER_ID,
//             vendorCode: "IPTV_ULKA_TV",
//             phoneNo: order.PHONE_NO,
//           }),
//         });

//         const chkData = await checksumRes.json() as { checksum: string };
//         const checksum = chkData?.checksum;
//         console.log("🔐 Generated Checksum:", checksum);

//         if (!checksum) {
//           console.warn("❌ Checksum generation failed");
//           continue;
//         }

//         const bsnlPayload = {
//           iptvorderdata: {
//             activity: "SUB_CREATED",
//             orderId: order.ORDER_ID,
//             phoneNo: order.PHONE_NO,
//             vendorCode: "IPTV_ULKA_TV",
//             iptvStatus: "Active",
//             subsId: registeredMobile,
//             orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
//             remarks: "SUB_CREATED",
//             checksum,
//           },
//         };

//         console.log("📡 Sending to BSNL:", JSON.stringify(bsnlPayload, null, 2));
//         const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             EKEY: process.env.EKEY || "",
//           },
//           body: JSON.stringify(bsnlPayload),
//         });

//         const bsnlUpdateData = await bsnlUpdateRes.json() as BsnlUpdateResponse;
//         const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
//         const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

//         console.log("📨 BSNL Response:", bsnlUpdateData);

//         if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
//           console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
//           saveLastProcessedDate(order.ORDER_DATE);
//         } else {
//           console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
//         }
//       }

//       processedPhones.add(mobile);
//       console.log(`✅ Order ${order.ORDER_ID} processed.`);
//     }
//   } catch (err: any) {
//     console.error("❌ Error:", err.message);
//   }
// }

// // 🔁 Run script
// autoProcessOrders();




//edhi staging cradencialsautomations
// import fs from "fs";
// import { format } from "date-fns";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
// import { locationMap } from "../src/config/locationMap.js";
// import { locationAliases } from "../src/config/locationAliases.js";
// import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";

// dotenv.config();

// interface Order {
//   ORDER_ID: string;
//   ORDER_DATE: string;
//   CUSTOMER_NAME: string;
//   CIRCLE_CODE: string;
//   BA_CODE: string;
//   RMN?: string;
//   PHONE_NO?: string;
//   EMAIL?: string;
//   ADDRESS?: string;
//   installation_pincode?: string;
// }

// interface OrderApiResponse {
//   ROWSET: Order[];
// }

// interface ExistingMobileResponse {
//   message?: string;
// }

// interface SubscriberResponse {
//   success: boolean;
//   status: number;
//   data?: {
//     id?: number;
//     mobile_no?: string;
//   };
// }

// interface IPTVUserResponse {
//   success: boolean;
//   status: number;
//   data?: any;
// }

// interface BsnlUpdateResponse {
//   ROWSET?: { REMARKS?: string }[];
//   STATUS?: string;
// }

// function markNumberAsCompleted(mobile: string) {
//   const filePath = "completedSubscribers.json";
//   const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];
//   if (!data.includes(mobile)) {
//     data.push(mobile);
//     fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
//   }
// }

// function isNumberCompleted(mobile: string): boolean {
//   const filePath = "completedSubscribers.json";
//   if (!fs.existsSync(filePath)) return false;
//   const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
//   return data.includes(mobile);
// }

// function getLastProcessedDate(): Date {
//   try {
//     const dateStr = fs.readFileSync("lastProcessedOrderDate.txt", "utf-8").trim();
//     const [dd, MM, yyyyAndTime] = dateStr.split("/");
//     const [yyyy, time] = yyyyAndTime.split(" ");
//     return new Date(`${yyyy}-${MM}-${dd}T${time}`);
//   } catch {
//     return new Date("2000-01-01T00:00:00");
//   }
// }

// function saveLastProcessedDate(orderDate: string) {
//   fs.writeFileSync("lastProcessedOrderDate.txt", orderDate, "utf-8");
// }

// async function tryCheckExisting(mobile: string, order: Order): Promise<ExistingMobileResponse | null> {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const res = await fetch("http://localhost:3000/api/existingMobiles", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ phoneNo: mobile, orderId: order.ORDER_ID, vendorCode: "IPTV_ULKA_TV" }),
//       });
//       return (await res.json()) as ExistingMobileResponse;
//     } catch (e: any) {
//       console.warn(`📡 Retry existingMobiles (${i + 1}/3):`, e.message);
//       await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
//     }
//   }
//   return null;
// }

// async function createIPTVUser(subscriberId: number, orderId: string): Promise<IPTVUserResponse> {
//   const payload = {
//     subscriber_id: subscriberId.toString(),
//     iptvuser_id: `ULKATV${subscriberId}`,
//     iptvuser_password: "ULKA@123",
//     account_id: `ACCT${subscriberId}`,
//     order_id: orderId,
//   };

//   console.log("📤 Creating IPTV User with:", payload);

//   const res = await fetch("http://202.62.66.122/api/railtel.php/v1/iptvuser?vr=railtel1.1", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   const data = await res.json() as IPTVUserResponse;
//   console.log("🎫 IPTV User Response:", data);
//   return data;
// }

// export async function autoProcessOrders(): Promise<void> {
//   console.log("🟢 Auto Create start...");
//   const token = process.env.NEXT_PUBLIC_PROD_TOKEN;
//   if (!token) {
//     console.error("❌ Missing Bearer Token in .env (NEXT_PUBLIC_PROD_TOKEN)");
//     return;
//   }

//   const lastProcessedDate = getLastProcessedDate();
//   console.log("📍 Last Processed Order Date:", lastProcessedDate.toISOString());

//   try {
//     const ordersRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
//       body: JSON.stringify({ vendorCode: "IPTV_ULKA_TV", iptvStatus: "Open" }),
//     });

//     const ordersData = (await ordersRes.json()) as OrderApiResponse;
//     const allOrders = ordersData.ROWSET || [];

//     const orders = allOrders.filter((order) => {
//       try {
//         const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split("/");
//         const [yyyy, time] = yyyyAndTime.split(" ");
//         const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
//         return orderDate > lastProcessedDate;
//       } catch {
//         return false;
//       }
//     });

//     console.log("📦 Received New Orders:", orders.length);
//     console.log("🖾 Orders Preview:", orders.slice(0, 2));

//     const processedPhones = new Set<string>();

//     for (const order of orders) {
//       const mobile = order.RMN || order.PHONE_NO || "9999999999";
//       if (processedPhones.has(mobile) || isNumberCompleted(mobile)) {
//         console.log(`🚫 Skipping ${mobile} - Already Processed Before`);
//         continue;
//       }

//       const existing = await tryCheckExisting(mobile, order);
//       const isExisting = existing?.message === "Already Registered";
//       console.log(`✅ Check Existing Done for: ${mobile} → ${isExisting ? "Already Registered" : "New User"}`);

//       const address = order.ADDRESS || "N/A";
//       const pincode = extractPincodeFromAddress(address);

//       let locKey = order.BA_CODE?.trim() || order.CIRCLE_CODE?.trim();
//       if (locationAliases[locKey]) locKey = locationAliases[locKey];

//       const locInfo = locationMap[locKey];
//       if (!locInfo) {
//         console.warn(`⚠️ Unknown location key: '${locKey}' for order ${order.ORDER_ID}`);
//         continue;
//       }

//       const subPayload = {
//         billing_address: { addr: address, pincode },
//         fname: order.CUSTOMER_NAME || "N/A",
//         mname: "",
//         lname: "Customer",
//         mobile_no: mobile,
//         phone_no: "",
//         email: order.EMAIL?.trim() || "user@example.com",
//         installation_address: address,
//         pincode: order.installation_pincode || pincode,
//         formno: "",
//         gender: PRODUCTION_CONFIG.defaultGender,
//         dob: null,
//         customer_type: PRODUCTION_CONFIG.customerType,
//         sublocation_id: locInfo.sublocation_id,
//         cdn_id: locInfo.cdn_id,
//         flatno: "1",
//         floor: "1",
//       };

//       console.log("📤 Creating Subscriber with Payload:", subPayload);

//       const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(subPayload),
//       });

//       const subData = await subRes.json() as SubscriberResponse;
//       const subscriberId = subData?.data?.id;
//       const registeredMobile = subData?.data?.mobile_no;
//       console.log("🎫 Subscriber Response:", subData);

//       if (!subscriberId || !registeredMobile) {
//         console.error(`❌ Subscriber creation failed for mobile ${mobile} (Order: ${order.ORDER_ID})`);
//         continue;
//       }

//       if (!isExisting) {
//         await createIPTVUser(subscriberId, order.ORDER_ID);

//         const acctPayload = {
//           subscriber_id: subscriberId,
//           iptvuser_id: registeredMobile,
//           iptvuser_password: "Bsnl@123",
//           scheme_id: 1,
//           bouque_ids: [1],
//           rperiod_id: 3,
//           cdn_id: 1,
//         };

//         const formBody = new URLSearchParams();
//         Object.entries(acctPayload).forEach(([key, value]) => {
//           if (Array.isArray(value)) {
//             value.forEach((v) => formBody.append(`${key}[]`, v.toString()));
//           } else {
//             formBody.append(key, value.toString());
//           }
//         });

//         const acctRes = await fetch("http://202.62.66.122/api/railtel.php/v1/account?vr=railtel1.1", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             Authorization: `Bearer ${token}`,
//           },
//           body: formBody.toString(),
//         });

//         const acctJson = await acctRes.json();
//         console.log("📨 Account Response:", acctJson);

//         if (!acctRes.ok) {
//           console.error(`❌ Account creation failed for ${registeredMobile}`);
//           continue;
//         }

//         const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             orderId: order.ORDER_ID,
//             vendorCode: "IPTV_ULKA_TV",
//             phoneNo: order.PHONE_NO,
//           }),
//         });

//         const chkData = await checksumRes.json() as { checksum: string };
//         const checksum = chkData?.checksum;
//         console.log("🔐 Generated Checksum:", checksum);

//         if (!checksum) {
//           console.warn("❌ Checksum generation failed");
//           continue;
//         }

//         const bsnlPayload = {
//           iptvorderdata: {
//             activity: "SUB_CREATED",
//             orderId: order.ORDER_ID,
//             phoneNo: order.PHONE_NO,
//             vendorCode: "IPTV_ULKA_TV",
//             iptvStatus: "Active",
//             subsId: registeredMobile,
//             orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
//             remarks: "SUB_CREATED",
//             checksum,
//           },
//         };

//         console.log("📡 Sending to BSNL:", JSON.stringify(bsnlPayload, null, 2));
//         const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             EKEY: process.env.EKEY || "",
//           },
//           body: JSON.stringify(bsnlPayload),
//         });

//         const bsnlUpdateData = await bsnlUpdateRes.json() as BsnlUpdateResponse;
//         const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
//         const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

//         console.log("📨 BSNL Response:", bsnlUpdateData);

//         if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
//           console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
//           saveLastProcessedDate(order.ORDER_DATE);
//           markNumberAsCompleted(mobile);
//         } else {
//           console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
//         }
//       }

//       processedPhones.add(mobile);
//       console.log(`✅ Order ${order.ORDER_ID} processed.`);
//     }
//   } catch (err: any) {
//     console.error("❌ Error:", err.message);
//   }
// }

// // 🔁 Run script
// autoProcessOrders();


//node --loader ts-node/esm scripts/autoProcessScheduler.mts




//autoProcessOrders.ts
import fs from "fs";
import { format } from "date-fns";
import fetch from "node-fetch";
import dotenv from "dotenv";

import { PRODUCTION_CONFIG } from "../src/config/productionConfig.js";
import { locationMap } from "../src/config/locationMap.js";
import { locationAliases } from "../src/config/locationAliases.js";
import { extractPincodeFromAddress } from "../utils/extractPincodeFromAddress.js";
import { getFreshToken } from '../utils/getToken.js';

dotenv.config();

interface Order {
  ORDER_ID: string;
  ORDER_DATE: string;
  CUSTOMER_NAME: string;
  CIRCLE_CODE: string;
  BA_CODE: string;
  RMN?: string;
  PHONE_NO?: string;
  EMAIL?: string;
  ADDRESS?: string;
  installation_pincode?: string;
}

interface OrderApiResponse {
  ROWSET: Order[];
}

interface ExistingMobileResponse {
  message?: string;
}

interface SubscriberResponse {
  success: boolean;
  status: number;
  data?: {
    id?: number;
    mobile_no?: string;
  };
}

interface IPTVUserResponse {
  success: boolean;
  status: number;
  data?: any;
}

interface BsnlUpdateResponse {
  ROWSET?: { REMARKS?: string }[];
  STATUS?: string;
}

function markNumberAsCompleted(mobile: string) {
  const filePath = "completedSubscribers.json";
  const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];
  if (!data.includes(mobile)) {
    data.push(mobile);
    fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
  }
}

function isNumberCompleted(mobile: string): boolean {
  const filePath = "completedSubscribers.json";
  if (!fs.existsSync(filePath)) return false;
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.includes(mobile);
}

function getLastProcessedDate(): Date {
  try {
    const dateStr = fs.readFileSync("lastProcessedOrderDate.txt", "utf-8").trim();
    const [dd, MM, yyyyAndTime] = dateStr.split("/");
    const [yyyy, time] = yyyyAndTime.split(" ");
    return new Date(`${yyyy}-${MM}-${dd}T${time}`);
  } catch {
    return new Date("2000-01-01T00:00:00");
  }
}

function saveLastProcessedDate(orderDate: string) {
  fs.writeFileSync("lastProcessedOrderDate.txt", orderDate, "utf-8");
}

async function tryCheckExisting(mobile: string, order: Order): Promise<ExistingMobileResponse | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch("http://localhost:3000/api/existingMobiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNo: mobile, orderId: order.ORDER_ID, vendorCode: "IPTV_ULKA_TV" }),
      });
      return (await res.json()) as ExistingMobileResponse;
    } catch (e: any) {
      console.warn(`📡 Retry existingMobiles (${i + 1}/3):`, e.message);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

async function createIPTVUser(subscriberId: number, orderId: string): Promise<IPTVUserResponse> {
  const payload = {
    subscriber_id: subscriberId.toString(),
    iptvuser_id: `ULKATV${subscriberId}`,
    iptvuser_password: "ULKA@123",
    account_id: `ACCT${subscriberId}`,
    order_id: orderId,
  };

  console.log("📤 Creating IPTV User with:", payload);

  const res = await fetch("http://202.62.66.122/api/railtel.php/v1/iptvuser?vr=railtel1.1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as IPTVUserResponse;
  console.log("🎫 IPTV User Response:", data);
  return data;
}

export async function autoProcessOrders(): Promise<void> {
  console.log("🟢 Auto Create start...");
  const token = await getFreshToken();
  if (!token) {
    console.error("❌ Could not fetch token. Exiting...");
    return;
  }

  const lastProcessedDate = getLastProcessedDate();
  console.log("📍 Last Processed Order Date:", lastProcessedDate.toISOString());

  try {
    const ordersRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders", {
      method: "POST",
      headers: { "Content-Type": "application/json", EKEY: process.env.EKEY || "" },
      body: JSON.stringify({ vendorCode: "IPTV_ULKA_TV", iptvStatus: "Open" }),
    });

    const ordersData = (await ordersRes.json()) as OrderApiResponse;
    const allOrders = ordersData.ROWSET || [];

    const orders = allOrders.filter((order) => {
      try {
        const [dd, MM, yyyyAndTime] = order.ORDER_DATE.split("/");
        const [yyyy, time] = yyyyAndTime.split(" ");
        const orderDate = new Date(`${yyyy}-${MM}-${dd}T${time}`);
        return orderDate > lastProcessedDate;
      } catch {
        return false;
      }
    });

    console.log("📦 Received New Orders:", orders.length);
    console.log("🖾 Orders Preview:", orders.slice(0, 2));

    const processedPhones = new Set<string>();

    // for (const order of orders) {
    //   const mobile = order.RMN || order.PHONE_NO || "9999999999";
    //   if (processedPhones.has(mobile) || isNumberCompleted(mobile)) {
    //     console.log(`🚫 Skipping ${mobile} - Already Processed Before`);
    //     continue;
    //   }

    //   const existing = await tryCheckExisting(mobile, order);
    //   const isExisting = existing?.message === "Already Registered";
    //   console.log(`✅ Check Existing Done for: ${mobile} → ${isExisting ? "Already Registered" : "New User"}`);

    //   const address = order.ADDRESS || "N/A";
    //   const pincode = extractPincodeFromAddress(address);

    //   let locKey = order.BA_CODE?.trim() || order.CIRCLE_CODE?.trim();
    //   if (locationAliases[locKey]) locKey = locationAliases[locKey];

    //   const locInfo = locationMap[locKey];
    //   if (!locInfo) {
    //     console.warn(`⚠️ Unknown location key: '${locKey}' for order ${order.ORDER_ID}`);
    //     continue;
    //   }

    //   const subPayload = {
    //     billing_address: { addr: address, pincode },
    //     fname: order.CUSTOMER_NAME || "N/A",
    //     mname: "",
    //     lname: "Customer",
    //     mobile_no: mobile,
    //     phone_no: "",
    //     email: order.EMAIL?.trim() || "user@example.com",
    //     installation_address: address,
    //     pincode: order.installation_pincode || pincode,
    //     formno: "",
    //     gender: PRODUCTION_CONFIG.defaultGender,
    //     dob: null,
    //     customer_type: PRODUCTION_CONFIG.customerType,
    //     sublocation_id: locInfo.sublocation_id,
    //     cdn_id: locInfo.cdn_id,
    //     flatno: "1",
    //     floor: "1",
    //   };

    //   console.log("📤 Creating Subscriber with Payload:", subPayload);

    //   const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${token}`,
    //     },
    //     body: JSON.stringify(subPayload),
    //   });

    //   const subData = await subRes.json() as SubscriberResponse;
    //   const subscriberId = subData?.data?.id;
    //   const registeredMobile = subData?.data?.mobile_no;
    //   console.log("🎫 Subscriber Response:", subData);

    //   if (!subscriberId || !registeredMobile) {
    //     console.error(`❌ Subscriber creation failed for mobile ${mobile} (Order: ${order.ORDER_ID})`);
    //     continue;
    //   }

    //   if (!isExisting) {
    //     await createIPTVUser(subscriberId, order.ORDER_ID);

    //     const acctPayload = {
    //       subscriber_id: subscriberId,
    //       iptvuser_id: registeredMobile,
    //       iptvuser_password: "Bsnl@123",
    //       scheme_id: 1,
    //       bouque_ids: [1],
    //       rperiod_id: 3,
    //       cdn_id: 1,
    //     };

    //     const formBody = new URLSearchParams();
    //     Object.entries(acctPayload).forEach(([key, value]) => {
    //       if (Array.isArray(value)) {
    //         value.forEach((v) => formBody.append(`${key}[]`, v.toString()));
    //       } else {
    //         formBody.append(key, value.toString());
    //       }
    //     });

    //     const acctRes = await fetch("http://202.62.66.122/api/railtel.php/v1/account?vr=railtel1.1", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/x-www-form-urlencoded",
    //         Authorization: `Bearer ${token}`,
    //       },
    //       body: formBody.toString(),
    //     });

    //     const acctJson = await acctRes.json();
    //     console.log("📨 Account Response:", acctJson);

    //     if (!acctRes.ok) {
    //       console.error(`❌ Account creation failed for ${registeredMobile}`);
    //       continue;
    //     }

    //     const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         orderId: order.ORDER_ID,
    //         vendorCode: "IPTV_ULKA_TV",
    //         phoneNo: order.PHONE_NO,
    //       }),
    //     });

    //     const chkData = await checksumRes.json() as { checksum: string };
    //     const checksum = chkData?.checksum;
    //     console.log("🔐 Generated Checksum:", checksum);

    //     if (!checksum) {
    //       console.warn("❌ Checksum generation failed");
    //       continue;
    //     }

    //     const bsnlPayload = {
    //       iptvorderdata: {
    //         activity: "SUB_CREATED",
    //         orderId: order.ORDER_ID,
    //         phoneNo: order.PHONE_NO,
    //         vendorCode: "IPTV_ULKA_TV",
    //         iptvStatus: "Active",
    //         subsId: registeredMobile,
    //         orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
    //         remarks: "SUB_CREATED",
    //         checksum,
    //       },
    //     };

    //     console.log("📡 Sending to BSNL:", JSON.stringify(bsnlPayload, null, 2));
    //     const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         EKEY: process.env.EKEY || "",
    //       },
    //       body: JSON.stringify(bsnlPayload),
    //     });

    //     const bsnlUpdateData = await bsnlUpdateRes.json() as BsnlUpdateResponse;
    //     const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
    //     const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

    //     console.log("📨 BSNL Response:", bsnlUpdateData);

    //     if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
    //       console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
    //       saveLastProcessedDate(order.ORDER_DATE);
    //       markNumberAsCompleted(mobile);
    //     } else {
    //       console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
    //     }
    //   }

    //   processedPhones.add(mobile);
    //   console.log(`✅ Order ${order.ORDER_ID} processed.`);
    // }


//yesterday
    for (const order of orders) {
      const mobile = order.RMN || order.PHONE_NO || "9999999999";

      if (processedPhones.has(mobile) || isNumberCompleted(mobile)) {
        console.log(`🚫 Skipping ${mobile} - Already Processed Before`);
        continue;
      }

      // Check if user already registered
      const existing = await tryCheckExisting(mobile, order);
      const isExisting = existing?.message === "Already Registered";
      console.log(`✅ Existing check done: ${mobile} → ${isExisting ? "Already Registered" : "New User"}`);

      const address = order.ADDRESS || "N/A";
      const pincode = extractPincodeFromAddress(address);

      let locKey = order.BA_CODE?.trim() || order.CIRCLE_CODE?.trim();
      if (locationAliases[locKey]) locKey = locationAliases[locKey];
      const locInfo = locationMap[locKey];

      if (!locInfo) {
        console.warn(`⚠️ Unknown location key: '${locKey}' for order ${order.ORDER_ID}`);
        continue;
      }

      // Always create subscriber
      const subPayload = {
        billing_address: { addr: address, pincode },
        fname: order.CUSTOMER_NAME || "N/A",
        mname: "",
        lname: "Customer",
        mobile_no: mobile,
        phone_no: "",
        email: order.EMAIL?.trim() || "user@example.com",
        installation_address: address,
        pincode: order.installation_pincode || pincode,
        formno: "",
        gender: PRODUCTION_CONFIG.defaultGender,
        dob: null,
        customer_type: PRODUCTION_CONFIG.customerType,
        sublocation_id: locInfo.sublocation_id,
        cdn_id: locInfo.cdn_id,
        flatno: "1",
        floor: "1",
      };

      console.log("📤 Creating Subscriber with Payload:", subPayload);

      const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subPayload),
      });

      const subData = await subRes.json() as SubscriberResponse;
      const subscriberId = subData?.data?.id;
      const registeredMobile = subData?.data?.mobile_no;

      if (!subscriberId || !registeredMobile) {
        console.error(`❌ Subscriber creation failed for ${mobile}`);
        continue;
      }

      // Always create IPTV user
      await createIPTVUser(subscriberId, order.ORDER_ID);

      // Only if new user → create account
      if (!isExisting) {
        const acctPayload = {
          subscriber_id: subscriberId,
          iptvuser_id: registeredMobile,
          iptvuser_password: "Bsnl@123",
          scheme_id: 1,
          bouque_ids: [1],
          rperiod_id: 3,
          cdn_id: 1,
        };

        const formBody = new URLSearchParams();
        Object.entries(acctPayload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => formBody.append(`${key}[]`, v.toString()));
          } else {
            formBody.append(key, value.toString());
          }
        });

        const acctRes = await fetch("http://202.62.66.122/api/railtel.php/v1/account?vr=railtel1.1", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
          body: formBody.toString(),
        });

        const acctJson = await acctRes.json();
        console.log("📨 Account Response:", acctJson);

        if (!acctRes.ok) {
          console.error(`❌ Account creation failed for ${registeredMobile}`);
          continue;
        }
      }

      // ✅ Checksum create → BSNL SMS always
      const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.ORDER_ID,
          vendorCode: "IPTV_ULKA_TV",
          phoneNo: order.PHONE_NO,
        }),
      });

      const chkData = await checksumRes.json() as { checksum: string };
      const checksum = chkData?.checksum;

      if (!checksum) {
        console.warn("❌ Checksum generation failed");
        continue;
      }

      const bsnlPayload = {
        iptvorderdata: {
          activity: "SUB_CREATED",
          orderId: order.ORDER_ID,
          phoneNo: order.PHONE_NO,
          vendorCode: "IPTV_ULKA_TV",
          iptvStatus: "Active",
          subsId: registeredMobile,
          orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
          remarks: "SUB_CREATED",
          checksum,
        },
      };

      const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          EKEY: process.env.EKEY || "",
        },
        body: JSON.stringify(bsnlPayload),
      });

      const bsnlUpdateData = await bsnlUpdateRes.json() as BsnlUpdateResponse;
      const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
      const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();

      if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
        console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
        saveLastProcessedDate(order.ORDER_DATE);
        markNumberAsCompleted(mobile);
      } else {
        console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
      }

      processedPhones.add(mobile);
      console.log(`✅ Order ${order.ORDER_ID} processed.`);
    }


    // for (const order of orders) {
    //   const mobile = order.RMN || order.PHONE_NO || "9999999999";
    
    //   if (processedPhones.has(mobile) || isNumberCompleted(mobile)) {
    //     console.log(`🚫 Skipping ${mobile} - Already Processed Before`);
    //     continue;
    //   }
    
    //   // Step 1: Check if this mobile number already registered
    //   const existing = await tryCheckExisting(mobile, order);
    //   const isExistingUser = existing?.message === "Already Registered";
    
    //   console.log(`📞 ${mobile} → ${isExistingUser ? "Existing User" : "New User"}`);
    
    //   const address = order.ADDRESS || "N/A";
    //   const pincode = extractPincodeFromAddress(address);
    
    //   let locKey = order.BA_CODE?.trim() || order.CIRCLE_CODE?.trim();
    //   if (locationAliases[locKey]) locKey = locationAliases[locKey];
    //   const locInfo = locationMap[locKey];
    
    //   if (!locInfo) {
    //     console.warn(`⚠️ Unknown location key: '${locKey}' for order ${order.ORDER_ID}`);
    //     continue;
    //   }
    
    //   // ✅ Step 2: Always create subscriber user
    //   const subPayload = {
    //     billing_address: { addr: address, pincode },
    //     fname: order.CUSTOMER_NAME || "N/A",
    //     mname: "",
    //     lname: "Customer",
    //     mobile_no: mobile,
    //     phone_no: "",
    //     email: order.EMAIL?.trim() || "user@example.com",
    //     installation_address: address,
    //     pincode: order.installation_pincode || pincode,
    //     formno: "",
    //     gender: PRODUCTION_CONFIG.defaultGender,
    //     dob: null,
    //     customer_type: PRODUCTION_CONFIG.customerType,
    //     sublocation_id: locInfo.sublocation_id,
    //     cdn_id: locInfo.cdn_id,
    //     flatno: "1",
    //     floor: "1",
    //   };
    
    //   const subRes = await fetch(`${PRODUCTION_CONFIG.apiBasePath}/v1/subscriber?vr=railtel1.1`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${token}`,
    //     },
    //     body: JSON.stringify(subPayload),
    //   });
    
    //   const subData = await subRes.json() as SubscriberResponse;
    //   const subscriberId = subData?.data?.id;
    //   const registeredMobile = subData?.data?.mobile_no;
    
    //   if (!subscriberId || !registeredMobile) {
    //     console.error(`❌ Subscriber creation failed for ${mobile}`);
    //     continue;
    //   }
    
    //   // ✅ Step 3: Create IPTV User (always)
    //   await createIPTVUser(subscriberId, order.ORDER_ID);
    
    //   // ✅ Step 4: Only for NEW Users → create account
    //   if (!isExistingUser) {
    //     const acctPayload = {
    //       subscriber_id: subscriberId,
    //       iptvuser_id: registeredMobile,
    //       iptvuser_password: "Bsnl@123",
    //       scheme_id: 1,
    //       bouque_ids: [1],
    //       rperiod_id: 3,
    //       cdn_id: 1,
    //     };
    
    //     const formBody = new URLSearchParams();
    //     Object.entries(acctPayload).forEach(([key, value]) => {
    //       if (Array.isArray(value)) {
    //         value.forEach((v) => formBody.append(`${key}[]`, v.toString()));
    //       } else {
    //         formBody.append(key, value.toString());
    //       }
    //     });
    
    //     const acctRes = await fetch("http://202.62.66.122/api/railtel.php/v1/account?vr=railtel1.1", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/x-www-form-urlencoded",
    //         Authorization: `Bearer ${token}`,
    //       },
    //       body: formBody.toString(),
    //     });
    
    //     const acctJson = await acctRes.json();
    //     console.log("📨 Account Response:", acctJson);
    
    //     if (!acctRes.ok) {
    //       console.error(`❌ Account creation failed for ${registeredMobile}`);
    //       continue;
    //     }
    //   }
    
    //   // ✅ Step 5: Always generate checksum
    //   const checksumRes = await fetch("http://localhost:3000/api/generate-checksum", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       orderId: order.ORDER_ID,
    //       vendorCode: "IPTV_ULKA_TV",
    //       phoneNo: order.PHONE_NO,
    //     }),
    //   });
    
    //   const chkData = await checksumRes.json() as { checksum: string };
    //   const checksum = chkData?.checksum;
    
    //   if (!checksum) {
    //     console.warn("❌ Checksum generation failed");
    //     continue;
    //   }
    
    //   // ✅ Step 6: Send to BSNL
    //   const bsnlPayload = {
    //     iptvorderdata: {
    //       activity: "SUB_CREATED",
    //       orderId: order.ORDER_ID,
    //       phoneNo: order.PHONE_NO,
    //       vendorCode: "IPTV_ULKA_TV",
    //       iptvStatus: "Active",
    //       subsId: registeredMobile,
    //       orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
    //       remarks: "SUB_CREATED",
    //       checksum,
    //     },
    //   };
    
    //   const bsnlUpdateRes = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/updateiptvorder", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       EKEY: process.env.EKEY || "",
    //     },
    //     body: JSON.stringify(bsnlPayload),
    //   });
    
    //   const bsnlUpdateData = await bsnlUpdateRes.json() as BsnlUpdateResponse;
    //   const remarks = bsnlUpdateData?.ROWSET?.[0]?.REMARKS || "No Remarks";
    //   const bsnlStatus = bsnlUpdateData?.STATUS?.toLowerCase();
    
    //   if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
    //     console.log(`✅ BSNL SMS Success: ${order.ORDER_ID}`);
    //     saveLastProcessedDate(order.ORDER_DATE);
    //     markNumberAsCompleted(mobile);
    //   } else {
    //     console.warn(`❌ BSNL Update Failed: ${order.ORDER_ID} - ${remarks}`);
    //   }
    
    //   processedPhones.add(mobile);
    //   console.log(`✅ Order ${order.ORDER_ID} processed.`);
    // }
    

  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

// 🔁 Run script
autoProcessOrders();
