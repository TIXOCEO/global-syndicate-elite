"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

import {
  LayoutDashboard,
  Crosshair,
  Building2,
  Swords,
  MessagesSquare,
  ShoppingCart,
  HeartPulse,
  Columns3,
  PlaneTakeoff
} from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: any;
};

type Category = {
  key: string;
  label: string;
  icon: any;
  items: MenuItem[];
};

const categories: Category[] = [
  {
    key: "main",
    label: "Main",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Progress", href: "/progression", icon: LayoutDashboard },
      { label: "Resources", href: "/resources", icon: LayoutDashboard },
      { label: "Shop", href: "/shop", icon: ShoppingCart },
      { label: "Profile", href: "/profile", icon: LayoutDashboard },

      /* NEW — Airport */

      { label: "Airport", href: "/airport", icon: PlaneTakeoff }
    ]
  },
  {
    key: "crimes",
    label: "Crimes",
    icon: Crosshair,
    items: [
      { label: "Minor Crimes", href: "/crimes", icon: Crosshair },
      { label: "Smuggling", href: "/smuggling", icon: Crosshair }
    ]
  },
  {
    key: "properties",
    label: "Properties",
    icon: Building2,
    items: [
      { label: "Factories", href: "/factories", icon: Building2 }
    ]
  },
  {
    key: "conflict",
    label: "Conflict",
    icon: Swords,
    items: [
      { label: "Attack", href: "/attack", icon: Swords },
      { label: "Hitlist", href: "/hitlist", icon: Swords },
      { label: "Intel", href: "/intel", icon: Swords },
      { label: "Hospital", href: "/hospital", icon: HeartPulse },
      { label: "Jail", href: "/jail", icon: Columns3 }
    ]
  },
  {
    key: "communication",
    label: "Communication",
    icon: MessagesSquare,
    items: [
      { label: "Messages", href: "/messages", icon: MessagesSquare },
      { label: "Global Chat", href: "/chat", icon: MessagesSquare }
    ]
  }
];

export default function BottomNav() {

  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    async function checkJail() {

      try {

        const res = await apiFetch("/api/state/sync");

        if (res?.jail?.remaining > 0) {

          if (pathname !== "/jail") {
            router.replace("/jail");
          }

        }

      } catch {}

    }

    checkJail();

    const interval = setInterval(checkJail, 5000);

    return () => clearInterval(interval);

  }, [pathname, router]);

  function toggleMenu(key: string) {

    if (open === key) {
      setOpen(null);
    } else {
      setOpen(key);
    }

  }

  useEffect(() => {

    function handleClick(e: MouseEvent) {

      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(null);
      }

    }

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener("mousedown", handleClick);

  }, []);

  const activeCategory = categories.find((c) => c.key === open);

  return (
    <>

      <div
        className={`fixed left-0 right-0 bottom-16 z-40 transition-all duration-300 ${
          activeCategory
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none"
        }`}
      >

        {activeCategory && (

          <div ref={panelRef} className="max-w-5xl mx-auto px-4">

            <div className="bg-[#111827] border border-[#C6A756] rounded-xl shadow-2xl overflow-hidden">

              <div className="px-4 py-3 border-b border-zinc-700 text-sm font-semibold text-[#C6A756]">
                {activeCategory.label}
              </div>

              <div className="flex flex-col">

                {activeCategory.items.map((item) => {

                  const active = pathname === item.href;

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(null)}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-800 text-sm transition ${
                        active
                          ? "text-[#C6A756] bg-black/30"
                          : "text-zinc-300 hover:bg-black/30"
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );

                })}

              </div>

            </div>

          </div>

        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#C6A756] bg-[#0B1220] z-50">

        <div className="max-w-5xl mx-auto flex justify-between px-4 py-3 text-xs">

          {categories.map((cat) => {

            const active = open === cat.key;

            const Icon = cat.icon;

            return (
              <button
                key={cat.key}
                onClick={() => toggleMenu(cat.key)}
                className={`flex flex-col items-center gap-1 transition ${
                  active ? "text-[#C6A756]" : "text-zinc-400"
                }`}
              >
                <Icon size={20} />
                {cat.label}
              </button>
            );

          })}

        </div>

      </div>

    </>
  );
}
