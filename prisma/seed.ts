import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return v && v.trim().length ? v.trim() : fallback;
}

function genPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

async function main() {
  console.log("🌱 Starting seed...");

  // Farm
  const farmName = env("FARM_NAME", "Budgalong Farm")!;
  const farmAbn = env("FARM_ABN", "12 345 678 901")!;
  const farmAddress = env("FARM_ADDRESS", "123 Farm Lane, NSW 2000")!;
  const farmTimezone = env("FARM_TIMEZONE", "Australia/Sydney")!;

  let farm = await prisma.farm.findFirst({
    where: { name: farmName },
  });

  if (!farm) {
    farm = await prisma.farm.create({
      data: {
        name: farmName,
        abn: farmAbn,
        address: farmAddress,
        timezone: farmTimezone,
      },
    });
    console.log(`✅ Farm created: ${farm.name}`);
  } else {
    console.log(`ℹ️ Farm already exists: ${farm.name}`);
  }

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("MISSING_AUTH: ADMIN_EMAIL and ADMIN_PASSWORD must be provided in environment variables.");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: env("ADMIN_NAME", "Admin"),
        role: "admin",
        farmId: farm.id,
        password: adminHash,
      },
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${adminEmail} (No password reset performed)`);
  }

  // Optional demo employee
  const createDemo = env("SEED_DEMO", "false") === "true";

  if (createDemo) {
    const empEmail = env("EMPLOYEE_EMAIL", "demo-worker@budgalong.dev")!;
    const empName = env("EMPLOYEE_NAME", "Demo Worker")!;

    // For demo, we ensure a known or generated password
    const empPassword = env("EMPLOYEE_PASSWORD", "Demo1234")!;
    const empHash = await bcrypt.hash(empPassword, 10);

    const empUser = await prisma.user.upsert({
      where: { email: empEmail },
      update: { farmId: farm.id },
      create: {
        email: empEmail,
        name: empName,
        role: "employee",
        farmId: farm.id,
        password: empHash,
      },
    });

    await prisma.employee.upsert({
      where: { userId: empUser.id },
      update: {},
      create: {
        farmId: farm.id,
        userId: empUser.id,
        legalName: empName,
        preferredName: empName,
        employmentStatus: "active",
        startDate: new Date(),
        ordinaryHoursPerWeek: 38,
      },
    });

    console.log(`✅ Demo employee ready: ${empEmail}`);
  } else {
    console.log("ℹ️ SEED_DEMO=false (skipping demo entities)");
  }

  console.log("🏁 Seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
