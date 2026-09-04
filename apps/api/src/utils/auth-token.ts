import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";

const tokenPayloadSchema = z.object({
  sub: z.uuid(),
});

export const createAuthToken = (userId: string) =>
  jwt.sign({}, env.jwtSecret, {
    algorithm: "HS256",
    audience: "flowboard-web",
    expiresIn: env.authTokenTtl as SignOptions["expiresIn"],
    issuer: "flowboard-api",
    subject: userId,
  });

export const verifyAuthToken = (token: string) => {
  const payload = jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
    audience: "flowboard-web",
    issuer: "flowboard-api",
  });

  return tokenPayloadSchema.parse(payload);
};
