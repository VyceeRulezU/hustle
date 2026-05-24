import { notFound } from "next/navigation"
import { getPrisma } from "@/lib/prisma"

const prisma = getPrisma()
import TipForm from "@/components/TipForm"
import PageBackground from "@/components/PageBackground"
import { getBackgroundImage } from "@/lib/pexels"

export default async function TipPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const creator = await prisma.user.findUnique({
    where: { slug },
    select: { displayName: true, bio: true },
  })

  if (!creator) notFound()

  const bgImage = await getBackgroundImage()

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <PageBackground imageUrl={bgImage} />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{creator.displayName}</h1>
          {creator.bio && (
            <p className="text-gray-300 mt-1">{creator.bio}</p>
          )}
          <p className="text-sm text-gray-400 mt-4">
            Support this creator with a tip
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <TipForm slug={slug} />
        </div>
      </div>
    </div>
  )
}
