import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const callbacks: any = {};
const providers = [
  Credentials
];

callbacks.signIn = async function signIn(user: any, account: any) {

  if (account.provider === "credentials") return true;
  if (account.provider === "google") return true;
  return false;
};

callbacks.jwt = async function jwt(token: any, user: any) {
  if (user) {
    token = {
      accessToken: user.accessToken,
      name: user.name,
      email: user.email
    };
  }
  return token;
};

callbacks.session = async function session(session: any, token: any) {
  session.accessToken = token.accessToken;
  session.name = token.name;
  session.email = token.email;
  return session;
};

const options: NextAuthConfig = {
  callbacks,
  providers
};

export default NextAuth(options);