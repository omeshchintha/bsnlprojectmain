// // shared/fetchOrders.ts
// import fetch from "node-fetch";

// export interface Order {
//   ORDER_ID: string;
//   CIRCLE_CODE: string;
//   ORDER_DATE: string;
//   PHONE_NO: string;
//   [key: string]: any;
// }

// interface FmsResponse {
//   orders: Order[];
// }

// export async function fetchFmsOrders(): Promise<Order[]> {
//   try {
//     const response = await fetch("https://fms.bsnl.in/fmswebservices/rest/iptv/getorders", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: "Bearer b28272183c64fcb45b11d9098a7dd97df51f89bc1bae9448e4126258fd9446d1", // ✅ Replace with real token
//       },
//       body: JSON.stringify({
//         vendorCode: "IPTV_ULKA_TV",
//       }),
//     });

//     // 👇 Type-cast json response to expected shape
//     const data = (await response.json()) as FmsResponse;

//     return data.orders || [];
//   } catch (err) {
//     console.error("❌ Failed to fetch FMS Orders:", err);
//     return [];
//   }
// }
