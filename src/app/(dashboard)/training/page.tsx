"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function TrainingPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-center py-10 text-neutral-500">Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Training History</h1>
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
        No training sessions recorded yet. Complete a booking to see your training history.
      </div>
    </div>
  );
}
