module.exports = {
  apps: [
    {
      name: "gse-web",
      cwd: "/var/www/gse/apps/web",
      script: ".next/standalone/gse/apps/web/server.js",
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
      script: "dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5001
      }
    },
    {
      name: "gse-ws",
      cwd: "/var/www/gse/apps/ws",
      script: "dist/index.js",
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
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5003
      }
    }
  ]
};
