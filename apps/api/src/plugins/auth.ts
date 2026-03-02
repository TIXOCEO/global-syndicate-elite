import fp from "fastify-plugin";

export default fp(async (app) => {
  app.decorate("authenticate", async function (req: any, reply: any) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) throw new Error("No token");

      const decoded = app.jwt.verify(token);
      req.user = decoded;
    } catch {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
