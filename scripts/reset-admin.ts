import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Attempt to use DIRECT_URL for scripts to avoid PgBouncer/Prepared Statement issues in CLI
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url
        }
    }
});

async function main() {
    console.log("🔌 Connecting to DB...");
    // console.log(`Debug URL: ${url?.substring(0, 15)}...`); 

    const email = "Tom@budgalong.app";
    const password = "Budgalong2026";
    const farmName = "Budgalong";

    console.log(`🔒 Resetting admin password for: ${email}`);

    // 1. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Find Farm (or create default)
    let farm = await prisma.farm.findFirst({ where: { name: { contains: farmName } } });
    if (!farm) {
        console.log("⚠️ Farm 'Budgalong' not found. searching for ANY farm...");
        farm = await prisma.farm.findFirst();
    }

    if (!farm) {
        console.error("❌ No farm found in DB. Please run seed first or create a farm manually.");
        process.exit(1);
    }
    console.log(`🏠 Using Farm: ${farm.name} (${farm.id})`);

    // 3. Upsert Admin User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            isActive: true, // Ensure active
            role: 'admin',
            farmId: farm.id
        },
        create: {
            email,
            name: "Tom Admin",
            password: hashedPassword,
            role: 'admin',
            isActive: true, // Ensure active
            farmId: farm.id
        }
    });

    console.log(`✅ Success! user '${user.email}' password set to '${password}'.`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`🔑 Role: ${user.role}`);
}

main()
    .catch(e => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
