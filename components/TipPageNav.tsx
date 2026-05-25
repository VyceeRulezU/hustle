"use client"

import Link from "next/link"

export default function TipPageNav({ slug }: { slug: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={() => history.back()}
        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
      >
        &larr; Back
      </button>
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Close &times;
      </Link>
    </div>
  )
}
