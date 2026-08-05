import swaggerJSDoc from "swagger-jsdoc";
import path from "node:path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "InnKeeper PMS API",
      version: "1.0.0",
      description: "Production-ready REST API for hospitality operations",
    },
    servers: [{ url: "/api" }],
  },
  apis: [path.resolve(process.cwd(), "server", "routes", "restRoutes.ts")],
};

export const swaggerSpec = swaggerJSDoc(options);
