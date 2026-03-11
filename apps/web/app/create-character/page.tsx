"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCharacterPage() {
  const [nickname, setNickname] = useState("");
  const router = useRouter();

  async function createCharacter() {
    const token = localStorage.getItem("token");

    if (!nickname) {
      alert("Enter a nickname");
      return;
    }

    try {
      const res = await fetch("/api/character/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nickname })
      });

      const data = await res.json();

      if (data?.error) {
        alert(data.error);
        return;
      }

      router.replace("/dashboard");

    } catch (err) {
      console.error("Character creation failed", err);
      alert("Character creation failed");
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center px-6">

      <div className="w-full max-w-sm">

        <h1 className="text-center text-3xl font-semibold text-[#C6A756] mb-8">
          Create Operative
        </h1>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-4">

          <input
            type="text"
            placeholder="Operative nickname"
            className="w-full bg-[#1F2937] border border-transparent rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6A756]"
            onChange={(e) => setNickname(e.target.value)}
          />

          <button
            className="w-full bg-[#C6A756] text-black font-semibold py-3 rounded-lg hover:opacity-90 transition"
            onClick={createCharacter}
          >
            Enter the Syndicate
          </button>

        </div>

      </div>

    </div>
  );
}
