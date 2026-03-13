import fp from "fastify-plugin";

export default fp(async (app) => {

  app.decorate("authenticate", async function (req: any, reply: any) {

    try {

      let token: string | undefined;

      const authHeader = req.headers.authorization;

      if (authHeader) {
        token = authHeader.split(" ")[1];
      }

      if (!token && req.cookies?.gse_session) {
        token = req.cookies.gse_session;
      }

      if (!token) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const decoded = app.jwt.verify(token);

      req.user = decoded;

      return;

    } catch (err) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

  });

});
