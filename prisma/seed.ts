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
  // URL-safe strong-ish password
  return crypto.randomBytes(18).toString("base64url");
}

async function main() {
  console.log("🌱 Starting seed...");

  // Farm (defaults are dev-safe; override via env)
  const farmName = env("FARM_NAME", "Budgalong (Dev)")!;
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
    console.log(`✅ Farm created: ${farm.name} (${farm.id})`);
  } else {
    console.log(`ℹ️ Farm already exists: ${farm.name} (${farm.id})`);
  };

  console.log(`✅ Farm ready: ${farm.name} (${farm.id})`);

  // Admin user
  const adminEmail = env("ADMIN_EMAIL", "admin@local.dev")!;
  const adminName = env("ADMIN_NAME", "Admin")!;
  const adminPassword = env("ADMIN_PASSWORD") ?? genPassword();
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: "admin",
      farmId: farm.id,
      password: adminHash,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: "admin",
      farmId: farm.id,
      password: adminHash,
    },
  });

  console.log(`✅ Admin ready: ${admin.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log("🔐 Generated ADMIN_PASSWORD (save it now):", adminPassword);
  }

  // Optional demo employee (controlled by env flag)
  const createDemoEmployee = env("SEED_DEMO_EMPLOYEE", "false") === "true";

  if (createDemoEmployee) {
    const empEmail = env("EMPLOYEE_EMAIL", "employee@local.dev")!;
    const empName = env("EMPLOYEE_NAME", "Employee")!;
    const empPassword = env("EMPLOYEE_PASSWORD") ?? genPassword();
    const empHash = await bcrypt.hash(empPassword, 10);

    const empUser = await prisma.user.upsert({
      where: { email: empEmail },
      update: {
        name: empName,
        role: "employee",
        farmId: farm.id,
        password: empHash,
      },
      create: {
        email: empEmail,
        name: empName,
        role: "employee",
        farmId: farm.id,
        password: empHash,
      },
    });

    console.log(`✅ Employee user ready: ${empUser.email}`);
    if (!process.env.EMPLOYEE_PASSWORD) {
      console.log("🔐 Generated EMPLOYEE_PASSWORD (save it now):", empPassword);
    }

    // Create employee profile if schema supports it
    const existingEmployee = await prisma.employee.findFirst({
      where: { userId: empUser.id },
    });

    if (!existingEmployee) {
      await prisma.employee.create({
        data: {
          farmId: farm.id,
          userId: empUser.id,
          legalName: empName,
          preferredName: empName,
          employmentStatus: "active",
          startDate: new Date(),
          ordinaryHoursPerWeek: 38,
        },
      });

      console.log("✅ Employee profile created");
    } else {
      console.log("ℹ️ Employee profile already exists");
    }
  } else {
    console.log("ℹ️ SEED_DEMO_EMPLOYEE=false (skipping demo employee)");
  }

  console.log("🏁 Seeding finished.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

