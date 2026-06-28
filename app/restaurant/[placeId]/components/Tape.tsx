export default function Tape({ position }: { position: "left" | "right" }) {
    return (
      <div
        className={`pointer-events-none absolute -top-4 z-30 h-8 w-24 rounded-sm opacity-90 shadow-md ${
          position === "left"
            ? "left-8 rotate-[-10deg] bg-[#ffd84f]"
            : "right-8 rotate-[10deg] bg-[#ffcfa3]"
        }`}
      />
    );
  }