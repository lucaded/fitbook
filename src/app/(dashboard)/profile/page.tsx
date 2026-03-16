"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-center py-10 text-neutral-500">Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">My Profile</h1>
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img src={session.user.image} alt="" className="w-14 h-14 rounded-full" />
          )}
          <div>
            <p className="text-base font-semibold text-white">{session.user.name}</p>
            <p className="text-sm text-neutral-500">{session.user.email}</p>
          </div>
        </div>

        <hr className="border-neutral-800" />

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Height (cm)</label>
            <input
              type="number"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              placeholder="175"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Weight (kg)</label>
            <input
              type="number"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              placeholder="75"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Fitness Goals</label>
            <textarea
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              rows={3}
              placeholder="What are you working towards?"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Injuries / Notes</label>
            <textarea
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              rows={3}
              placeholder="Anything Antonio should know about?"
            />
          </div>
          <button
            type="submit"
            className="bg-bordeaux-700 text-white px-6 py-2 rounded-lg text-sm hover:bg-bordeaux-600 transition-colors"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
