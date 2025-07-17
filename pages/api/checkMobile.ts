// pages/api/checkMobile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ulqaabxznsnbzclhychm.supabase.co',
  process.env.SUPABASE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { orderId, phoneNo, vendorCode } = req.body;

  const { data, error } = await supabase
    .from("existing_mobiles")
    .select("*")
    .eq("orderId", orderId)
    .eq("phoneNo", phoneNo)
    .eq("vendorCode", vendorCode)
    .maybeSingle(); // this prevents crash if no record

  if (error) {
    console.error("Supabase Error", error);
    return res.status(500).json({ success: false, message: "DB Error" });
  }

  if (data) {
    return res.status(200).json({ success: false, message: "Already Registered" });
  }

  return res.status(200).json({ success: true, message: "New User" });
}
