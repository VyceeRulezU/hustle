"use client"

import { useState } from "react"

export default function TipForm({ slug }: { slug: string }) {
  const [tipperName, setTipperName] = useState("")
  const [tipperEmail, setTipperEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/tip/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: slug,
          tipperName: tipperName || undefined,
          tipperEmail,
          amount: Number(amount),
          message: message || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to initiate payment")
        setLoading(false)
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">
          Your name <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={tipperName}
          onChange={(e) => setTipperName(e.target.value)}
          className="w-full border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white placeholder:text-gray-400"
          placeholder="Blessing"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">Email</label>
        <input
          type="email"
          value={tipperEmail}
          onChange={(e) => setTipperEmail(e.target.value)}
          required
          className="w-full border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white placeholder:text-gray-400"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">
          Amount <span className="text-gray-400">(NGN)</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min={100}
          className="w-full border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white placeholder:text-gray-400"
          placeholder="1000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">
          Message <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white placeholder:text-gray-400 resize-none"
          placeholder="Keep pushing!"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black rounded-lg py-3 font-medium disabled:opacity-50"
      >
        {loading ? "Redirecting to payment..." : `Send ${amount ? `₦${Number(amount).toLocaleString()}` : "tip"}`}
      </button>
    </form>
  )
}
