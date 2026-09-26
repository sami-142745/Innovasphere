import axios, { AxiosError, type AxiosInstance } from "axios";
import type { ApiErrorResponse } from "../types";
import { clearAuth } from "../utils/authStorage";

const RAW_API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8080";

const API_URL = RAW_API_URL.replace(/\/$/, "");

export const TOKEN_KEY = "innovasphere.token";

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function getTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem("innovasphere.auth");
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed.token) return parsed.token;
    }
  } catch {
    // Ignore malformed localStorage
  }
  return localStorage.getItem("innovasphere.token");
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (import.meta.env.DEV) {
      console.info("[AUTH] Bearer token attached to", config.method?.toUpperCase(), config.url);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url ?? "unknown";

      if (status === 401) {
        localStorage.removeItem("innovasphere.auth");
        localStorage.removeItem("innovasphere.token");
      }

      const enhancedError = error as AxiosError<ApiErrorResponse> & { status: number };
      enhancedError.status = status;
    } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      const timeoutError = error as AxiosError<ApiErrorResponse> & { isTimeout: boolean; status: number };
      timeoutError.isTimeout = true;
      timeoutError.status = 408;
    } else if (error.message === "Network Error" || !error.response) {
      const networkError = error as AxiosError<ApiErrorResponse> & { isNetworkError: boolean; status: number };
      networkError.isNetworkError = true;
      networkError.status = 0;
    }

    return Promise.reject(error);
  }
);

export function extractApiError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const status = (error as AxiosError<ApiErrorResponse> & { status?: number }).status ?? error.response?.status;

    if (data?.message) return data.message;
    if (data?.error) return data.error;

    if ((error as AxiosError<ApiErrorResponse> & { isTimeout?: boolean }).isTimeout) {
      return "Request timed out. The server may be starting up. Please try again in a moment.";
    }
    if ((error as AxiosError<ApiErrorResponse> & { isNetworkError?: boolean }).isNetworkError) {
      return "Cannot connect to the server. Please check your internet connection or try again later.";
    }

    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 403) return "You don't have permission to access this resource.";
    if (status === 404) return "The requested resource was not found.";
    if (status === 500) return "Server error. Please try again later.";
    if (status === 408) return "Request timed out. Please try again.";

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}