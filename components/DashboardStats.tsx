interface DashboardStatsProps {
  totalAmount: number
  tipCount: number
}

export default function DashboardStats({ totalAmount, tipCount }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="border border-gray-300 dark:border-gray-700 rounded-xl p-4">
        <p className="text-sm text-gray-500">Total earned</p>
        <p className="text-2xl font-bold">&#8358;{totalAmount.toLocaleString()}</p>
      </div>
      <div className="border border-gray-300 dark:border-gray-700 rounded-xl p-4">
        <p className="text-sm text-gray-500">Tips received</p>
        <p className="text-2xl font-bold">{tipCount}</p>
      </div>
    </div>
  )
}
