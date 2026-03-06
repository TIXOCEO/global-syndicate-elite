"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt({ characterId }: { characterId?: string }) {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!characterId) return;

    const alreadyShown = localStorage.getItem("gse_install_prompt_seen");

    if (alreadyShown) return;

    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [characterId]);

  const install = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();
    const result = await promptEvent.userChoice;

    if (result.outcome === "accepted") {
      localStorage.setItem("gse_install_prompt_seen", "true");
    }

    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem("gse_install_prompt_seen", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-[#0B1220] border border-[#C6A756] rounded-xl p-4 shadow-xl z-50">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-gold font-semibold">Install Global Syndicate Elite</div>
          <div className="text-sm opacity-70">
            Play faster with the full app experience.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="text-sm opacity-60 hover:opacity-100"
          >
            Later
          </button>

          <button
            onClick={install}
            className="bg-[#C6A756] text-black px-3 py-1 rounded text-sm font-semibold"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
