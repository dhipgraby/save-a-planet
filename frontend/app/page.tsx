
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Logo from "@/components/logo";

function MainHeader() {
  return (
    <div className="h-screen relative w-full overflow-hidden main-gradient flex flex-col items-center justify-center ta-c">
      <div className="absolute inset-0 w-full h-full" />

      <h1 className={cn("text-2xl text-white relative z-20")}>
        <Logo />
        Welcome
      </h1>
      <div className="flex gap-4 mt-10">
        <Link href="/auth/login">
          <Button className="text-xl px-5 relative z-20">
            Login
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button variant={"ghost"} className="text-xl text-black hover:text-black px-5 relative z-20 bg-yellow-300">
            Signup
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default async function Home() {
  const queryClient = new QueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)} >
      <main className="flex h-screen flex-col items-center justify-between">
        <MainHeader />
      </main>
    </HydrationBoundary>
  );
}
