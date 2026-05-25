import { getPrisma } from "@/lib/prisma"
import { verifyTransaction } from "@/lib/flutterwave"
import { notFound } from "next/navigation"

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
  const { transaction_id, status } = await searchParams

  if (status !== "successful" || !transaction_id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Payment failed</h1>
          <p className="text-gray-500">The payment was not completed. Please try again.</p>
        </div>
      </div>
    )
  }

  async function getReceipt(txId: string) {
    const creator = await prisma.user.findUnique({
      where: { slug },
      select: { displayName: true },
    })
    if (!creator) notFound()

    const existing = await prisma.tip.findUnique({
      where: { flutterwaveTransactionId: txId },
    })

    if (existing) {
      return { creator: creator.displayName, tip: existing, error: null }
    }

    try {
      const flwData = await verifyTransaction(txId)
      const pendingTip = await prisma.tip.findUnique({
        where: { txRef: flwData.tx_ref },
      })
      if (!pendingTip) return { creator: null, tip: null, error: "Transaction not found" }

      if (flwData.status !== "successful" || flwData.currency !== "NGN" || flwData.amount < pendingTip.amount) {
        return { creator: null, tip: null, error: "Verification failed" }
      }

      const tip = await prisma.tip.update({
        where: { txRef: flwData.tx_ref },
        data: {
          flutterwaveTransactionId: String(flwData.id),
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      })

      return { creator: creator.displayName, tip, error: null }
    } catch {
      return { creator: null, tip: null, error: "Verification failed" }
    }
  }

  const { creator, tip, error } = await getReceipt(transaction_id)

  if (error || !tip || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Verification failed</h1>
          <p className="text-gray-500">{error || "Something went wrong"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm border border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">&#x2705;</div>
        <h1 className="text-xl font-bold mb-1">Tip sent!</h1>
        <p className="text-gray-500 text-sm mb-6">Your support means the world.</p>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">To</span>
            <span className="font-medium">{creator}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium">&#8358;{tip.amount.toLocaleString()}</span>
          </div>
          {tip.tipperName && (
            <div className="flex justify-between">
              <span className="text-gray-500">From</span>
              <span className="font-medium">{tip.tipperName}</span>
            </div>
          )}
          {tip.message && (
            <div className="pt-2">
              <p className="text-gray-500 text-sm italic">&ldquo;{tip.message}&rdquo;</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-400">
          The Hustle Receipt &middot; Verified
        </div>
      </div>
    </div>
  )
}
