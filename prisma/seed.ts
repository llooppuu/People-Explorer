import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin1234!", 10);
  const testPasswordHash = await bcrypt.hash("Test1234!", 10);

  await prisma.user.upsert({
    where: { email: "admin@dpe.ee" },
    update: {},
    create: {
      email: "admin@dpe.ee",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      trustScore: 100
    }
  });

  await prisma.user.upsert({
    where: { email: "testkasutaja@dpe.ee" },
    update: {},
    create: {
      email: "testkasutaja@dpe.ee",
      passwordHash: testPasswordHash,
      role: "USER",
      trustScore: 45
    }
  });

  const openData = await prisma.dataSource.create({
    data: {
      name: "Open Civic Registry",
      baseUrl: "https://example.org/civic",
      sourceType: "API"
    }
  });

  const manualArchive = await prisma.dataSource.create({
    data: {
      name: "Manual Editorial Archive",
      baseUrl: "https://example.org/archive",
      sourceType: "MANUAL"
    }
  });

  const ada = await prisma.person.create({
    data: {
      fullName: "Ada Lovelace",
      role: "Mathematician",
      category: "Science",
      isPublic: true,
      biography: "Pioneer of computing concepts."
    }
  });

  await prisma.person.createMany({
    data: [
      {
        fullName: "Grace Hopper",
        role: "Computer Scientist",
        category: "Technology",
        isPublic: true,
        biography: "Developed influential compiler technology."
      },
      {
        fullName: "Katherine Johnson",
        role: "Mathematician",
        category: "Science",
        isPublic: true,
        biography: "Known for orbital mechanics calculations."
      },
      {
        fullName: "Hidden Researcher",
        role: "Analyst",
        category: "Research",
        isPublic: false,
        biography: "Non-public seed record."
      }
    ]
  });

  await prisma.reference.createMany({
    data: [
      {
        personId: ada.id,
        dataSourceId: openData.id,
        url: "https://example.org/civic/ada-lovelace",
        content: "Public civic registry entry."
      },
      {
        personId: ada.id,
        dataSourceId: manualArchive.id,
        url: "https://example.org/archive/ada-lovelace",
        content: "Editorial archive entry."
      }
    ]
  });

  await prisma.tag.createMany({
    data: [
      { name: "science", color: "#2f80ed" },
      { name: "history", color: "#27ae60" }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
