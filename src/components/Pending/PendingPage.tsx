"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Header from "../../components/Header";
import { circleToCdnMap } from "../../components/constants/cdnMap";

type Order = {
    ORDER_ID: string;
    ORDER_DATE: string;
    CUSTOMER_NAME: string;
    CIRCLE_CODE: string;
    BA_CODE: string;
    RMN?: string;
    PHONE_NO?: string;
    [key: string]: string | number | boolean | undefined;
    EMAIL?: string;
    ADDRESS?: string;
    CUST_ACCNT_NO?: string;
    MTCE_FRANCHISE_CODE?: string;
    CACHE_UNIQUE_ID?: string;
    BILL_ACCNT_NO?: string;
    CUST_TYPE?: string;
    CACHE_VLAN_ID?: string;
    MAC_ID?: string;
    LMO_USER?: string;
    VENDOR_CODE?: string;
    USERNAME?: string;
    EXCHANGE_CODE?: string;
    IPTV_STATUS?: string;
  
    fname?: string;
    lname?: string;
    mname?: string;
    gender?: string;
    mobile_no?: string;
    phone_no?: string;
    sublocation_code?: string;
    flatno?: string;
    floor?: string;
    wing?: string;
    installation_address?: string;
    installation_pincode?: string;
    billing_address?: string;
    billing_pincode?: string;
    iptvuser_id?: string;
    bouque_code?: string;
    outstanding?: string;
    scheme_code?: string;
    rperiod_code?: string;
    dob?: string;
    customer_type?: string;
    formno?: string;
    uid?: string;
    minid?: string;
    warranty_date?: string;
    is_verified?: string;
    gst_no?: string;
    iptvuser_password?: string;
    cdn_code?: string;
    warranty_end_date?: string;
  };

 const PendingPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [existingMobiles, setExistingMobiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedBA = "";
  const selectedOD = "";
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [popupData, setPopupData] = useState<Order | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleViewClick = (order: Order) => {
    setPopupData(order);
  };
  const closePopup = () => {
    setPopupData(null);
  };

  const fetchFilteredOrders = useCallback(async () => {
    if (!token) return; // Wait until token is available
  
    setLoading(true);
    try {
      const response = await fetch("/api/fetchIptvOrders", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) throw new Error("Failed to fetch orders");
  
      const data = await response.json();
      const allOrders: Order[] = data.orders || [];
  
      const filtered = allOrders.filter((order) =>
        existingMobiles.includes(order.RMN || order.PHONE_NO || "")
      );
  
      const filteredWithCDN = filtered.map((order) => ({
        ...order,
        CDN_LABEL: circleToCdnMap[order.CIRCLE_CODE] || "CD1",
      }));
  
      const cached = localStorage.getItem("filteredOrders");
      const previousOrders: Order[] = cached ? JSON.parse(cached) : [];
  
      const combined = [...previousOrders, ...filteredWithCDN];
      const uniqueOrders = Array.from(
        new Map(combined.map((order) => [order.ORDER_ID, order])).values()
      );
  
      setOrders(uniqueOrders);
      localStorage.setItem("filteredOrders", JSON.stringify(uniqueOrders));
    } catch (error) {
      console.error("Fetch error:", error);
      const cached = localStorage.getItem("filteredOrders");
      if (cached) {
        setOrders(JSON.parse(cached));
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [existingMobiles, token]); // ✅ include token in dependency  

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      setToken(`Bearer ${accessToken}`);
    }
  }, []);  
  
  useEffect(() => {
    const stored = localStorage.getItem("existingMobiles");
    const savedIds = localStorage.getItem("selectedOrderIds");
    const cachedOrders = localStorage.getItem("filteredOrders");
  
    if (cachedOrders) setOrders(JSON.parse(cachedOrders));
    if (savedIds) setSelectedOrderIds(JSON.parse(savedIds));
    if (stored) setExistingMobiles(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (token && existingMobiles.length > 0) {
      fetchFilteredOrders();
    }
  }, [existingMobiles, token, fetchFilteredOrders]);
  
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDateOnly = order.ORDER_DATE.split(" ")[0];
      const matchBA = selectedBA ? order.BA_CODE === selectedBA : true;
      const matchOD = selectedOD ? orderDateOnly === selectedOD : true;
      return matchBA && matchOD;
    });
  }, [orders, selectedBA, selectedOD]);
  
  const baCodeDetailsMap: {
    [key: string]: {
      sublocationCode: string;
      cdnCode: string;
    };
  } = {
    "Visakhapatnam": { sublocationCode: "S2102S000001", cdnCode: "CDN112" },
    "Chittoor": { sublocationCode: "S2105S000001", cdnCode: "CDN104" },
    "Anantapur": { sublocationCode: "S2103S000001", cdnCode: "CDN109" },
    "Nellore": { sublocationCode: "S2097S000004", cdnCode: "CDN116" },
    "Rajahmundry": { sublocationCode: "S2098S000001", cdnCode: "CDN115" },
    "Vijayawada": { sublocationCode: "S2095S000001", cdnCode: "CDN110" },
    "Ongloe": { sublocationCode: "S2106S000001", cdnCode: "CDN123" },
    "Srikakulam": { sublocationCode: "S2102S000001", cdnCode: "CDN112" },
    "Eluru": { sublocationCode: "S2096S000001", cdnCode: "CDN117" },
    "Kurnool": { sublocationCode: "S2100S000001", cdnCode: "CDN114" },
    "Guntur": { sublocationCode: "S2104S000001", cdnCode: "CDN108" },
    "Cuddapah": { sublocationCode: "S2101S000001", cdnCode: "CDN113" },
    "Vijayanagaram": { sublocationCode: "S2102S000001", cdnCode: "CDN112" },
    "Tirupati": { sublocationCode: "S2105S000001", cdnCode: "CDN104" },
    "Warangal": { sublocationCode: "S2112S000001", cdnCode: "CDN106" },
    "CHT": { sublocationCode: "S2105S000001", cdnCode: "CDN104" },
    "RMY": { sublocationCode: "S2098S000001", cdnCode: "CDN115" },
    "VZM": { sublocationCode: "S2102S000001", cdnCode: "CDN112" },
    "ADB": { sublocationCode: "S2114S000001", cdnCode: "CDN106" },
    "NLR": { sublocationCode: "S2097S000004", cdnCode: "CDN116" },
    "KHM": { sublocationCode: "S2108S000001", cdnCode: "CDN106" },
    "KAA": { sublocationCode: "S2115S000001", cdnCode: "CDN106" },
    "ELR": { sublocationCode: "S2096S000001", cdnCode: "CDN117" },
    "NGD": { sublocationCode: "S2110S000001", cdnCode: "CDN106" },
    "HYD": { sublocationCode: "S2107S000001", cdnCode: "CDN106" },
    "WGL": { sublocationCode: "S2112S000001", cdnCode: "CDN106" },
    "VSK": { sublocationCode: "S2102S000001", cdnCode: "CDN112" },
    "MBN": { sublocationCode: "S2109S000001", cdnCode: "CDN106" },
    "KNL": { sublocationCode: "S2100S000001", cdnCode: "CDN114" },
    "ATP": { sublocationCode: "S2103S000001", cdnCode: "CDN109" },
    "GTR": { sublocationCode: "S2104S000001", cdnCode: "CDN108" },
    "ONG": { sublocationCode: "S2106S000001", cdnCode: "CDN123" },
    "VJW": { sublocationCode: "S2095S000001", cdnCode: "CDN110" },
    "NZB": { sublocationCode: "S2111S000001", cdnCode: "CDN106" },
    "SGD": { sublocationCode: "S2113S000001", cdnCode: "CDN106" },
    "SKM": { sublocationCode: "S2102S000001", cdnCode: "CDN112" },
    "CDP": { sublocationCode: "S2101S000001", cdnCode: "CDN113" },
    "Nalgonda": { sublocationCode: "S2110S000001", cdnCode: "CDN106" }
  };
  
  const downloadCSV = () => {
    const headers = [
      "fname", "lname", "mname", "gender", "mobile_no", "phone_no", "email",
      "sublocation_code", "flatno", "floor", "wing", "installation_address",
      "installation_pincode", "billing_address", "billing_pincode",
      "iptvuser_id", "bouque_code", "outstanding", "scheme_code",
      "rperiod_code", "dob", "customer_type", "formno", "uid", "minid",
      "warranty_date", "is_verified", "gst_no", "iptvuser_password",
      "cdn_code", "warranty_end_date"
    ];
  
    const selectedOrders = filteredOrders.filter(order =>
      selectedOrderIds.includes(order.ORDER_ID)
    );
  
    const rows = selectedOrders.map(order => {
      const addressParts = (order.ADDRESS || "").split(",");
      const pincode = addressParts[addressParts.length - 1]?.trim() || "";
      const fullName = (order.CUSTOMER_NAME || "").trim().split(/\s+/);
      let fname = "";
      let lname = "";
      
      if (fullName.length === 1) {
        fname = fullName[0];
        lname = ".";
      } else if (fullName.length === 2) {
        fname = fullName[0];
        lname = fullName[1];
      } else {
        fname = fullName[0];
        lname = fullName.slice(1).join(" ");
      }
      
      if (fname.length === 1) {
        fname = fname + ".";
      }
      
      if (lname.length === 1) {
        lname = lname + ".";
      }
      
      if (!lname || lname.trim() === "") {
        lname = ".";
      }
      
      
      
      const details = baCodeDetailsMap[order.BA_CODE] || {};

      return [
        fname, // fname
        lname, // lname
        "", // mname
        "1", // gender
        order.RMN || "", // mobile_no
        order.PHONE_NO || "", // phone_no
        order.EMAIL || "", // email
        details.sublocationCode || order.BA_CODE || "", // sublocation_code
        "1", // flatno
        "1", // floor
        "", // wing
        order.ADDRESS || "", // installation_address
        pincode, // installation_pincode
        order.ADDRESS || "", // billing_address
        pincode, // billing_pincode
        order.RMN, // iptvuser_id
        "B001010", // bouque_code
        "", // outstanding
        "X000002", // scheme_code
        "1 month", // rperiod_code
        "", // dob
        "1", // customer_type
        "0", // formno
        "", // uid
        "", // minid
        "", // warranty_date
        "", // is_verified
        "", // gst_no
        "Bsnl@123", // iptvuser_password
        details.cdnCode || "1", // cdn_code
        "", // warranty_end_date
      ];
    });
  
    const csvContent = [headers, ...rows]
      .map(row => row.map(item => `"${item}"`).join(","))
      .join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "selected_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckboxChange = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  const handleSelectAll = () => {
    const allIds = filteredOrders.map(o => o.ORDER_ID);
    setSelectedOrderIds(prev => (prev.length === allIds.length ? [] : allIds));
  };
  
  const isAllSelected = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

  if (existingMobiles.length === 0) {
    return <p className="mt-[7rem] ml-12">No existing mobile numbers found.</p>;
  }

  return (
    <div className="p-16 mt-[4rem] mb-8">
      <Header />
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">Orders Matching Existing Mobile Numbers</h2>

        <button
            type="button"
            onClick={downloadCSV}
            className="bg-red-500 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
            Generate Upload File
        </button>
        <button
            onClick={() => {
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
        >
            Renew
        </button>
        </div>

      {loading ? (
        <p className="ml-12">Loading filtered orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="ml-12">No orders match the given filters.</p>
      ) : (
        <div>
          <table className="min-w-[1700px] border border-gray-300 text-[15px]">
            <thead className="bg-gray-100 text-left font-bold">
                <tr>
                <th className="px-4 py-2 border">
                    <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    />
                </th>
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">Order Date</th>
                <th className="px-4 py-2 border">Customer</th>
                <th className="px-4 py-2 border">Circle Code</th>
                <th className="px-4 py-2 border">BA Code</th>
                <th className="px-4 py-2 border">RMN</th>
                <th className="px-4 py-2 border">Action</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">
                    <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.ORDER_ID)}
                        onChange={() => handleCheckboxChange(order.ORDER_ID)}
                    />
                    </td>
                    <td className="px-4 py-2 border">{order.ORDER_ID}</td>
                    <td className="px-4 py-2 border">{order.ORDER_DATE}</td>
                    <td className="px-4 py-2 border">{order.CUSTOMER_NAME}</td>
                    <td className="px-4 py-2 border">{order.CIRCLE_CODE}</td>
                    <td className="px-4 py-2 border">{order.BA_CODE}</td>
                    <td className="px-4 py-2 border">{order.RMN || order.PHONE_NO}</td>
                    <td className="p-2 border font-bold">
                        <button
                        onClick={() => handleViewClick(order)}
                        className="text-blue-500"
                        >
                        View
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}

      {popupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-xl shadow-lg relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-2 text-sm mb-6 max-h-[60vh] overflow-y-auto">
              {Object.entries(popupData).map(([key, value]) => {
                if (!value) return null;
                const formattedKey = key
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                return (
                  <p key={key}>
                    <strong>{formattedKey}:</strong> {value}
                  </p>
                );
              })}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={closePopup}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/createOrder", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(popupData),
                    });

                    const result = await response.json();
                    if (result.success) {
                      alert("Order saved successfully!");
                      closePopup();
                    } else {
                      alert("Failed to save order.");
                    }
                  } catch (err) {
                    console.error("Error creating order:", err);
                    alert("Something went wrong.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPage;
