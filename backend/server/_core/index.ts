import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { config } from "../config/env";
import authRoutes from "../routes/authRoutes";
import healthRoutes from "../routes/healthRoutes";
import restRoutes from "../routes/restRoutes";
import { swaggerSpec } from "../swagger";
import swaggerUi from "swagger-ui-express";
import type { Request, Response, NextFunction } from "express";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  console.log("[server] environment=", config.nodeEnv);
  // Configure body parser with larger size limit for file uploads
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use("/api", healthRoutes);
  app.use("/api", restRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Audio upload endpoint for voice transcription
  app.post("/api/storage/upload", async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        const ext = (req.headers["content-type"] || "").includes("webm") ? "webm" : "audio";
        const { url } = await storagePut(
          `voice/${Date.now()}.${ext}`,
          buffer,
          req.headers["content-type"] || "audio/webm"
        );
        res.json({ url });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (config.nodeEnv === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use(notFoundHandler);
  app.use(errorHandler);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
