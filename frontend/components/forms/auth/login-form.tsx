"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginSchema, LoginInputs } from "@/schemas/zod/auth-zod-schema";
import { CardWrapper } from "./card-wrapper";
import { login, googleLogin } from "@/lib/actions/login";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLoginMutation } from "@/queries/user/profile-query";
import Logo from "@/components/logo";
import LoginFormulary from "./loging-formulary";
import Image from "next/image";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { setItem } = useLocalStorage("accessToken");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"error" | "info" | "warning">("error");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const form = useForm<LoginInputs>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: "",
      password: ""
    }
  });

  const { submitLoginMutation } = useLoginMutation();

  const onGoogleLogin = async () => {
    try {
      const googleUrl = await submitLoginMutation.mutateAsync({
        setIsLoading,
        setErrorMsg,
        serverAction: async () => await googleLogin(callbackUrl)
      });
      console.log("Google login successful:", googleUrl);
      router.push(googleUrl.serverResponse);
    } catch (error) {
      handleError(error);
    }
  };

  const onSubmit = async (values: LoginInputs) => {
    try {
      // Clear previous error message and set loading state
      setErrorMsg(null);
      setIsLoading(true);

      const payload = {
        identifier: values.identifier,
        password: values.password,
        code: values.code || undefined,
        smsCode: values.smsCode || undefined
      };

      const loging = await submitLoginMutation.mutateAsync({
        setIsLoading,
        setErrorMsg,
        serverAction: async () => await login(payload, callbackUrl || undefined)
      });

      const response = loging.serverResponse;

      if (response.status) {

        if (response.status !== 200) {

          const errorMessage = response.message || response.error || "Something went wrong, try again or contact support.";
          if (response.status === 202) {
            toast.info(response.message);
          } else {
            setErrorMsg(errorMessage);
          }

          setErrorType("warning");
          setIsLoading(false);
          return;
        }

        const accessToken = response.token;
        setItem(accessToken);
        toast.success("Successfully logged in! Redirecting...");
        setSuccessMsg("Successfully logged in!");
        setTimeout(() => {
          router.push(callbackUrl || DEFAULT_LOGIN_REDIRECT);
        }, 2000);
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    console.log("error:", error);

    if (error.response && error.response.data && error.response.data.message) {
      const errorMessage = error.response.data.message;
      if (error.response.status === 202) {
        toast.info("A new confirmation email has been sent. Please check your inbox and click the verification link.");
        setErrorType("info");
      } else {
        toast.error(errorMessage);
      }
      setErrorMsg(errorMessage);
    } else {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again or contact support.";
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Logo />
      <div className="m-auto w-full mt-5">
        <CardWrapper
          headerLabel="Welcome back"
          backButtonLabel="Don't have an account?"
          backButtonHref="/auth/signup"
        >
          <LoginFormulary
            form={form}
            onSubmit={onSubmit}
            errorMsg={errorMsg}
            errorType={errorType}
            successMsg={successMsg}
            isLoading={isLoading}
          />
          <hr className="my-4 bg-gray-200 " />
          <form action={onGoogleLogin}>
            <button
              type="submit"
              className="w-full mt-3 inline-flex justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
              disabled={isLoading}
            >
              Sign in with Google <Image src="/google-logo.png" alt="Google Logo" width={20} height={20} />
            </button>
          </form>

        </CardWrapper>
      </div>
    </>
  );
};

export default LoginForm;