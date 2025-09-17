export const AUTH_SECRET = process.env.AUTH_SECRET || "default_secret";
export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API || "http://localhost:3001/";

export const USERS_LOCAL_API = "http://localhost:3002/";
export const USERS_API = process.env.NEXT_PUBLIC_USERS_API || USERS_LOCAL_API;