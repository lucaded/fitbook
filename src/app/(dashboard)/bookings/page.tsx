"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function BookingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
          Book a Session
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No bookings yet. Book your first session with Antonio!
      </div>
    </div>
  );
}
