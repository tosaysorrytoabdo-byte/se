import { config } from "../config";
// Helper to call our backend API
export async function apiCall(endpoint, method = "GET", body) {
    const url = `${config.apiUrl}/api/trpc${endpoint}`;
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    return res.json();
}
