// src/config/productionConfig.ts
export const PRODUCTION_CONFIG = {
  token: process.env.NEXT_PUBLIC_PROD_TOKEN || "",
  defaultGender: "M",
  customerType: 1,
  sublocationId: 8,          // ✅ Seems valid (Staging)
  cdnId: 1,                  // ✅ CDN ID for staging (Make sure matches locationMap)
  schemeId: 1,               // ✅ Based on your API docs
  bouquetIds: [1010],        // ⚠️ DOUBLE-CHECK this ID (Earlier you used [1])
  rperiodId: 3,              // ✅ 3 Months as per BSNL
  apiBasePath: "http://202.62.66.122/api/railtel.php",
  bsnlSecretKey: process.env.BSNL_EKEY as string,
};


// // config/productionCongig.ts
// export const PRODUCTION_CONFIG = {
//   token: process.env.NEXT_PUBLIC_PROD_TOKEN || "",
//   defaultGender: 0,
//   customerType: 1,
//   sublocationId: 2318,
//   cdnId: 106,
//   schemeId: 1,
//   bouquetIds: [1010],
//   rperiodId: 3,
//   apiBasePath: "https://partners.ulka.tv/api/railtel.php",
//   bsnlSecretKey: process.env.BSNL_EKEY as string,
// };
