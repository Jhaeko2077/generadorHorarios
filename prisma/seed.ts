import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const congregation = await prisma.congregation.upsert({
    where: { code: "2071" },
    update: { name: "UMACHIRI" },
    create: { name: "UMACHIRI", code: "2071" },
  });

  const groups = Array.from({ length: 8 }, (_, index) => ({
    name: `Grupo ${index + 1}`,
    prefixNumber: index + 1,
    description: `Grupo principal ${index + 1}`,
  }));

  for (const group of groups) {
    await prisma.group.upsert({
      where: { prefixNumber: group.prefixNumber },
      update: { name: group.name, description: group.description, active: true },
      create: group,
    });
  }

  const categoryNames = [
    "Ancianos",
    "Siervos ministeriales",
    "Precursores regulares",
    "Precursoras regulares",
    "Conductores",
    "Lectores",
    "Oracion",
    "Acomodadores",
    "Tesoros de la Biblia",
    "Seamos Mejores Maestros",
    "Nuestra Vida Cristiana",
    "Estudiantes",
    "Ayudantes",
    "Hermanas",
  ];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { active: true },
      create: { name },
    });
  }

  const group1 = await prisma.group.findUniqueOrThrow({ where: { prefixNumber: 1 } });
  const group2 = await prisma.group.findUniqueOrThrow({ where: { prefixNumber: 2 } });

  const sampleMembers = [
    { fullName: "Hermano Ejemplo Uno", code: "101", groupId: group1.id },
    { fullName: "Hermano Ejemplo Dos", code: "102", groupId: group1.id },
    { fullName: "Hermana Ejemplo Tres", code: "201", groupId: group2.id },
    { fullName: "Hermana Ejemplo Cuatro", code: "202", groupId: group2.id },
  ];

  for (const member of sampleMembers) {
    await prisma.member.upsert({
      where: { code: member.code },
      update: { fullName: member.fullName, groupId: member.groupId, active: true },
      create: member,
    });
  }

  console.log("Seed completed", { congregation: congregation.code });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
