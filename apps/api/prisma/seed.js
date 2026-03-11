"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌍 Seeding countries...");
    const countries = [
        { id: "NL", name: "Netherlands", code: "NL", borderSecurity: 1 },
        { id: "US", name: "United States", code: "US", borderSecurity: 1 },
        { id: "MX", name: "Mexico", code: "MX", borderSecurity: 1.1 },
        { id: "CO", name: "Colombia", code: "CO", borderSecurity: 1.2 },
        { id: "JP", name: "Japan", code: "JP", borderSecurity: 1.3 }
    ];
    for (const country of countries) {
        await prisma.country.upsert({
            where: { id: country.id },
            update: {},
            create: country
        });
    }
    console.log("✅ Countries seeded");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
