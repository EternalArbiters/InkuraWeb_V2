"use client";

import * as React from "react";

type Props = {
  label: string;
  children: React.ReactNode;
};

export default function InlineField({ label, children }: Props) {
  return (
    <div className="grid grid-cols-1 gap-1">
      <div className="text-xs text-neutral-500">{label}</div>
      {children}
    </div>
  );
}
