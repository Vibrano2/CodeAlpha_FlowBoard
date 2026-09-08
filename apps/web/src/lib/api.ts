import type { ApiHealthResponse } from "../types/health";

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/$/, "");

interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Array<{ field: string; message: string }>;

  public constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}

const isApiErrorBody = (body: unknown): body is ApiErrorBody => {
  if (typeof body !== "object" || body === null || !("error" in body)) return false;
  const error = body.error;
  return typeof error === "object"
    && error !== null
    && "code" in error
    && typeof error.code === "string"
    && "message" in error
    && typeof error.message === "string";
};

export const apiRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });

  const responseText = await response.text();
  let body: unknown;

  try {
    body = responseText ? JSON.parse(responseText) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      isApiErrorBody(body)
        ? body
        : {
            success: false,
            error: {
              code: "INVALID_API_RESPONSE",
              message: "FlowBoard could not complete this request.",
            },
          },
    );
  }

  if (body === null) {
    throw new Error("FlowBoard received an invalid API response.");
  }

  return body as T;
};

export const getApiHealth = () => apiRequest<ApiHealthResponse>("/health");
