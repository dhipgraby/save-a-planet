"use client";

import DashboardHeader from "@/components/layout/header";
import DashboardNavBar from "@/components/layout/navbar";
import Footer from "@/components/footer";
import useMediaQuery from "@/hooks/useMediaQuery";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return (
    <>
      <section className={`grid w-full overflow-hidden lg:grid-cols-[280px_1fr] ${isDesktop ? "min-h-screen" : "min-h-full"}`}>
        <DashboardNavBar />
        <div className="overflow-hidden flex flex-col">
          {isDesktop && <DashboardHeader />}
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}