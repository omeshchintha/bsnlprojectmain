// pages/api/account.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Missing token in headers" });
  }

  try {
    const response = await fetch("https://partners.ulka.tv/api/railtel.php/v1/account?vr=railtel1.1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // instead of "x-auth-token"
      },      
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Account Proxy Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
