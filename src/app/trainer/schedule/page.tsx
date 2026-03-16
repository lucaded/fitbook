"use client";

import { useState } from "react";

export default function SchedulePage() {
  const [selectedDate] = useState(new Date());

  // Generate week days
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-neutral-500 mt-1">Weekly calendar view. Plan and manage session bookings.</p>
        </div>
        <button className="bg-bordeaux-700 hover:bg-bordeaux-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + New Booking
        </button>
      </div>

      {/* Week Grid */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b border-neutral-800">
          <div className="p-3 text-xs text-neutral-600">Time</div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-3 text-center border-l border-neutral-800 ${isToday ? "bg-bordeaux-950/30" : ""}`}>
                <p className="text-xs text-neutral-500">{dayNames[i]}</p>
                <p className={`text-sm font-mono ${isToday ? "text-bordeaux-400 font-bold" : "text-neutral-300"}`}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time Slots */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-neutral-900 hover:bg-neutral-900/30">
            <div className="p-2 text-xs text-neutral-600 font-mono">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((_, di) => (
              <div
                key={di}
                className="p-2 border-l border-neutral-900 min-h-[48px] cursor-pointer hover:bg-neutral-800/30 transition-colors"
              />
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-600 mt-3">
        Booking functionality coming soon. For now, use this view to plan your week.
      </p>
    </div>
  );
}
