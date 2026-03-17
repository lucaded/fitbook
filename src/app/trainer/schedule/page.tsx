"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface Client { id: string; name: string; }
interface Booking {
  id: string; clientId: string; date: string; startTime: string; endTime: string;
  type: string; status: string; notes: string | null;
  client: { id: string; name: string } | null;
}

export default function SchedulePage() {
  const { t } = useI18n();
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

  const typeLabels: Record<string, string> = {
    PERSONAL: t("personal"),
    GROUP: t("group"),
    ONLINE: t("online"),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold tracking-tight">{t("schedule")}</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-[14px]">
          {showAdd ? t("cancel") : t("newBooking")}
        </button>
      </div>
      <p className="text-[14px] text-neutral-500 mb-8">{t("scheduleSub")}</p>

      {showAdd && (
        <div className="card p-6 mb-6">
          <h3 className="text-[15px] font-semibold text-neutral-200 mb-5">{t("newBooking")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="label">{t("client")} *</label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input-field">
                <option value="">{t("select")}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t("date")} *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">{t("start")}</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">{t("end")}</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">{t("type")}</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="PERSONAL">{t("personal")}</option>
                <option value="GROUP">{t("group")}</option>
                <option value="ONLINE">{t("online")}</option>
              </select>
            </div>
          </div>
          <div className="mb-5">
            <label className="label">{t("notes")}</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t("optional")} className="input-field" />
          </div>
          <button onClick={createBooking} disabled={!form.clientId || !form.date} className="btn-primary disabled:opacity-40 text-[14px]">
            {t("createBooking")}
          </button>
        </div>
      )}

      {/* Week nav */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-ghost text-[13px]">{t("prev")}</button>
        <button onClick={() => setWeekOffset(0)}
          className={`text-[13px] px-4 py-2 rounded-full transition-all duration-200 ${weekOffset === 0 ? "bg-bordeaux-800/20 text-bordeaux-400" : "btn-ghost"}`}>
          {t("thisWeek")}
        </button>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-ghost text-[13px]">{t("next")}</button>
        <span className="text-[13px] text-neutral-600 ml-3">
          {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Grid */}
      <div className="card overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-x-0 sm:border-x">
        <div className="grid grid-cols-8 border-b border-[#181818]">
          <div className="p-3 text-[12px] text-neutral-600"></div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-3 text-center border-l border-[#181818] ${isToday ? "bg-bordeaux-950/15" : ""}`}>
                <p className={`text-[11px] uppercase tracking-wider ${isToday ? "text-bordeaux-400" : "text-neutral-600"}`}>{dayNames[i]}</p>
                <p className={`text-[14px] tabular-nums mt-0.5 ${isToday ? "text-bordeaux-400 font-bold" : "text-neutral-400"}`}>{day.getDate()}</p>
              </div>
            );
          })}
        </div>

        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-[#111] last:border-b-0">
            <div className="px-3 py-2 text-[12px] text-neutral-700 tabular-nums">{hour.toString().padStart(2, "0")}:00</div>
            {weekDays.map((day, di) => {
              const dayBookings = getBookingsForDayHour(day, hour);
              return (
                <div key={di} className="px-1.5 py-1 border-l border-[#111] min-h-[48px]">
                  {dayBookings.map((b) => (
                    <div key={b.id} className={`text-[11px] rounded-xl px-2 py-1.5 border mb-1 ${statusColor[b.status] || statusColor.CONFIRMED}`}>
                      <div className="font-medium">{b.client?.name || "Unknown"}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="uppercase text-[9px] opacity-60">{typeLabels[b.type] || b.type}</span>
                        {b.status !== "CANCELLED" && (
                          <button onClick={() => cancelBooking(b.id)} className="text-[9px] opacity-30 hover:opacity-80 underline transition-opacity">{t("cancel").toLowerCase()}</button>
                        )}
                        <button onClick={() => deleteBooking(b.id)} className="text-[9px] opacity-30 hover:opacity-80 text-red-400 underline transition-opacity">{t("delete").toLowerCase()}</button>
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
