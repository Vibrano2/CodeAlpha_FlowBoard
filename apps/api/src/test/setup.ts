process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.DATABASE_URL =
  "postgresql://flowboard:flowboard_local_password@localhost:5432/flowboard?schema=public";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
