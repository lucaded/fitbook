"use client";

import { useEffect, useState } from "react";

interface Client { id: string; name: string; }
interface Booking {
  id: string; clientId: string; date: string; startTime: string; endTime: string;
  type: string; status: string; notes: string | null;
  client: { id: string; name: string } | null;
}

export default function SchedulePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({
    clientId: "", date: "", startTime: "09:00", endTime: "10:00", type: "PERSONAL" as string, notes: "",
  });

  useEffect(() => { fetch("/api/clients").then((r) => r.json()).then(setClients); }, []);

  const getWeekDays = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  };
  const weekDays = getWeekDays();

  useEffect(() => {
    const from = weekDays[0].toISOString().split("T")[0];
    const to = weekDays[6].toISOString().split("T")[0];
    fetch(`/api/bookings?from=${from}&to=${to}`).then((r) => r.json()).then(setBookings);
  }, [weekOffset]);

  const createBooking = async () => {
    if (!form.clientId || !form.date) return;
    await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowAdd(false);
    setForm({ clientId: "", date: "", startTime: "09:00", endTime: "10:00", type: "PERSONAL", notes: "" });
    const from = weekDays[0].toISOString().split("T")[0];
    const to = weekDays[6].toISOString().split("T")[0];
    fetch(`/api/bookings?from=${from}&to=${to}`).then((r) => r.json()).then(setBookings);
  };

  const cancelBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });
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
    CONFIRMED: "bg-bordeaux-900/30 border-bordeaux-800/30 text-bordeaux-300",
    PENDING: "bg-amber-900/15 border-amber-800/20 text-amber-400/80",
    CANCELLED: "bg-neutral-800/20 border-neutral-700/30 text-neutral-600 line-through",
    COMPLETED: "bg-emerald-900/15 border-emerald-800/20 text-emerald-400/80",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold tracking-tight">Schedule</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-[13px]">
          {showAdd ? "Cancel" : "New Booking"}
        </button>
      </div>
      <p className="text-[13px] text-neutral-500 mb-6">Weekly calendar for training sessions.</p>

      {showAdd && (
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-medium text-neutral-200 mb-4">New Booking</h3>
          <div className="grid grid-cols-5 gap-3 mb-3">
            <div>
              <label className="label">Client *</label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input-field">
                <option value="">Select...</option>
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
              placeholder="Optional..." className="input-field" />
          </div>
          <button onClick={createBooking} disabled={!form.clientId || !form.date} className="btn-primary disabled:opacity-40 text-[13px]">
            Create Booking
          </button>
        </div>
      )}

      {/* Week nav */}
      <div className="flex items-center gap-1.5 mb-5">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-ghost text-[12px]">Prev</button>
        <button onClick={() => setWeekOffset(0)}
          className={`text-[12px] px-3 py-1.5 rounded-md transition-colors ${weekOffset === 0 ? "bg-bordeaux-800/20 text-bordeaux-400" : "btn-ghost"}`}>
          This Week
        </button>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-ghost text-[12px]">Next</button>
        <span className="text-[12px] text-neutral-600 ml-2">
          {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-8 border-b border-[#1e1e1e]">
          <div className="p-2.5 text-[11px] text-neutral-600"></div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-2.5 text-center border-l border-[#1e1e1e] ${isToday ? "bg-bordeaux-950/15" : ""}`}>
                <p className={`text-[10px] uppercase tracking-wider ${isToday ? "text-bordeaux-400" : "text-neutral-600"}`}>{dayNames[i]}</p>
                <p className={`text-sm tabular-nums mt-0.5 ${isToday ? "text-bordeaux-400 font-semibold" : "text-neutral-400"}`}>{day.getDate()}</p>
              </div>
            );
          })}
        </div>

        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-[#151515] last:border-b-0">
            <div className="px-2.5 py-1.5 text-[11px] text-neutral-700 tabular-nums">{hour.toString().padStart(2, "0")}:00</div>
            {weekDays.map((day, di) => {
              const dayBookings = getBookingsForDayHour(day, hour);
              return (
                <div key={di} className="px-1 py-0.5 border-l border-[#151515] min-h-[44px]">
                  {dayBookings.map((b) => (
                    <div key={b.id} className={`text-[10px] rounded-md px-1.5 py-1 border mb-0.5 ${statusColor[b.status] || statusColor.CONFIRMED}`}>
                      <div className="font-medium">{b.client?.name || "Unknown"}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="uppercase text-[8px] opacity-60">{b.type}</span>
                        {b.status !== "CANCELLED" && (
                          <button onClick={() => cancelBooking(b.id)} className="text-[8px] opacity-30 hover:opacity-80 underline transition-opacity">cancel</button>
                        )}
                        <button onClick={() => deleteBooking(b.id)} className="text-[8px] opacity-30 hover:opacity-80 text-red-400 underline transition-opacity">del</button>
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
