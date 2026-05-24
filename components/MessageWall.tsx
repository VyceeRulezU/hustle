interface Message {
  id: string
  tipperName: string | null
  message: string
  amount: number
}

export default function MessageWall({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Message wall</h2>
        <p className="text-gray-500 text-sm">No messages yet. Tips with messages will appear here.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Message wall</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <p className="text-sm italic mb-2">&ldquo;{msg.message}&rdquo;</p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{msg.tipperName || "Anonymous"}</span>
              <span>&#8358;{msg.amount.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
