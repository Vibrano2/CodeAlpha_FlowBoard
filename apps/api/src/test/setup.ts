process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.DATABASE_URL =
  "postgresql://flowboard:flowboard_local_password@localhost:5432/flowboard?schema=public";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
process.env.JWT_SECRET = "test-only-secret-with-at-least-32-characters";
process.env.AUTH_COOKIE_NAME = "flowboard_session";
process.env.AUTH_TOKEN_TTL = "7d";
