export interface ApiHealth {
  database: "connected" | "unavailable";
  service: "flowboard-api";
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
}

export interface ApiHealthResponse {
  success: boolean;
  data: ApiHealth;
}
