"use server";

import * as z from "zod";
import axios from "axios";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas/zod/auth-zod-schema";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AUTH_URL } from "@/lib/constants";
import { handleServerError } from "../server-handler";

export const login = async (values: z.infer<typeof LoginSchema>, callbackUrl?: string | null) => {
  try {
    const validatedFields = LoginSchema.safeParse(values);
    if (!validatedFields.success) {
      return { message: "Invalid fields!", status: 400 };
    }

    const { identifier, password, code, smsCode } = validatedFields.data;
    const response = await axios.post(`${AUTH_URL}auth/login`, { identifier, password, code: Number(code), smsCode }, { headers: { "Content-Type": "application/json" } });

    if (response.data.status !== 200) return response.data;

    if (response.data.message === "Confirmation email sent") return response.data;
    if (response.data.message === "Verification sms sent to your phone.") return response.data;

    const token = response.data.token;

    await signIn("credentials", { token, redirect: false, redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT });
    return response.data;

  } catch (error: any) {
    return await handleServerError(error);
  }

};

export const googleLogin = async (callbackUrl?: string | null) => {
  try {
    const googleSignIn = await signIn("google", { redirect: false, redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT });
    return googleSignIn;

  } catch (error: any) {
    return await handleServerError(error);
  }

};