"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PageBackground from "@/components/PageBackground"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [bgImage, setBgImage] = useState("")

  useEffect(() => {
    fetch("/api/background")
      .then((r) => r.json())
      .then((d) => setBgImage(d.url))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid email or password")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <PageBackground imageUrl={bgImage} />
      <div className="w-full max-w-sm relative">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">Log in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white placeholder:text-gray-400"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black rounded-lg py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-400">
          No account?{" "}
          <Link href="/signup" className="underline text-white">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
