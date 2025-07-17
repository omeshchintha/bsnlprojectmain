// pages/api/fetchActiveIptvOrders.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface Order {
  ORDER_ID: string;
  CIRCLE_CODE: string;
  ORDER_DATE: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface OrderApiResponse {
  ROWSET: Order[];
}

const circleToCdnMap: Record<string, number> = {
  AP: 1,
  TS: 3,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://fms.bsnl.in/fmswebservices/rest/iptv/getiptvorders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'EKEY': 'b28272183c64fcb45b11d9098a7dd97df51f89bc1bae9448e4126258fd9446d1',
      },
      body: JSON.stringify({ vendorCode: 'IPTV_ULKA_TV', iptvStatus: 'Active' }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Failed to fetch orders: ${response.statusText}`);

    const data: OrderApiResponse = await response.json();
    const orders: Order[] = data.ROWSET || [];

    const ordersWithDetails = orders.map(order => {
      const cleanCircle = order.CIRCLE_CODE?.trim().toUpperCase() || '';
      const cdn_id = circleToCdnMap[cleanCircle] || 1;
      const orderYear = new Date(order.ORDER_DATE).getFullYear();
      return {
        ...order,
        CIRCLE_CODE: cleanCircle,
        cdn_id,
        ORDER_YEAR: orderYear,
      };
    });

    const sortedOrders = ordersWithDetails.sort(
      (a, b) => new Date(a.ORDER_DATE).getTime() - new Date(b.ORDER_DATE).getTime()
    );

    res.status(200).json({ orders: sortedOrders });

  } catch (error: unknown) {
    console.error('Error fetching Active IPTV orders:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return res.status(504).json({ error: 'Request timed out after 15 seconds' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'An unknown error occurred' });
  }
}
