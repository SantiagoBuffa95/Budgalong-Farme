import { PrismaClient } from "@prisma/client";

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
    console.log("🔍 Scanning Employee Credentials...\n");

    const employees = await prisma.employee.findMany({
        include: {
            user: true
        }
    });

    if (employees.length === 0) {
        console.log("⚠️ No employees found in the database.");
    } else {
        console.table(employees.map(emp => ({
            Name: emp.legalName,
            Status: emp.employmentStatus,
            HasUserLinked: !!emp.userId,
            UserEmail: emp.user?.email || "❌ No Email (Orphaned User?)",
            HasPassword: !!emp.user?.password ? "✅ Yes (Hashed)" : "❌ No (Invite Pending?)",
            InviteToken: emp.user?.inviteToken ? "🎟️ Pending" : "none"
        })));
    }

    console.log("\n🔍 Scanning ALL Users (including Admins)...\n");
    const users = await prisma.user.findMany();
    console.table(users.map(u => ({
        ID: u.id,
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Active: u.isActive,
        HasPassword: !!u.password
    })));
}

main()
    .catch(e => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
