"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    localStorage.setItem("token", data.access);
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold text-[#C6A756] mb-6">
        Global Syndicate Elite
      </h1>

      <input
        className="mb-3 p-3 bg-gray-800"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="mb-3 p-3 bg-gray-800"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-[#C6A756] text-black px-6 py-2"
        onClick={login}
      >
        Login
      </button>
    </div>
  );
}
