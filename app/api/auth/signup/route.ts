import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getPrisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

const prisma = getPrisma()

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "Email, password, and display name are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const slug = generateSlug(displayName)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        slug,
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      slug: user.slug,
    })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
