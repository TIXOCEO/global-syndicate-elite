"use client";

import { useState } from "react";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data?.access) {
      localStorage.setItem("token", data.access);
      window.location.href = "/dashboard";
    } else {
      alert("Login failed");
    }

  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center px-6">

      <div className="w-full max-w-sm">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="/icons/icon-192.png"
            alt="GSE"
            className="w-20 h-20"
          />
        </div>

        {/* TITLE */}
        <h1 className="text-center text-3xl font-semibold text-[#C6A756] mb-8">
          Global Syndicate Elite
        </h1>

        {/* CARD */}
        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full bg-[#1F2937] border border-transparent rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6A756]"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-[#1F2937] border border-transparent rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6A756]"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full bg-[#C6A756] text-black font-semibold py-3 rounded-lg hover:opacity-90 transition"
            onClick={login}
          >
            Login
          </button>

        </div>

      </div>

    </div>
  );

}
