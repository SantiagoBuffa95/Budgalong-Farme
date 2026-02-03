import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Normalizing user emails to lowercase...");

    const users = await prisma.user.findMany();

    for (const user of users) {
        if (user.email && user.email !== user.email.toLowerCase()) {
            const lowerEmail = user.email.toLowerCase();
            console.log(`Fixing: ${user.email} -> ${lowerEmail}`);

            // Check collision
            const exists = await prisma.user.findUnique({ where: { email: lowerEmail } });
            if (exists) {
                console.warn(`⚠️ Cannot lower case ${user.email} because ${lowerEmail} already exists (ID: ${exists.id}). Skipping.`);
                continue;
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { email: lowerEmail }
            });
        }
    }
    console.log("✅ Normalization complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
