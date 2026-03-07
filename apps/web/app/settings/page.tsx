"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsPage() {

  const router = useRouter();

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {

    logout();

    router.replace("/login");

  };

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Settings
      </h1>

      {/* SESSION CARD */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Session
        </h2>

        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600"
        >
          Logout
        </button>

      </div>

      {/* APP CARD */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-3">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Application
        </h2>

        <div className="text-sm text-zinc-400">
          Global Syndicate Elite
        </div>

        <div className="text-sm text-zinc-500">
          Version 0.4.0
        </div>

      </div>

      {/* FUTURE SETTINGS */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-2">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Upcoming Features
        </h2>

        <div className="text-sm text-zinc-400">
          Notifications
        </div>

        <div className="text-sm text-zinc-400">
          Audio settings
        </div>

        <div className="text-sm text-zinc-400">
          Account security
        </div>

      </div>

    </div>
  );
}
