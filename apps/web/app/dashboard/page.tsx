export default function Dashboard() {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-gold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Cash</h2>
          <p className="text-xl font-semibold text-[#C6A756]">$0</p>
        </div>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Lead</h2>
          <p className="text-xl font-semibold text-[#C6A756]">0</p>
        </div>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Energy</h2>
          <p className="text-xl font-semibold text-[#C6A756]">100</p>
        </div>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Tier</h2>
          <p className="text-xl font-semibold text-[#C6A756]">1</p>
        </div>

      </div>

    </div>
  );
}
