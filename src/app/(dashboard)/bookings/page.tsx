"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function BookingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-center py-10 text-neutral-500">Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">My Bookings</h1>
        <button className="bg-bordeaux-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-bordeaux-600 transition-colors">
          Book a Session
        </button>
      </div>
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
        No bookings yet. Book your first session with Antonio!
      </div>
    </div>
  );
}
