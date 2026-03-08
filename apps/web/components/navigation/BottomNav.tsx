"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/crimes", label: "Crimes" },
  { href: "/factories", label: "Factories" },
  { href: "/progression", label: "Progress" },
  { href: "/resources", label: "Resources" },
  { href: "/profile", label: "Profile" },
];

export default function BottomNav() {

  const path = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-[#C6A756] bg-[#0B1220]">

      <div className="max-w-5xl mx-auto flex justify-between px-4 py-3 text-xs">

        {nav.map((item) => {

          const active = path === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                active ? "text-[#C6A756]" : "text-zinc-400"
              }`}
            >
              {item.label}
            </Link>
          );

        })}

      </div>

    </div>
  );

}
