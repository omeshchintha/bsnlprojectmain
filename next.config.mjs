/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      PROD_TOKEN: process.env.PROD_TOKEN,
      BSNL_EKEY: process.env.BSNL_EKEY,
    },
  };
  
  export default nextConfig;
  