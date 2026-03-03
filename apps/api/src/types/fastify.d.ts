import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: any;
  }

  interface FastifyRequest {
    user: {
      accountId: string;
    };
  }
}
