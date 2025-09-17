"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";

interface Props {
  title: string;
  description?: string;
}

export const FieldTitle: React.FC<Props> = ({ title, description }) => {
  return (
    <>
      <Separator className="my-5" />
      <h1 className="text-sm font-semibold">{title}</h1>
      <Separator className="my-5" />
      {description && (
        <p className="mb-5 text-xs">
          {description}
        </p>
      )}
    </>
  );
};
