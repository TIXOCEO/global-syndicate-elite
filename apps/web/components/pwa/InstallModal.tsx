"use client";

import { useEffect, useState } from "react";

interface Props {
  rank?: number;
}

export default function InstallModal({ rank }: Props) {

  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {

    if (typeof window === "undefined") return;

    // Require minimum rank
    if (!rank || rank < 2) return;

    // Do not show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Do not show if user already dismissed
    const dismissed = localStorage.getItem("gse_install_prompt_seen");
    if (dismissed) return;

    const handler = (e: any) => {

      e.preventDefault();

      setPromptEvent(e);

      setVisible(true);

    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };

  }, [rank]);

  const install = async () => {

    if (!promptEvent) return;

    promptEvent.prompt();

    const result = await promptEvent.userChoice;

    // Mark as seen regardless of outcome
    localStorage.setItem("gse_install_prompt_seen", "true");

    setVisible(false);

  };

  const dismiss = () => {

    localStorage.setItem("gse_install_prompt_seen", "true");

    setVisible(false);

  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">

      <div className="w-[90%] max-w-md rounded-2xl border border-[#C6A756] bg-[#0B1220] p-6 shadow-2xl">

        <div className="text-center space-y-3">

          <div className="text-[#C6A756] text-xl font-semibold">
            Install Global Syndicate Elite
          </div>

          <div className="text-sm opacity-80">
            Play faster and smoother with the full app experience.
          </div>

        </div>

        <div className="mt-6 flex gap-3">

          <button
            onClick={dismiss}
            className="flex-1 rounded-lg border border-white/20 py-2 text-sm hover:bg-white/10"
          >
            Later
          </button>

          <button
            onClick={install}
            className="flex-1 rounded-lg bg-[#C6A756] py-2 text-sm font-semibold text-black hover:brightness-110"
          >
            Install
          </button>

        </div>

      </div>

    </div>
  );
}
