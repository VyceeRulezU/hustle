import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"

export async function GET() {
  const prisma = getPrisma()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const creatorId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { slug: true, displayName: true },
  })

  const [aggregate, recentTips] = await Promise.all([
    prisma.tip.aggregate({
      where: { creatorId, status: "VERIFIED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.tip.findMany({
      where: { creatorId, status: "VERIFIED" },
      orderBy: { verifiedAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        tipperName: true,
        message: true,
        createdAt: true,
      },
    }),
  ])

    const messages: Array<{ id: string; tipperName: string | null; message: string; amount: number }> = []
    for (const t of recentTips) {
      if (t.message) {
        messages.push({ id: t.id, tipperName: t.tipperName, message: t.message, amount: t.amount })
      }
    }

  return NextResponse.json({
    slug: user?.slug,
    displayName: user?.displayName,
    totalAmount: aggregate._sum.amount || 0,
    tipCount: aggregate._count,
    recentTips: recentTips.map((t: { id: string; amount: number; tipperName: string | null; message: string | null; createdAt: Date }) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    messages,
  })
}
