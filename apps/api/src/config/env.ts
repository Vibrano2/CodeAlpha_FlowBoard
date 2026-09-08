import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  CLIENT_ORIGIN: z.string().trim().default("http://localhost:5173"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),
  AUTH_COOKIE_NAME: z.string().trim().min(1).default("flowboard_session"),
  AUTH_TOKEN_TTL: z.enum(["1d", "7d", "30d"]).default("7d"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(2).default(0),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

const clientOrigins = result.data.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (clientOrigins.length === 0 || clientOrigins.some((origin) => {
  try {
    const parsed = new URL(origin);
    return !["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin;
  } catch {
    return true;
  }
})) {
  throw new Error("Invalid environment configuration: CLIENT_ORIGIN must contain valid HTTP origins.");
}

export const env = Object.freeze({
  nodeEnv: result.data.NODE_ENV,
  port: result.data.PORT,
  databaseUrl: result.data.DATABASE_URL,
  clientOrigins,
  jwtSecret: result.data.JWT_SECRET,
  authCookieName: result.data.AUTH_COOKIE_NAME,
  authTokenTtl: result.data.AUTH_TOKEN_TTL,
  trustProxyHops: result.data.TRUST_PROXY_HOPS,
});
