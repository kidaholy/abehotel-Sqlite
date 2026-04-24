// Minimal Prisma config for Prisma 7
// Avoiding imports to ensure compatibility with the server environment
export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL,
  },
};
