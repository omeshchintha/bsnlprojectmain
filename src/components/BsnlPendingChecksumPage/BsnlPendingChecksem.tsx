
"use client";
import { useEffect, useState } from "react";
import { circleToCdnMap } from "../constants/cdnMap";
import Select, { SingleValue } from 'react-select';
import { toast }from 'react-toastify';
import { format } from "date-fns";

type Order = {
  ORDER_ID: string;
  ORDER_DATE: string;
  CUSTOMER_NAME: string;
  CIRCLE_CODE: string;
  BA_CODE: string;
  RMN?: string;
  PHONE_NO?: string;
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

type OptionType = {
  value: string;
  label: string;
};

type BsnlResult = {
  orderId: string;
  mobile: string;
  iptvStatus: string;
  vendorCode: string;
  activity: string;
  remarks: string;
  status: string;
};


const BsnlPendingChecksem = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedBA, setSelectedBA] = useState("");
  const [selectedOD, setSelectedOD] = useState("");
  const [bas, setBas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [popupData, setPopupData] = useState<Order | null>(null); // For storing clicked order data
  const [isPopupVisible, setIsPopupVisible] = useState(false); // For showing and hiding the modal
  const [totalSelectedCount, setTotalSelectedCount] = useState(0);
  const [showExisting, setShowExisting] = useState(false);
  const [showRegistered, setShowRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const [orderDates, setOrderDates] = useState<string[]>([]);
  const [existingMobiles, setExistingMobiles] = useState<string[]>([]);
  const [existingMobilesSet, setExistingMobilesSet] = useState<Set<string>>(new Set());

  const [successMobiles, setSuccessMobiles] = useState<string[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [bsnlResults, setBsnlResults] = useState<BsnlResult[]>([]);

  const validOrders = orders.filter(order => !!order.ORDER_DATE); // only those with ORDER_DATE
  const filteredOrders = validOrders.filter(order => {
    const orderDateOnly = order.ORDER_DATE.split(' ')[0];
    const matchBA = selectedBA ? order.BA_CODE === selectedBA : true;
    const matchOD = selectedOD ? orderDateOnly === selectedOD : true;
    return matchBA && matchOD;
  });
  
  const isAllSelected = filteredOrders
    .filter(o => !existingMobilesSet.has(o.RMN || o.PHONE_NO || ""))
    .every(o => selectedOrderIds.includes(o.ORDER_ID));

  {existingMobiles.map((mobile: string, index: number) => (
    <li key={index}>{mobile}</li>
  ))}

  const orderDateOptions: OptionType[] = orderDates.map(date => {
    const onlyDate = date.split(' ')[0];
    return {
      value: onlyDate,
      label: onlyDate,
    };
  });
   
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    setToken(accessToken ? `Bearer ${accessToken}` : null);
  }, []);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  useEffect(() => {
    const uniqueOrderDates = Array.from(new Set(orders.map(o => o.ORDER_DATE)));
    setOrderDates(uniqueOrderDates);
  }, [orders]);

  useEffect(() => {
    console.log("📨 Final BSNL Results for UI:", bsnlResults);
  }, [bsnlResults]);
  
  useEffect(() => {
    const storedMobiles = localStorage.getItem("existingMobiles");
    if (storedMobiles) {
      const parsed = JSON.parse(storedMobiles);
      setExistingMobiles(parsed);
      setExistingMobilesSet(new Set(parsed));
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("existingMobiles");
    if (stored) {
      const parsed = JSON.parse(stored);
      setExistingMobiles(parsed);
      setExistingMobilesSet(new Set(parsed));
    }
  }, []);
  
  useEffect(() => {
    setTotalSelectedCount(selectedOrderIds.length);
  }, [selectedOrderIds]);

  useEffect(() => {
    const saved = localStorage.getItem("existingMobiles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setExistingMobilesSet(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse existingMobiles:", e);
      }
    }
  }, []);


  useEffect(() => {
    const cachedData = localStorage.getItem("iptvOrders");
    if (cachedData) {
      const cachedOrders: Order[] = JSON.parse(cachedData);
      setOrders(cachedOrders); // 🌟 డేటా వెంటనే UI లో వస్తుంది
      const uniqueBAs = Array.from(new Set(cachedOrders.map(o => o.BA_CODE)));
      setBas(uniqueBAs);
    }
  }, []);
  

  useEffect(() => {
    const localResults = localStorage.getItem("bsnlUpdateResults");
    if (localResults) {
      const parsed = JSON.parse(localResults);
      setBsnlResults(parsed); // display in table or modal
    }
  }, []);
  
  const fetchActiveOrders = async () => {
    try {
      const response = await fetch("/api/fetchActiveIptvOrders", {
        method: "POST",
        headers: {
          Authorization: token || "",
        },
      });
  
      if (!response.ok) throw new Error("Active orders fetch failed");
  
      const data = await response.json();
      setOrders(data.orders); // or setActiveOrders() if you're keeping it separately
      toast.success("Active orders loaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch Active orders");
    }
  };
  

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fetchIptvOrders", {
        method: "POST",
        headers: {
          Authorization: token || "", // 🛡️ Use token from state
        },
      });

      if (!response.ok) throw new Error("API fetch failed");

      const data = await response.json();
      let fetchedOrders: Order[] = data?.orders || [];

      fetchedOrders = fetchedOrders.map(order => ({
        ...order,
        CDN_LABEL: circleToCdnMap[order.CIRCLE_CODE] || "CD1",
      }));

      localStorage.setItem("iptvOrders", JSON.stringify(fetchedOrders));
      setOrders(fetchedOrders);

      const uniqueBAs = Array.from(new Set(fetchedOrders.map(o => o.BA_CODE)));
      setBas(uniqueBAs);
    } catch (err) {
      console.error("API failed, loading from localStorage:", err);

      const cachedData = localStorage.getItem("iptvOrders");
      if (cachedData) {
        const cachedOrders: Order[] = JSON.parse(cachedData);
        setOrders(cachedOrders);

        const uniqueBAs = Array.from(new Set(cachedOrders.map(o => o.BA_CODE)));
        setBas(uniqueBAs);
      } else {
        setError("No cached data found.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (order: Order) => {
    setPopupData(order);
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setPopupData(null);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBA(e.target.value);
  };

  const resetBA = () => {
    setSelectedBA("");
  };
  

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
    const selectableOrders = filteredOrders.filter(
      o => !existingMobilesSet.has(o.RMN || o.PHONE_NO || "")
    );
    const selectableIds = selectableOrders.map(o => o.ORDER_ID);
  
    setSelectedOrderIds(prev =>
      prev.length === selectableIds.length ? [] : selectableIds
    );
  };  

  const handleBSNLUpdateOnly = async () => {
    const token = localStorage.getItem("access_token");
  
    if (!token) {
      toast.error("Login required. Please login again.");
      return;
    }
  
    if (selectedOrderIds.length === 0) {
      toast.warning("Please select at least one order.");
      return;
    }
  
    const selectedOrders = orders.filter(order =>
      selectedOrderIds.includes(order.ORDER_ID)
    );
  
    const bsnlResultsTemp: BsnlResult[] = [];
  
    for (const order of selectedOrders) {
      const mobile = order.RMN || order.PHONE_NO || "9999999999";
  
      try {
        // ✅ Step 1: Generate Checksum
        const checksumRes = await fetch("/api/generate-checksum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.ORDER_ID,
            vendorCode: "IPTV_ULKA_TV",
            phoneNo: order.PHONE_NO,
          }),
        });
  
        const checksumData = await checksumRes.json();
        const checksum = checksumData?.checksum;
  
        if (!checksum) {
          toast.error(`❌ Checksum generation failed for ${order.ORDER_ID}`);
          continue;
        }
  
        // ✅ Step 2: Send BSNL Update
        const bsnlPayload = {
          iptvorderdata: {
            activity: "SUB_CREATED",
            orderId: order.ORDER_ID,
            phoneNo: order.PHONE_NO,
            vendorCode: "IPTV_ULKA_TV",
            iptvStatus: "Active",
            subsId: mobile,
            orderDate: order.ORDER_DATE || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
            remarks: "SUB_CREATED",
            checksum,
          },
        };
  
        const bsnlRes = await fetch("/api/updateBsnlOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bsnlPayload),
        });
  
        const bsnlData = await bsnlRes.json();
        const remarks = bsnlData?.ROWSET?.[0]?.REMARKS || "No Remarks";
        const bsnlStatus = bsnlData?.STATUS?.toLowerCase();
  
        const result: BsnlResult = {
          orderId: order.ORDER_ID,
          mobile,
          iptvStatus: "Active",
          vendorCode: "IPTV_ULKA_TV",
          activity: "SUB_CREATED",
          remarks,
          status: bsnlStatus || "unknown",
        };
  
        bsnlResultsTemp.push(result);
  
        // ✅ Store result in localStorage for offline view
        const existingData = localStorage.getItem("bsnlUpdateResults");
        const parsed: BsnlResult[] = existingData ? JSON.parse(existingData) : [];
        const updatedData = [...parsed, result];
        localStorage.setItem("bsnlUpdateResults", JSON.stringify(updatedData));
  
        if (bsnlStatus === "success" && remarks.includes("Updated Successfully")) {
          toast.success(`✅ BSNL Updated Successfully: ${order.ORDER_ID}`);
        } else {
          toast.error(`❌ BSNL failed: ${order.ORDER_ID} - ${remarks}`);
        }
  
      } catch (err) {
        console.error("❌ Internal Error:", err);
        toast.error("❌ Internal Error. Please try again.");
      }
    }
  
    setBsnlResults(bsnlResultsTemp); // UI update
    setShowResultModal(true);        // Show summary
  };  

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="w-full px-4 pt-20 pl-20 overflow-x-auto mb-8">
      <h1 className="text-2xl font-bold mb-6 text-left mt-[2rem]">
        Bsnl Pending orders Checksum Message Page
      </h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="font-medium">Filter by BA</label>

        <select
          className="border border-gray-300 rounded px-3 py-2 w-64"
          value={selectedBA}
          onChange={handleFilterChange}
        >
          <option value="">-- Select BA --</option>
          {bas.map((ba, idx) => (
            <option key={idx} value={ba}>
              {ba}
            </option>
          ))}
        </select>

          <Select
            className="w-64"
            options={orderDateOptions}
            value={orderDateOptions.find(opt => opt.value === selectedOD)}
            onChange={(selectedOption: SingleValue<OptionType>) => {
              setSelectedOD(selectedOption?.value || '');
              setSelectedOrderIds([]);
            }}
            onFocus={(e) => {
              e.target.click();
            }}
            placeholder="-- DD/MM/YYYY --"
            isClearable
          />

        <button
          type="button"
          onClick={resetBA}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={downloadCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Generate Upload File
        </button>

        <button
          type="button"
          onClick={handleBSNLUpdateOnly}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Send
        </button>
        <button
            onClick={fetchActiveOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Active Orders
          </button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[1700px] border border-gray-300 text-[15px]">
          <thead className="bg-gray-100 text-left font-bold">
            <tr>
              <th className="px-6 py-2 border">
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
            {filteredOrders.map((order, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-2 border">
                {(() => {
                  const phone = order.RMN || order.PHONE_NO || "";
                  const isRegistered = !!phone && existingMobilesSet.has(phone);

                  return (
                    <div className="flex flex-col items-start">
                      <input
                        type="checkbox"
                        disabled={isRegistered}
                        checked={selectedOrderIds.includes(order.ORDER_ID)}
                        onChange={() => {
                          if (!isRegistered) {
                            handleCheckboxChange(order.ORDER_ID);
                          }
                        }}
                        className={`px-6 py-2 rounded ${
                          isRegistered
                            ? "border-red-500 bg-red-100 cursor-not-allowed"
                            : "border-gray-300 cursor-pointer"
                        }`}
                      />
                      {isRegistered && (
                        <span className="text-red-500 text-xs mt-1">Already Registered</span>
                      )}
                    </div>
                  );
                })()}

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
      
      {showResultModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[900px] max-h-[80vh] overflow-y-auto relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-600">📋 Registration Summary</h2>
              <button
                onClick={() => {
                  setShowResultModal(false);
                }}
                className="text-blue-600 font-bold text-lg hover:underline"
              >
                ← Back
              </button>
            </div>

            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Selected: {totalSelectedCount}
            </p>

            <p className="mb-2 text-green-600">
              ✅ Successfully Registered: <strong>{successMobiles.length}</strong>
            </p>
            <p className="mb-2 text-red-600">
              ⚠️ Already Exists: <strong>{existingMobiles.length}</strong>
            </p>

            {/* ✅ Existing Mobiles Toggle */}
            {existingMobiles.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center">
                  <p
                    onClick={() => setShowExisting(!showExisting)}
                    className="font-semibold text-blue-700 cursor-pointer hover:underline"
                  >
                    View All Existing Numbers ({existingMobiles.length})
                  </p>
                </div>

                {showExisting && (
                  <div className="mt-2 bg-gray-100 p-4 rounded">
                    <p className="text-sm text-gray-700 mb-2">
                      Total {existingMobiles.length} existing number(s):
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-800 max-h-40 overflow-y-auto">
                      {existingMobiles.map((num, idx) => (
                        <li key={idx}>{num}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ✅ Success Mobiles Toggle */}
            {successMobiles.length > 0 && (
              <div className="mt-4">
                <p
                  onClick={() => setShowRegistered(!showRegistered)}
                  className="font-semibold text-green-700 mb-2 cursor-pointer hover:underline"
                >
                  Registered Numbers Details Click Here:
                </p>

                {showRegistered && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      Total {successMobiles.length} registered number(s) are listed below.
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      {successMobiles.map((num, idx) => (
                        <li key={idx}>{num}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* ✅ BSNL API RESULT TABLE */}
            {bsnlResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-indigo-600 mb-2">📡 BSNL API Result Summary</h3>
                  <div className="overflow-x-auto border rounded">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        <th>Order ID</th>
                        <th>Activity</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                    {bsnlResults.map((res, index) => (
                      <tr key={index} className="bg-white border-b">
                        <td>{res.orderId}</td>
                        <td>{res.activity}</td>
                        <td>{res.remarks}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>

                  </div>
                </div>
              )}

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowResultModal(false);
                  setExistingMobiles([]);
                  setSuccessMobiles([]);
                  setBsnlResults([]); // Clear BSNL result
                }}
                className="px-4 py-2 bg-gray-300 text-black rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {isPopupVisible && popupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-xl shadow-lg relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-2 text-sm mb-6">
              <p><strong>Order ID:</strong> {popupData.ORDER_ID}</p>
              <p><strong>Order Date:</strong> {popupData.ORDER_DATE}</p>
              <p><strong>Customer Name:</strong> {popupData.CUSTOMER_NAME}</p>
              <p><strong>Phone:</strong> {popupData.RMN || popupData.PHONE_NO}</p>
              <p><strong>Email:</strong> {popupData.EMAIL}</p>
              <p><strong>Address:</strong> {popupData.ADDRESS}</p>
              <p><strong>Circle Code:</strong> {popupData.CIRCLE_CODE}</p>
              <p><strong>BA Code:</strong> {popupData.BA_CODE}</p>
              <p><strong>Customer Account No:</strong> {popupData.CUST_ACCNT_NO}</p>
              <p><strong>Maintenance Franchise Code:</strong> {popupData.MTCE_FRANCHISE_CODE}</p>
              <p><strong>Cache Unique ID:</strong> {popupData.CACHE_UNIQUE_ID}</p>
              <p><strong>Bill Account No:</strong> {popupData.BILL_ACCNT_NO}</p>
              <p><strong>Customer Type:</strong> {popupData.CUST_TYPE}</p>
              <p><strong>Cache VLAN ID:</strong> {popupData.CACHE_VLAN_ID}</p>
              <p><strong>MAC ID:</strong> {popupData.MAC_ID}</p>
              <p><strong>LMO User:</strong> {popupData.LMO_USER}</p>
              <p><strong>Vendor Code:</strong> {popupData.VENDOR_CODE}</p>
              <p><strong>Username:</strong> {popupData.USERNAME}</p>
              <p><strong>Exchange Code:</strong> {popupData.EXCHANGE_CODE}</p>
              <p><strong>IPTV Status:</strong> {popupData.IPTV_STATUS}</p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={closePopup}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log("Create clicked", popupData);
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

export default BsnlPendingChecksem;
