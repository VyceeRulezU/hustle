import { getPrisma } from "@/lib/prisma"
import { verifyTransaction } from "@/lib/flutterwave"
import { notFound } from "next/navigation"
import Link from "next/link"
import PageBackground from "@/components/PageBackground"

export const dynamic = "force-dynamic"

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ transaction_id?: string; status?: string; tx_ref?: string }>
}) {
  const prisma = getPrisma()
  const { slug } = await params
  const { transaction_id, status, tx_ref } = await searchParams

  if (status === "cancelled") {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <PageBackground />
        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">&#x274C;</div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment cancelled</h1>
          <p className="text-gray-300 mb-6">
            You cancelled the payment. No charges were made.
          </p>
          <Link
            href={`/tip/${slug}`}
            className="inline-block bg-white text-black rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>
    )
  }

  if (status === "failed" || (status !== "successful" && transaction_id)) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <PageBackground />
        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">&#x274C;</div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment failed</h1>
          <p className="text-gray-300 mb-6">
            The payment could not be processed. Please try again.
          </p>
          <Link
            href={`/tip/${slug}`}
            className="inline-block bg-white text-black rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>
    )
  }

  if (!transaction_id) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <PageBackground />
        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">&#x2753;</div>
          <h1 className="text-2xl font-bold text-white mb-2">No transaction data</h1>
          <p className="text-gray-300 mb-6">
            No payment information was received.
          </p>
          <Link
            href={`/tip/${slug}`}
            className="inline-block bg-white text-black rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>
    )
  }

  const creator = await prisma.user.findUnique({
    where: { slug },
    select: { displayName: true },
  })
  if (!creator) notFound()

  const existing = await prisma.tip.findUnique({
    where: { flutterwaveTransactionId: transaction_id },
  })

  if (!existing) {
    let tip
    try {
      const flwData = await verifyTransaction(transaction_id)
      const pendingTip = await prisma.tip.findUnique({
        where: { txRef: flwData.tx_ref },
      })
      if (!pendingTip) {
        return (
          <div className="relative min-h-screen flex items-center justify-center px-4">
            <PageBackground />
            <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
              <div className="text-5xl mb-4">&#x274C;</div>
              <h1 className="text-2xl font-bold text-white mb-2">Transaction not found</h1>
              <p className="text-gray-300 mb-6">
                We could not find this transaction in our records.
              </p>
              <Link
                href={`/tip/${slug}`}
                className="inline-block bg-white text-black rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors"
              >
                Try again
              </Link>
            </div>
          </div>
        )
      }

      if (flwData.status !== "successful" || flwData.currency !== "NGN" || flwData.amount < pendingTip.amount) {
        return (
          <div className="relative min-h-screen flex items-center justify-center px-4">
            <PageBackground />
            <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
              <div className="text-5xl mb-4">&#x274C;</div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
              <p className="text-gray-300 mb-6">
                The payment could not be verified. Please contact support.
              </p>
              <Link
                href={`/tip/${slug}`}
                className="inline-block bg-white text-black rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors"
              >
                Try again
              </Link>
            </div>
          </div>
        )
      }

      tip = await prisma.tip.update({
        where: { txRef: flwData.tx_ref },
        data: {
          flutterwaveTransactionId: String(flwData.id),
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      })
    } catch {
      return (
        <div className="relative min-h-screen flex items-center justify-center px-4">
          <PageBackground />
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">&#x26A0;&#xFE0F;</div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification error</h1>
            <p className="text-gray-300 mb-6">
              Something went wrong while verifying your payment. Your payment may still have gone through.
            </p>
            <Link
              href={`/tip/${slug}`}
              className="inline-block bg-white text-black rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors"
            >
              Try again
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <PageBackground />
        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">&#x2705;</div>
          <h1 className="text-2xl font-bold text-white mb-1">Tip sent!</h1>
          <p className="text-gray-400 text-sm mb-6">Your support means the world.</p>

          <div className="border-t border-white/20 pt-6 space-y-2">
            <div className="flex justify-between text-white">
              <span className="text-gray-400">To</span>
              <span className="font-medium">{creator.displayName}</span>
            </div>
            <div className="flex justify-between text-white">
              <span className="text-gray-400">Amount</span>
              <span className="font-medium">&#8358;{tip.amount.toLocaleString()}</span>
            </div>
            {tip.tipperName && (
              <div className="flex justify-between text-white">
                <span className="text-gray-400">From</span>
                <span className="font-medium">{tip.tipperName}</span>
              </div>
            )}
            {tip.message && (
              <div className="pt-2">
                <p className="text-gray-400 text-sm italic">&ldquo;{tip.message}&rdquo;</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-xs text-gray-500">
            The Hustle Receipt &middot; Verified
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <PageBackground />
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">&#x2705;</div>
        <h1 className="text-2xl font-bold text-white mb-1">Tip sent!</h1>
        <p className="text-gray-400 text-sm mb-6">Your support means the world.</p>

        <div className="border-t border-white/20 pt-6 space-y-2">
          <div className="flex justify-between text-white">
            <span className="text-gray-400">To</span>
            <span className="font-medium">{creator.displayName}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-gray-400">Amount</span>
            <span className="font-medium">&#8358;{existing.amount.toLocaleString()}</span>
          </div>
          {existing.tipperName && (
            <div className="flex justify-between text-white">
              <span className="text-gray-400">From</span>
              <span className="font-medium">{existing.tipperName}</span>
            </div>
          )}
          {existing.message && (
            <div className="pt-2">
              <p className="text-gray-400 text-sm italic">&ldquo;{existing.message}&rdquo;</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          The Hustle Receipt &middot; Verified
        </div>
      </div>
    </div>
  )
}
