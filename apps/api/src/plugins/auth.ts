import fp from "fastify-plugin";

export default fp(async (app) => {
  app.decorate("authenticate", async function (req: any, reply: any) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const decoded = app.jwt.verify(token);
      req.user = decoded;

      // IMPORTANT: explicitly return to allow route to continue
      return;

    } catch (err) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
