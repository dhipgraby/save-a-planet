import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { getBalance } from "@/lib/actions/transactions/get-balance";

export const useGetBalanceQuery = () => {
    return useQuery({
        queryKey: ['user-balance'],
        queryFn: async () => {
            const { retrieveAccessToken } = useSession();
            const accessToken = retrieveAccessToken();
            if (!accessToken) throw new Error("No access token found");
            const balance = await getBalance(accessToken);
            return balance || { coins: 0 };
        },
        refetchOnWindowFocus: false
    });
};