import { config } from "../config";

// Helper to call our backend API
export async function apiCall(endpoint: string, method: "GET" | "POST" = "GET", body?: Record<string, unknown>) {
  const url = `${config.apiUrl}/api/trpc${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  return res.json();
}
