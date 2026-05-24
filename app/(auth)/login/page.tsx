"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PageBackground from "@/components/PageBackground"
import ErrorModal from "@/components/ErrorModal"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [bgImage, setBgImage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    fetch("/api/background")
      .then((r) => r.json())
      .then((d) => setBgImage(d.url))
      .catch(() => {})
  }, [])

  function handleLoginSuccess() {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      router.push("/dashboard")
      router.refresh()
    }, 1200)
  }

  function handleLoginError() {
    setShowError(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      handleLoginError()
      return
    }

    handleLoginSuccess()
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

      <ErrorModal
        open={showSuccess}
        title="Success"
        message="Logged in successfully!"
        onClose={() => setShowSuccess(false)}
      />

      <ErrorModal
        open={showError}
        title="Invalid credentials"
        message="The email or password you entered is incorrect. Please try again."
        onClose={() => setShowError(false)}
      />
    </div>
  )
}
