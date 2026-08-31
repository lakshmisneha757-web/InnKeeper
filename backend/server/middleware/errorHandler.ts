import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: "Route not found" });
  next();
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("[server]", err);
  const status = err instanceof Error && "status" in err && typeof err.status === "number" ? err.status : 500;
  res.status(status).json({
    error: err instanceof Error ? err.message : "Internal server error",
  });
};
