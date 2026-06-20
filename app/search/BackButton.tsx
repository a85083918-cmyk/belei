"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600"
    >
      ← 返回上一頁
    </button>
  );
}