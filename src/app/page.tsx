import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Train with{" "}
            <span className="text-primary-600">Antonio De Donno</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Book your personal training sessions, track your progress, and reach
            your fitness goals.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/bookings"
              className="border border-primary-600 text-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-50 transition"
            >
              Book a Session
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
