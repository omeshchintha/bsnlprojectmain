"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaTimes } from "react-icons/fa";

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastSynced, setLastSynced] = useState("");

  const isAuthenticated = true;

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setLastSynced(formatted);
    };
    
    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 shadow-md transition-all duration-500 ease-in-out ${
        isScrolled ? "bg-gray-800 py-3" : "bg-gray-200 py-5"
      }`}
    >
      <div className="max-w-8xl mx-auto px-9 flex items-center justify-between">
        <div className="flex justify-start items-center space-x-4">
          <Link href="/">
            <Image src="/bsnl.png" alt="BSNL Logo" width={50} height={40} />
          </Link>
          <Link href="/">
            <Image src="/ulka.png" alt="ULKA Logo" width={50} height={40} />
          </Link>
          <Link href="/" className="hover:text-blue-400">
            Integration Dashboard
          </Link>

          <nav className="hidden md:flex space-x-6 text-[16px] font-bold text-black">
            {/* <Link href="/view-cron-logs" className="hover:text-blue-400">
              Cron Logs
            </Link> */}
            <Link href="/pending" className="hover:text-blue-400">
              Already Registered Orders
            </Link>
            <Link href="/syncnow" className="hover:text-blue-400">
              🔄 Sync Now
            </Link>
            <Link href="/iptvorders" className="hover:text-blue-400">
               Iptv orders
            </Link>
            <span className="text-[16px] font-bold text-black">
              Last Synced: {lastSynced}
            </span>
          </nav>

          <Link href="/bsnlchecksum" className="text-[16px] font-bold hover:text-blue-400">
             PendingChecksum
          </Link>
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-2 text-xl font-bold text-black relative">


            <div className="cursor-pointer hover:text-[#F7961E] py-2 px-4 md:py-0 md:px-0 text-left md:text-center">
              <a
                href="/login"
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-md font-bold transition-all duration-300"
              >
                Login
              </a>
            </div>
          </div>
        )}

        <div className="md:hidden text-white ml-4" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 bg-gray-700 text-white p-4 space-y-2 text-sm">
          <Link href="/view-cron-logs">Cron Logs</Link>
          <Link href="/">Pending Orders</Link>
          <form method="POST" action="/sync-now">
            <button type="submit">🔄 Sync Now</button>
          </form>
          <span>Last Synced: {lastSynced}</span>
          <form method="POST" action="/logout">
            <button type="submit" className="text-red-300">
              🚪 Logout
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;
