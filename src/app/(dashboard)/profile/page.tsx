"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <p className="text-lg font-semibold">{session.user.name}</p>
            <p className="text-gray-500">{session.user.email}</p>
          </div>
        </div>

        <hr />

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="175"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="75"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fitness Goals
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              placeholder="What are you working towards?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Injuries / Notes
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              placeholder="Anything Antonio should know about?"
            />
          </div>
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
