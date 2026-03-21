import express from "express";
import { requireAuth } from "./middleware/auth";
import { registerApiRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Protect all API routes with auth
app.use("/api", requireAuth);

registerApiRoutes(app);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
