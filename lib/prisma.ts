import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (url?.includes("postgres")) {
    const adapter = new PrismaNeon({ connectionString: url })
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}
