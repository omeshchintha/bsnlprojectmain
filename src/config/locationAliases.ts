// export const locationAliases: Record<string, string> = {
//     "CHT": "Chittoor",
//     "TirupathiIftv": "Tirupati",
//     "ATP": "Anantapur",
//     "VJW": "Vijayawada",
//     "CDP": "Cuddapah",
//     "SKM": "Srikakulam",
//     "VZM": "Vijayanagaram",
//     "KNL": "Kurnool",
//     "ONG": "Ongloe",
//     "GTR": "Guntur",
//     "NLR": "Nellore",
//     "RMY": "Rajahmundry",
//     "ELR": "Eluru",
//     "WGL": "Warangal",
//     "VSK": "Visakhapatnam",
//     "KAA": "Kakinada",
//     "KHM": "Khammam",
//     "NGD": "Nalgonda",
//     "HYD": "Hyderabad",
//     "MBN": "Mahbubnagar",
//     "NZB": "Nizamabad",
//     "SGD": "Sangareddy",
//     // ...add more if needed
//   };
 


export const locationAliases: Record<string, string> = {
  "CHT": "GTR",   // Example fix (Only if GTR exists in locationMap)
  "TirupathiIftv": "CHT",
  "ATP": "ATP",
  "VJW": "GTR",
  "CDP": "CDP",
  "SKM": "CDP",
  "VZM": "CDP",
  "KNL": "CDP",
  "ONG": "CDP",
  "GTR": "GTR",
  "NLR": "NLR",
  "RMY": "CDP",
  "ELR": "ELR",
  "WGL": "CDP",
  "VSK": "VSP",  // ✅ FIX: 'VSK' → 'VSP' (used in locationMap)
  "KAA": "CDP",
  "KHM": "CDP",
  "NGD": "CDP",
  "HYD": "CDP",
  "MBN": "CDP",
  "NZB": "CDP",
  "SGD": "CDP",
};
