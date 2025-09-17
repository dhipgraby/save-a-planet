import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { getUser } from "@/lib/actions/get-user";
import { ServerSubmit } from "@/lib/utils";
import { ServerSubmitProps } from "@/types/form-dtos";
import { getSession } from "next-auth/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
//USER LOGIN
export const useLoginMutation = () => {
    const submitLoginMutation = useMutation({
        mutationFn: async (submitProps: ServerSubmitProps) => {
            try {
                const serverResponse = await ServerSubmit(submitProps);
                return { serverResponse }
            } catch (error: any) {
                return { message: error, status: 400 };
            }
        },
        onSuccess: (data) => {
            return data.serverResponse
        }
    });
    return {
        submitLoginMutation
    }
};

//USER SESSION
export const useUserSession = () => {
    return useQuery({
        queryKey: ["user-session"],
        queryFn: async () => {
            const { removeItem } = useLocalStorage('accessToken');
            const session: any = await getSession()
            const { retrieveAccessToken } = useSession(session)
            const token = retrieveAccessToken()
            const user = await getUser({ token })
            if (user?.status !== 200) {
                removeItem()
                return null
            }
            return user
        },
        refetchOnWindowFocus: false
    });
};
