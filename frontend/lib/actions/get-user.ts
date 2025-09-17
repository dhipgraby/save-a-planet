"use server";

import axios from "axios";
import { AUTH_URL } from "@/lib/constants";
import { isRedirectError } from "next/dist/client/components/redirect";
import { logout } from "./logout";
import { SignInSchema } from "@/schemas/zod/auth-zod-schema";

export const getUser = async ({ token }: { token: any }) => {
  const validatedFields = SignInSchema.safeParse({ token });

  if (!validatedFields.success) return null;

  try {
    const response = await axios.get(`${AUTH_URL}auth/user`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.data.status !== 200) {
      logout();
    }

    return {
      name: response.data.user.name,
      email: response.data.user.email,
      accessToken: token,
      status: 200
    };

  } catch (error: any) {
    if (error.message) console.error(error.message);

    if (isRedirectError(error)) {
      console.log("Redirect error: ", error);
    }

    if (axios.isAxiosError(error)) {
      const response = error.response;
      console.log("Axios error response: ", response?.data);

      if (response && response.data.message === "Unauthorized" || response?.data.message === "USER NOT FOUND") {
        return {
          status: 404,
          message: "Session expired. Please log in again."
        };
      }
      if (response && response.data) {
        const { statusCode, message } = response.data;
        if (statusCode === 404 || statusCode === 403) {
          return { message: message, status: 400 };
        }
      }
      if (error.code === "ECONNREFUSED") {
        return { message: "Connection refused. Please try again later or contact support.", status: 400 };
      }
    }
  }
};
