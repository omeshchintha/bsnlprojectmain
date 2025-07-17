// import fetch from "node-fetch";
// import dotenv from "dotenv";

// dotenv.config(); // ✅ Load .env variables

// interface LoginResponse {
//   success: boolean;
//   data?: {
//     access_token?: string;
//     auth_token?: string;
//     username?: string;
//   };
//   message?: string;
// }

// export async function getFreshToken(): Promise<string | null> {
//   try {
//     const res = await fetch("https://partners.ulka.tv/api/railtel.php/v1/user/login?vr=railtel1.1", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         LoginForm: {
//           username: process.env.API_USERNAME,
//           password: process.env.API_PASSWORD,
//         },
//       }),
//     });

//     const data = await res.json() as LoginResponse; // ✅ Fix applied here
//     return data?.data?.access_token || null;
//   } catch (err: any) {
//     console.error("❌ Token fetch error:", err.message);
//     return null;
//   }
// }


//utils/getToken.ts
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config(); // ✅ Load .env variables

interface LoginResponse {
  success: boolean;
  data?: {
    access_token?: string;
    auth_token?: string;
    username?: string;
  };
  message?: string;
}

export async function getFreshToken(): Promise<string | null> {
  console.log("🔐 Username:", process.env.API_USERNAME);
  console.log("🔐 Password:", process.env.API_PASSWORD);

  try {
    const res = await fetch("http://202.62.66.122/api/railtel.php/v1/user/login?vr=railtel1.1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        LoginForm: {
          username: process.env.API_USERNAME,
          password: process.env.API_PASSWORD,
        },
      }),
    });

    const data = await res.json() as LoginResponse;
    console.log("📦 Token Response:", data); // ✅ Log response
    return data?.data?.access_token || null;
  } catch (err: any) {
    console.error("❌ Token fetch error:", err.message);
    return null;
  }
}
