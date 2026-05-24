import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

const prisma = getPrisma()
import { verifyTransaction } from "@/lib/flutterwave"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transaction_id")
    const slug = searchParams.get("slug")

    if (!transactionId || !slug) {
      return NextResponse.json(
        { verified: false, error: "Missing transaction_id or slug" },
        { status: 400 }
      )
    }

    const creator = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!creator) {
      return NextResponse.json(
        { verified: false, error: "Creator not found" },
        { status: 404 }
      )
    }

    const existing = await prisma.tip.findUnique({
      where: { flutterwaveTransactionId: transactionId },
    })

    if (existing) {
      return NextResponse.json({
        verified: true,
        tip: {
          amount: existing.amount,
          currency: existing.currency,
          tipperName: existing.tipperName,
          message: existing.message,
          createdAt: existing.createdAt.toISOString(),
        },
      })
    }

    const flwData = await verifyTransaction(transactionId)

    if (flwData.status !== "successful") {
      return NextResponse.json({
        verified: false,
        error: "Payment not successful",
      })
    }

    if (flwData.currency !== "NGN") {
      return NextResponse.json({
        verified: false,
        error: "Currency mismatch",
      })
    }

    const pendingTip = await prisma.tip.findUnique({
      where: { txRef: flwData.tx_ref },
    })

    if (!pendingTip) {
      return NextResponse.json({
        verified: false,
        error: "Transaction reference not found",
      })
    }

    if (flwData.amount < pendingTip.amount) {
      return NextResponse.json({
        verified: false,
        error: "Amount mismatch",
      })
    }

    const tip = await prisma.tip.update({
      where: { txRef: flwData.tx_ref },
      data: {
        flutterwaveTransactionId: String(flwData.id),
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    })

    return NextResponse.json({
      verified: true,
      tip: {
        amount: tip.amount,
        currency: tip.currency,
        tipperName: tip.tipperName,
        message: tip.message,
        createdAt: tip.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json(
      { verified: false, error: "Verification failed" },
      { status: 500 }
    )
  }
}
