"use client";

import { useEffect, useState } from "react";

interface Client {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string | null;
  client: { id: string; name: string } | null;
}

export default function SchedulePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({
    clientId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "PERSONAL" as string,
    notes: "",
  });

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
  }, []);

  const getWeekDays = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();

  useEffect(() => {
    const from = weekDays[0].toISOString().split("T")[0];
    const to = weekDays[6].toISOString().split("T")[0];
    fetch(`/api/bookings?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setBookings);
  }, [weekOffset]);

  const createBooking = async () => {
    if (!form.clientId || !form.date) return;
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ clientId: "", date: "", startTime: "09:00", endTime: "10:00", type: "PERSONAL", notes: "" });
    // Reload bookings
    const from = weekDays[0].toISOString().split("T")[0];
    const to = weekDays[6].toISOString().split("T")[0];
    fetch(`/api/bookings?from=${from}&to=${to}`).then((r) => r.json()).then(setBookings);
  };

  const cancelBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setBookings(bookings.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
  };

  const deleteBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setBookings(bookings.filter((b) => b.id !== id));
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getBookingsForDayHour = (day: Date, hour: number) => {
    const dayStr = day.toISOString().split("T")[0];
    return bookings.filter((b) => {
      const bDate = new Date(b.date).toISOString().split("T")[0];
      const bHour = new Date(b.startTime).getHours();
      return bDate === dayStr && bHour === hour;
    });
  };

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-bordeaux-800/40 border-bordeaux-700 text-bordeaux-300",
    PENDING: "bg-yellow-900/30 border-yellow-800 text-yellow-300",
    CANCELLED: "bg-neutral-800/50 border-neutral-700 text-neutral-500 line-through",
    COMPLETED: "bg-green-900/30 border-green-800 text-green-300",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-neutral-500 mt-1">Weekly calendar. Click + New Booking to schedule a session.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-bordeaux-700 hover:bg-bordeaux-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {showAdd ? "Cancel" : "+ New Booking"}
        </button>
      </div>

      {/* New Booking Form */}
      {showAdd && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-neutral-300 mb-3">New Booking</h3>
          <div className="grid grid-cols-5 gap-3 mb-3">
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Client *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Start</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">End</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
              >
                <option value="PERSONAL">Personal</option>
                <option value="GROUP">Group</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-neutral-500 block mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
            />
          </div>
          <button
            onClick={createBooking}
            disabled={!form.clientId || !form.date}
            className="bg-bordeaux-700 hover:bg-bordeaux-600 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg transition-colors"
          >
            Create Booking
          </button>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 transition-colors"
        >
          This Week
        </button>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 transition-colors"
        >
          Next →
        </button>
        <span className="text-xs text-neutral-500">
          {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Week Grid */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
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

        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-neutral-900">
            <div className="p-2 text-xs text-neutral-600 font-mono">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day, di) => {
              const dayBookings = getBookingsForDayHour(day, hour);
              return (
                <div key={di} className="p-1 border-l border-neutral-900 min-h-[48px]">
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`text-[10px] rounded px-1.5 py-1 border mb-0.5 ${statusColor[b.status] || statusColor.CONFIRMED}`}
                    >
                      <div className="font-medium">{b.client?.name || "Unknown"}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="uppercase text-[8px] opacity-70">{b.type}</span>
                        {b.status !== "CANCELLED" && (
                          <button
                            onClick={() => cancelBooking(b.id)}
                            className="text-[8px] opacity-50 hover:opacity-100 underline"
                          >
                            cancel
                          </button>
                        )}
                        <button
                          onClick={() => deleteBooking(b.id)}
                          className="text-[8px] opacity-50 hover:opacity-100 text-red-400 underline"
                        >
                          delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
