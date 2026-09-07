import bcrypt from "bcrypt";
import { PrismaClient, SourceType } from "@prisma/client";

const prisma = new PrismaClient();

type DataSourceSeed = {
  name: string;
  baseUrl: string;
  sourceType: SourceType;
};

type PersonSeed = {
  fullName: string;
  role: string;
  category: string;
  isPublic: boolean;
  biography: string;
};

async function upsertDataSourceByName(data: DataSourceSeed) {
  const existing = await prisma.dataSource.findFirst({ where: { name: data.name } });

  if (existing) {
    return existing;
  }

  return prisma.dataSource.create({ data });
}

async function upsertPersonByFullName(data: PersonSeed) {
  const existing = await prisma.person.findFirst({ where: { fullName: data.fullName } });

  if (existing) {
    return prisma.person.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.person.create({ data });
}

async function createReferenceIfMissing(data: {
  personId: string;
  dataSourceId: string;
  url: string;
  content: string;
}) {
  const existing = await prisma.reference.findFirst({ where: { url: data.url } });

  if (existing) {
    return existing;
  }

  return prisma.reference.create({ data });
}

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

  const openData = await upsertDataSourceByName({
    name: "Open Civic Registry",
    baseUrl: "https://example.org/civic",
    sourceType: "API"
  });

  const manualArchive = await upsertDataSourceByName({
    name: "Manual Editorial Archive",
    baseUrl: "https://example.org/archive",
    sourceType: "MANUAL"
  });

  const ada = await upsertPersonByFullName({
    fullName: "Ada Lovelace",
    role: "Mathematician",
    category: "Science",
    isPublic: true,
    biography: "Pioneer of computing concepts."
  });

  await upsertPersonByFullName({
    fullName: "Grace Hopper",
    role: "Computer Scientist",
    category: "Technology",
    isPublic: true,
    biography: "Developed influential compiler technology."
  });

  await upsertPersonByFullName({
    fullName: "Katherine Johnson",
    role: "Mathematician",
    category: "Science",
    isPublic: true,
    biography: "Known for orbital mechanics calculations."
  });

  await upsertPersonByFullName({
    fullName: "Hidden Researcher",
    role: "Analyst",
    category: "Research",
    isPublic: false,
    biography: "Non-public seed record."
  });

  await createReferenceIfMissing({
    personId: ada.id,
    dataSourceId: openData.id,
    url: "https://example.org/civic/ada-lovelace",
    content: "Public civic registry entry."
  });

  await createReferenceIfMissing({
    personId: ada.id,
    dataSourceId: manualArchive.id,
    url: "https://example.org/archive/ada-lovelace",
    content: "Editorial archive entry."
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
