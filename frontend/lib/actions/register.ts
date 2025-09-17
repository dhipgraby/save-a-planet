"use server";

import * as z from "zod";
import { SignUpSchema } from "@/schemas/zod/auth-zod-schema";
import { AUTH_URL } from "../constants";
import axios from "axios";
import { handleServerError } from "../server-handler";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { signIn } from "@/auth";

export const register = async (values: z.infer<typeof SignUpSchema>, callbackUrl?: string | null) => {
  const validatedFields = SignUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { username, email, password } = validatedFields.data;

  try {
    const response = await axios.post(`${AUTH_URL}auth/signup`, { username, email, password }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const token = response.data.token;
    await signIn("credentials", { token, redirect: false, redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT });
    return response.data;
  } catch (error: any) {
    return await handleServerError(error);
  }
};
