"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { useUserSession } from "@/queries/user/profile-query";

const DashboardPage = () => {

  const { data: user, isLoading } = useUserSession();

  if (isLoading) return <h1>Loading user data...</h1>;

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <Separator className="mt-6" />
      {user && (
        <div className="mt-5">
          <h2 className="font-semibold">Welcome back, {user.name}</h2>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;