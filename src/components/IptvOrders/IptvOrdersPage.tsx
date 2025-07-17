"use client";
import { useEffect, useState } from "react";
import axios from "axios";

type Order = {
  id: string;
  customer_id: string;
  name: string;
  operator_id: number;
  location_id: number;
  mobile_no: string;
  phone_no: string;
  email: string;
  installation_address: string;
  created_at: string;
  distributor_code_lbl: string;
  addr: string;
  operator_code_lbl: string;
  status_lbl: string;
  distributor_lbl: string;
  sublocation_lbl: string;
  customer_type_lbl: string;
  gender_lbl: string;
  created_by_lbl: string;
};

const IptvOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedBA, setSelectedBA] = useState("");
  const [bas, setBas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popupData, setPopupData] = useState<Order | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("No access token found. Please login.");
          setLoading(false);
          return;
        }

        const response = await axios.get<{ data: Order[] }>(
          `https://partners.ulka.tv/api/railtel.php/v1/subscriber?expand=customer_type_lbl,created_by_lbl,status_lbl,gender_lbl,location_lbl,sublocation_lbl,operator_lbl,operator_code_lbl,distributor_lbl,distributor_code_lbl,branch_lbl,branch_code_lbl,connection_lbl,bill_addr,addr&page=1&per-page=50&vr=railtel1.1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data: Order[] = response.data.data;
        setOrders(data);
        const uniqueBAs = Array.from(new Set(data.map(order => order.distributor_code_lbl)));
        setBas(uniqueBAs.sort());
      } catch (err) {
        setError("Failed to fetch data from API.");
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBA(e.target.value);
  };

  const resetBA = () => {
    setSelectedBA("");
  };

  const filteredOrders = selectedBA
    ? orders.filter(order => order.distributor_code_lbl === selectedBA)
    : orders;

  const handleViewClick = (order: Order) => {
    setPopupData(order);
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setPopupData(null);
  };

  const downloadCSV = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("No access token found. Please login.");
        return;
      }

      const response = await axios.get<{ data: Order[] }>(
        `https://partners.ulka.tv/api/railtel.php/v1/subscriber?expand=customer_type_lbl,created_by_lbl,status_lbl,gender_lbl,location_lbl,sublocation_lbl,operator_lbl,operator_code_lbl,distributor_lbl,distributor_code_lbl,branch_lbl,branch_code_lbl,connection_lbl,bill_addr,addr&page=1&per-page=50&vr=railtel1.1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const allOrders = response.data.data;
      if (!allOrders || allOrders.length === 0) {
        alert("No data available to download.");
        return;
      }

      const headers: string[] = Object.keys(allOrders[0]);

      const rows: string[][] = allOrders.map((order: Order) =>
        headers.map((key) =>
          typeof order[key as keyof Order] === "object"
            ? JSON.stringify(order[key as keyof Order])
            : String(order[key as keyof Order] ?? "")
        )
      );

      const csvContent = [
        headers.join(","),
        ...rows.map(row =>
          row.map(field => `"${field.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "iptv_orders_full.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("CSV download failed:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  return (
    <div className="p-12 mt-[5rem]">
      <h1 className="text-xl font-semibold mb-4">IPTV Orders</h1>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="flex items-center mb-4 gap-4">
            <select
              value={selectedBA}
              onChange={handleFilterChange}
              className="border px-2 py-1 rounded"
            >
              <option value="">All Distributor Codes</option>
              {bas.map(ba => (
                <option key={ba} value={ba}>
                  {ba}
                </option>
              ))}
            </select>
            <button onClick={resetBA} className="text-sm text-blue-600">
              Reset
            </button>
            <button
              onClick={downloadCSV}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
            >
              Download CSV
            </button>
          </div>

          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Customer ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Circle Code</th>
                <th className="p-2 border">BA Code</th>
                <th className="p-2 border">RMN</th>
                <th className="p-2 border">Phone Number</th>
                <th className="p-2 border">View</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className="p-2 border">{order.customer_id}</td>
                  <td className="p-2 border">{order.name}</td>
                  <td className="p-2 border">{order.operator_code_lbl}</td>
                  <td className="p-2 border">{order.distributor_code_lbl}</td>
                  <td className="p-2 border">{order.mobile_no || order.phone_no}</td>
                  <td className="p-2 border">{order.mobile_no || order.phone_no}</td>
                  <td className="p-2 border">
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
        </>
      )}

      {isPopupVisible && popupData && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg w-[40rem]">
            <h2 className="text-xl font-semibold">Order Details</h2>
            <div className="mt-4 space-y-2">
              <p><strong>Customer ID:</strong> {popupData.customer_id}</p>
              <p><strong>Name:</strong> {popupData.name}</p>
              <p><strong>Email:</strong> {popupData.email}</p>
              <p><strong>Phone No:</strong> {popupData.mobile_no || popupData.phone_no}</p>
              <p><strong>Installation Address:</strong> {popupData.installation_address}</p>
              <p><strong>Status:</strong> {popupData.status_lbl}</p>
              <p><strong>Operator Code:</strong> {popupData.operator_code_lbl}</p>
              <p><strong>Distributor Code:</strong> {popupData.distributor_code_lbl}</p>
              <p><strong>Location:</strong> {popupData.addr}</p>
              <p><strong>Created By:</strong> {popupData.created_by_lbl}</p>
              <p><strong>Gender:</strong> {popupData.gender_lbl}</p>
              <p><strong>Customer Type:</strong> {popupData.customer_type_lbl}</p>
              <p><strong>Created At:</strong> {popupData.created_at}</p>
            </div>
            <button
              onClick={closePopup}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IptvOrdersPage;
