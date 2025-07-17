"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AUTO_LOGOUT_TIME = 20 * 60 * 1000; // 20 minutes

export default function AutoLogout() {
  const router = useRouter();

  useEffect(() => {
    let logoutTimer: NodeJS.Timeout;

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);

      logoutTimer = setTimeout(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("username");
        alert("Logged out due to inactivity.");
        router.push("/login");
      }, AUTO_LOGOUT_TIME);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [router]);

  return null;
}
