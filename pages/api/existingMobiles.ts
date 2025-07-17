// pages/api/existingMobiles.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { phoneNo, orderId, vendorCode } = req.body;

    if (!phoneNo || !orderId || !vendorCode) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const { data, error } = await supabase
      .from('existing_mobiles')
      .select('mobile')
      .eq('mobile', phoneNo)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, message: 'Database error', error });
    }

    if (data) {
      return res.status(200).json({ success: false, message: 'Already Registered' });
    }

    const { error: insertError } = await supabase
      .from('existing_mobiles')
      .insert([{ mobile: phoneNo, order_id: orderId, vendor_code: vendorCode }]);

    if (insertError) {
      return res.status(500).json({ success: false, message: 'Insert failed', error: insertError });
    }

    return res.status(200).json({ success: true, message: 'Mobile registered successfully' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('existing_mobiles')
      .select('mobile');

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch mobiles', error });
    }

    const mobiles = data.map((item) => item.mobile);
    return res.status(200).json({ success: true, mobiles });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
