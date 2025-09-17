import NextAuth from "next-auth"
import authConfig from "@/auth.config";
import axios from "axios";
import { AUTH_URL } from "./lib/constants";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }: { user: any, account: any }) {
      if (account?.provider === "credentials") return true;

      if (account?.provider === "google") {
        try {
          const response = await axios.post(
            `${AUTH_URL}auth/google`,
            { googleTokenId: account.id_token },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const data = response.data;

          Object.assign(user, {
            name: data.name,
            email: data.email,
            accessToken: data.token,
          });

          return true;
        } catch (error) {
          console.error("Signing server error", error);
          return false;
        }
      }
      return true;
    },
    async session({ token, session }) {
      if (token.accessToken) {
        session.user.accessToken = token.accessToken;
        session.user.name = token.name;
        session.user.email = token.email || undefined;
      }

      return session;
    },
    async jwt({ token, user }: { token: any, user: any }) {

      if (!token.sub) return token;
      if (user) {
        token = {
          accessToken: user.accessToken,
          name: user.name,
          email: user.email,
        };
      }
      return token;
    }
  },
  session: { strategy: "jwt" },
  ...authConfig,
});
