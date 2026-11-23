"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { LangToggle } from "./ui";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/"><Logo size={28} /></Link>
        <LangToggle />
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="card p-8 md:p-10">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-700 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink-900 [&_li]:ms-5 [&_li]:list-disc">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
