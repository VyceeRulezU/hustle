import Link from "next/link"
import PageBackground from "@/components/PageBackground"
import { getBackgroundImage } from "@/lib/pexels"

export default async function HomePage() {
  const bgImage = await getBackgroundImage()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <PageBackground imageUrl={bgImage} />
      <h1 className="text-4xl font-bold mb-4 text-white">The Hustle Receipt</h1>
      <p className="text-lg text-gray-300 mb-8 max-w-md">
        A link you share. A way fans send you money. A receipt at the end.
        Powered by Flutterwave.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="bg-white text-black rounded-lg px-6 py-3 font-medium"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="border border-white text-white rounded-lg px-6 py-3 font-medium"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}
