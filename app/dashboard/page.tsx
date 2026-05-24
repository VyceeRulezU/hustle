"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardStats from "@/components/DashboardStats"
import RecentTips from "@/components/RecentTips"
import MessageWall from "@/components/MessageWall"
import { signOut } from "next-auth/react"
import PageBackground from "@/components/PageBackground"
import ErrorModal from "@/components/ErrorModal"

interface DashboardData {
  slug: string
  displayName: string
  totalAmount: number
  tipCount: number
  recentTips: Array<{
    id: string
    amount: number
    tipperName: string | null
    message: string | null
    createdAt: string
  }>
  messages: Array<{
    id: string
    tipperName: string | null
    message: string
    amount: number
  }>
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard")
  if (!res.ok) throw new Error("Failed to fetch dashboard")
  return res.json()
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bgImage, setBgImage] = useState("")
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/background")
      .then((r) => r.json())
      .then((d) => setBgImage(d.url))
      .catch(() => {})
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: status === "authenticated",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  async function handleSignOut() {
    await signOut()
    setShowLogoutModal(false)
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <PageBackground imageUrl={bgImage} />
        <div className="space-y-4 w-full max-w-2xl px-4 relative">
          <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-white/20 rounded-xl animate-pulse" />
            <div className="h-24 bg-white/20 rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-white/20 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  const tipPageUrl = data?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/tip/${data.slug}`
    : null

  return (
    <div className="relative min-h-screen px-4 py-8">
      <PageBackground imageUrl={bgImage} />
      <div className="max-w-2xl mx-auto relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-300 hover:text-white text-sm flex items-center gap-1">
              <span>&larr;</span> Back
            </a>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-gray-300">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-sm text-gray-300 hover:text-white"
          >
            Sign out
          </button>
        </div>

        <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
          <p className="text-sm text-gray-300 mb-2">Your tip page</p>
          {tipPageUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={tipPageUrl}
                className="text-white font-medium hover:underline"
              >
                View your tip page &rarr;
              </a>
              <button
                onClick={() => copyLink(tipPageUrl)}
                className="text-xs text-gray-400 hover:text-white border border-white/20 rounded px-2 py-0.5"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          ) : (
            <div className="h-5 w-48 bg-white/20 rounded animate-pulse" />
          )}
        </div>

        {data && (
          <>
            <DashboardStats totalAmount={data.totalAmount} tipCount={data.tipCount} />
            <RecentTips tips={data.recentTips} />
            <MessageWall messages={data.messages} />
          </>
        )}
      </div>

      <ErrorModal
        open={showLogoutModal}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        onConfirm={handleSignOut}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  )
}
