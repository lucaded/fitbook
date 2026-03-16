import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="text-bordeaux-500">FitBook</span>
          </h1>
          <p className="text-lg text-neutral-400 mb-12 max-w-xl mx-auto">
            Training management for Antonio De Donno. Manage clients, build programs, track progress.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/trainer"
              className="bg-bordeaux-700 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-bordeaux-600 transition-colors"
            >
              Trainer Dashboard
            </Link>
            <Link
              href="/program"
              className="border border-neutral-700 text-neutral-300 px-8 py-3 rounded-lg text-base font-medium hover:bg-neutral-900 transition-colors"
            >
              Program Builder
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
