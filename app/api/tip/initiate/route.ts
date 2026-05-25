import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import { initiatePayment } from "@/lib/flutterwave"

export async function POST(request: Request) {
  const prisma = getPrisma()
  try {
    const { creatorSlug, tipperName, tipperEmail, amount, message } =
      await request.json()

    if (!creatorSlug || !tipperEmail || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: "Minimum tip is ₦100" },
        { status: 400 }
      )
    }

    const creator = await prisma.user.findUnique({
      where: { slug: creatorSlug },
      select: { id: true, displayName: true },
    })

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    const txRef = `tip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    await prisma.tip.create({
      data: {
        creatorId: creator.id,
        tipperName: tipperName || null,
        tipperEmail,
        amount,
        message: message || null,
        txRef,
        status: "PENDING",
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    const checkoutUrl = await initiatePayment({
      txRef,
      amount,
      email: tipperEmail,
      name: tipperName || "Anonymous",
      redirectUrl: `${baseUrl}/tip/${creatorSlug}/success`,
      title: `Tip ${creator.displayName}`,
      description: message || `Support ${creator.displayName}`,
      meta: { creatorId: creator.id, message },
    })

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error("Initiate payment error:", error)
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    )
  }
}
