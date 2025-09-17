"use client";
import { useLocalStorage } from "./useLocalStorage";
import { logout } from "@/lib/actions/logout";

export const useSession = (session?: any | null | undefined) => {
    console.log('useSession authSession', session);

    const { getItem, setItem, removeItem } = useLocalStorage('accessToken');

    const retrieveAccessToken = (): string | null => {
        const accessToken = getItem();

        // If local storage has a non-empty token, return it
        if (typeof accessToken === 'string' && accessToken.trim() !== '') {
            return accessToken;
        }

        // If a session was passed in and contains a token, use and persist it
        if (session != null && session.user?.accessToken) {
            const token = session.user.accessToken;
            setItem(token);
            return token;
        }
        // No token available: clear stored token and logout
        removeItem();
        logout();
        return null;
    };

    return {
        retrieveAccessToken
    };
};