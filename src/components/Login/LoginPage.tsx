// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import Link from "next/link";

// const Login = () => {
//   const [username, setUsername] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [error, setError] = useState<string>("");
//   const [success, setSuccess] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);
//   const router = useRouter();

//   const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSuccess("");

//     try {
//       const response = await fetch(
//         "https://partners.ulka.tv/api/railtel.php/v1/user/login?vr=railtel1.1",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             LoginForm: {
//               username,
//               password,
//             },
//           }),
//         }
//       );

//       const data = await response.json();

//       if (data.success) {
//         setSuccess("User login successful!");
//         console.log("User Data:", data.data);

//         localStorage.setItem("access_token", data.data.access_token);
//         localStorage.setItem("auth_token", data.data.auth_token);
//         localStorage.setItem("username", data.data.username);

//         setTimeout(() => {
//           router.push("/");
//         }, 1000);
//       } else {
//         setError(data.message || "Invalid credentials. Please try again.");
//       }
//     } catch (err) {
//       console.error("Login Error:", err);
//       setError("Something went wrong. Please try again later.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-50">
//       <div className="w-full max-w-xl p-8 bg-black rounded-lg shadow-lg bg-gray-200">
//         <div className="flex justify-center gap-4 mb-6">
//           <Link href="/">
//             <Image src="/bsnl.png" alt="BSNL Logo" width={50} height={40} />
//           </Link>
//           <Link href="/">
//             <Image src="/ulka.png" alt="ULKA Logo" width={50} height={40} />
//           </Link>
//         </div>

//         <form onSubmit={handleLogin}>
//           <input
//             type="text"
//             placeholder="Username"
//             className="w-full p-3 mb-3 bg-white text-black rounded-md focus:outline-none"
//             value={username}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//               setUsername(e.target.value)
//             }
//             required
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             className="w-full p-3 mb-3 bg-white text-black rounded-md focus:outline-none"
//             value={password}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//               setPassword(e.target.value)
//             }
//             required
//           />
//           {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
//           {success && <p className="text-green-500 text-sm mb-3">{success}</p>}
//           <button
//             type="submit"
//             className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md"
//             disabled={loading}
//           >
//             {loading ? "Logging in..." : "Login"}
//           </button>
//         </form>

//         <div className="flex justify-between text-sm mt-4 text-gray-400">
//           <a href="#" className="hover:text-white">
//             Signup/Register
//           </a>
//           <a href="/forgotpassword" className="hover:text-white">
//             Forgot password?
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://202.62.66.122/api/railtel.php/v1/user/login?vr=railtel1.1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            LoginForm: {
              username,
              password,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("User login successful!");

        // 🛡️ Store session tokens
        localStorage.setItem("access_token", data.data.access_token);
        localStorage.setItem("auth_token", data.data.auth_token);
        localStorage.setItem("username", data.data.username);

        // ✅ Redirect after login
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-xl p-8 bg-white rounded-lg shadow-md">
        <div className="flex justify-center gap-4 mb-6">
          <Link href="/">
            <Image src="/bsnl.png" alt="BSNL Logo" width={50} height={40} />
          </Link>
          <Link href="/">
            <Image src="/ulka.png" alt="ULKA Logo" width={50} height={40} />
          </Link>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 mb-3 border rounded-md"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-3 border rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-3">{success}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex justify-between text-sm mt-4 text-gray-500">
          <a href="#" className="hover:text-black">
            Signup/Register
          </a>
          <a href="/forgotpassword" className="hover:text-black">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
