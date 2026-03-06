export default function GlobalHUD() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">

      <div className="bg-[#0B1220] border-b border-[#C6A756]">

        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center text-sm">

          <div className="font-bold text-[#C6A756]">
            GSE
          </div>

          <div className="flex gap-4">

            <span>HP 100</span>
            <span>⚡ 100</span>
            <span>$ 0</span>
            <span>Lead 0</span>

          </div>

        </div>

      </div>

    </div>
  );
}
