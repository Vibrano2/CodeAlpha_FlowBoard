import type { ApiHealthResponse } from "../types/health";

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/$/, "");

export const getApiHealth = async (): Promise<ApiHealthResponse> => {
  const response = await fetch(`${apiUrl}/health`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("FlowBoard API is unavailable.");
  }

  return (await response.json()) as ApiHealthResponse;
};
