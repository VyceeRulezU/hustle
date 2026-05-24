interface Tip {
  id: string
  amount: number
  tipperName: string | null
  message: string | null
  createdAt: string
}

export default function RecentTips({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Recent tips</h2>
        <p className="text-gray-500 text-sm">No tips yet. Share your tip page to get started.</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">Recent tips</h2>
      <div className="space-y-2">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3"
          >
            <div>
              <p className="font-medium">{tip.tipperName || "Anonymous"}</p>
              {tip.message && (
                <p className="text-sm text-gray-500 truncate max-w-48">{tip.message}</p>
              )}
            </div>
            <span className="font-semibold">&#8358;{tip.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
