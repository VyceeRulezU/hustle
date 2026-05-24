"use client"

import Link from "next/link"
import PageBackground from "@/components/PageBackground"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <PageBackground imageUrl="https://images.pexels.com/photos/29579756/pexels-photo-29579756.jpeg" />
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">&#9888;</div>
        <h1 className="text-2xl font-bold text-white mb-2">Server error</h1>
        <p className="text-gray-300 mb-6">
          Something went wrong on our end. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-white text-black rounded-lg px-6 py-2 font-medium"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-white text-white rounded-lg px-6 py-2 font-medium"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
