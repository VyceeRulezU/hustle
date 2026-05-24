import Link from "next/link"
import PageBackground from "@/components/PageBackground"

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <PageBackground imageUrl="https://images.pexels.com/photos/29579756/pexels-photo-29579756.jpeg" />
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">&#128269;</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-300 mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-white text-black rounded-lg px-6 py-2 font-medium"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
