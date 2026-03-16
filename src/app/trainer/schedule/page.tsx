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
    CONFIRMED: "bg-bordeaux-900/30 border-bordeaux-700/40 text-bordeaux-300",
    PENDING: "bg-amber-900/20 border-amber-700/30 text-amber-300",
    CANCELLED: "bg-neutral-800/30 border-neutral-700/40 text-neutral-500 line-through",
    COMPLETED: "bg-emerald-900/20 border-emerald-700/30 text-emerald-300",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm">
          {showAdd ? "Cancel" : "+ New Booking"}
        </button>
      </div>
      <p className="text-sm text-neutral-500 mb-6">Weekly calendar. Book and manage training sessions.</p>

      {/* New Booking Form */}
      {showAdd && (
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">New Booking</h3>
          <div className="grid grid-cols-5 gap-3 mb-3">
            <div>
              <label className="label">Client *</label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input-field">
                <option value="">Select client...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Start</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">End</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="PERSONAL">Personal</option>
                <option value="GROUP">Group</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..." className="input-field" />
          </div>
          <button onClick={createBooking} disabled={!form.clientId || !form.date} className="btn-primary disabled:opacity-40">
            Create Booking
          </button>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-ghost text-xs">
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Prev
        </button>
        <button onClick={() => setWeekOffset(0)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 ${weekOffset === 0 ? "bg-bordeaux-700/20 text-bordeaux-400 border border-bordeaux-700/30" : "btn-ghost"}`}>
          This Week
        </button>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-ghost text-xs">
          Next
          <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <span className="text-xs text-neutral-600 ml-2">
          {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Week Grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-8 border-b border-neutral-800/60">
          <div className="p-3 text-xs text-neutral-600 font-medium">Time</div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-3 text-center border-l border-neutral-800/40 ${isToday ? "bg-bordeaux-950/20" : ""}`}>
                <p className={`text-[10px] font-medium uppercase tracking-wider ${isToday ? "text-bordeaux-400" : "text-neutral-600"}`}>{dayNames[i]}</p>
                <p className={`text-sm font-mono mt-0.5 ${isToday ? "text-bordeaux-400 font-bold" : "text-neutral-400"}`}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-neutral-800/30 last:border-b-0">
            <div className="px-3 py-2 text-[11px] text-neutral-600 font-mono">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day, di) => {
              const dayBookings = getBookingsForDayHour(day, hour);
              return (
                <div key={di} className="px-1 py-1 border-l border-neutral-800/30 min-h-[48px]">
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`text-[10px] rounded-lg px-2 py-1.5 border mb-0.5 ${statusColor[b.status] || statusColor.CONFIRMED}`}
                    >
                      <div className="font-medium">{b.client?.name || "Unknown"}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="uppercase text-[8px] opacity-70">{b.type}</span>
                        {b.status !== "CANCELLED" && (
                          <button onClick={() => cancelBooking(b.id)}
                            className="text-[8px] opacity-40 hover:opacity-100 underline transition-opacity">cancel</button>
                        )}
                        <button onClick={() => deleteBooking(b.id)}
                          className="text-[8px] opacity-40 hover:opacity-100 text-red-400 underline transition-opacity">delete</button>
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
