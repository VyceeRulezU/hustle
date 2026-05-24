import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    url: "https://images.pexels.com/photos/29579756/pexels-photo-29579756.jpeg",
  })
}
