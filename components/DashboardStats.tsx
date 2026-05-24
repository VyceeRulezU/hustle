interface DashboardStatsProps {
  totalAmount: number
  tipCount: number
}

export default function DashboardStats({ totalAmount, tipCount }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl p-4">
        <p className="text-sm text-gray-300">Total earned</p>
        <p className="text-2xl font-bold text-white">&#8358;{totalAmount.toLocaleString()}</p>
      </div>
      <div className="border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl p-4">
        <p className="text-sm text-gray-300">Tips received</p>
        <p className="text-2xl font-bold text-white">{tipCount}</p>
      </div>
    </div>
  )
}
