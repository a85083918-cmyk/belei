import type { ReactNode } from "react";
import Tape from "./Tape";

export default function PaperCard({
  children,
  small = false,
  color = "white",
  medal = false,
  className = "",
}: {
  children: ReactNode;
  small?: boolean;
  color?: "white" | "red" | "green" | "yellow" | "orange";
  medal?: boolean;
  className?: string;
}) {
  const bg =
    color === "red"
      ? "bg-red-50"
      : color === "green"
      ? "bg-green-50"
      : color === "yellow"
      ? "bg-yellow-50"
      : color === "orange"
      ? "bg-orange-50"
      : "bg-[#fffdf5]";

  return (
    <div
      className={`relative h-fit overflow-hidden rounded-[30px] border-2 border-stone-800 ${bg} ${
        small ? "p-5" : "p-6 md:p-8"
      } shadow-[8px_8px_0_#ead8b5] ${className}`}
    >
      <Tape position="left" />
      <Tape position="right" />

      {medal && (
        <div className="absolute right-3 top-3 z-40 text-5xl drop-shadow-md">
          ⭐
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(#eadfca_0.9px,transparent_0.9px)] bg-[length:18px_18px] opacity-35" />

      <div className="relative z-20">{children}</div>
    </div>
  );
}