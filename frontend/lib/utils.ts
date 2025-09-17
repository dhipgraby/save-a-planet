import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { ServerSubmitProps } from "@/types/form-dtos";
import { twMerge } from "tailwind-merge";

export const ServerSubmit = async ({
  serverAction,
  setIsLoading,
  setErrorMsg,
  nextStep
}: ServerSubmitProps) => {
  try {
    setErrorMsg(null);
    setIsLoading(true);

    const response = await serverAction();
    // Check if the response is defined
    if (!response) {
      setIsLoading(false);
      setErrorMsg("Empty response from the server. Please try again or contact support.");
      return;
    }
    // Check if the response indicates an error
    if ((response.status && response.status !== 200) || (response.statusCode && response.statusCode !== 200)) {
      // Check if there are specific error messages in the response
      const errorMessage = formatError(response);
      if (response.status !== 202) {
        toast.error(errorMessage);
        setErrorMsg(errorMessage);
      }

      setIsLoading(false);
      return response;
    } else {
      if (nextStep) nextStep();
      toast.success(response.message || "Success");
      setIsLoading(false);
      return response;
    }
  } catch (error: any) {
    setIsLoading(false);
    const errorMessage = formatError(error);
    setErrorMsg(errorMessage);
    toast.error(errorMessage);
    throw error; // Ensure the error is thrown to propagate to frontend
  }
};

export const validateFields = (fields: any, Schema: any): boolean => {
  const validatedFields = Schema.safeParse(fields);
  return validatedFields.success;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatError(response: any) {
  const errorMessage = "Something went wrong, try again or contact support";
  if (response.message) {
    if (Array.isArray(response.message)) {
      return response.message.join(", ");
    } else {
      return response.message;
    }
  } else if (response.error) {
    if (Array.isArray(response.error)) {
      return response.error.join(", ");
    } else {
      return response.error;
    }
  }
  return errorMessage;
}
