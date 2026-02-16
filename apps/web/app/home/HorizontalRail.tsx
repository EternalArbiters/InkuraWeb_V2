import * as React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function HorizontalRail({ children, className }: Props) {
  return (
    <div
      className={
        "overflow-x-auto overscroll-x-contain no-scrollbar -mx-4 px-4 " +
        (className || "")
      }
    >
      <div className="flex w-max gap-3 md:gap-4 snap-x snap-mandatory">{children}</div>
    </div>
  );
}
