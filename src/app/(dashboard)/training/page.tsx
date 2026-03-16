"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function TrainingPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Training History
      </h1>
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No training sessions recorded yet. Complete a booking to see your
        training history.
      </div>
    </div>
  );
}
