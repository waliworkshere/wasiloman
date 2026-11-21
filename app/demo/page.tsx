"use client";
import { useEffect } from "react";
import { enterDemo } from "@/lib/demo";
import { LogoMark } from "@/components/Logo";

/** Visiting /demo opens the sample workspace */
export default function DemoEntry() {
  useEffect(() => {
    enterDemo();
    window.location.replace("/dashboard");
  }, []);
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-3 text-sm text-ink-500">
        <LogoMark size={44} />
        Opening the demo workspace…
      </div>
    </div>
  );
}
