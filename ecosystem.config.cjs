module.exports = {
  apps: [
    {
      name: "gse-web",
      cwd: "/var/www/gse/apps/web",
      script: ".next/standalone/apps/web/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    },

    {
      name: "gse-api",
      cwd: "/var/www/gse/apps/api",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5001,
        DATABASE_URL: "postgresql://postgres:LmdC7yHjBlpa8B4C@db.lmfwculiklqgwrpdvodf.supabase.co:5432/postgres",
        JWT_ACCESS_SECRET: "supersecret_access",
        JWT_REFRESH_SECRET: "supersecret_refresh"
      }
    },

    {
      name: "gse-ws",
      cwd: "/var/www/gse/apps/ws",
      script: "dist/index.js",   // ← FIXED
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5002
      }
    },

    {
      name: "gse-worker",
      cwd: "/var/www/gse/apps/worker",
      script: "dist/index.js",   // ← FIXED
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5003
      }
    }
  ]
};
