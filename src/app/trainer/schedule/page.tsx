"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { ConfirmModal } from "@/components/ConfirmModal";

interface Client { id: string; name: string; }
interface Booking {
  id: string; clientId: string; date: string; startTime: string; endTime: string;
  type: string; status: string; notes: string | null;
  client: { id: string; name: string } | null;
}

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

export default function SchedulePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Client filter at top — pre-fills modal when set
  const [filterClientId, setFilterClientId] = useState("");

  // Booking modal state
  const [modal, setModal] = useState<{
    clientId: string; date: string; startTime: string; endTime: string;
    type: string; notes: string;
  } | null>(null);

  // Drag state for desktop grid
  const [drag, setDrag] = useState<{ dayIdx: number; startHour: number; endHour: number } | null>(null);
  const dragging = useRef(false);

  useEffect(() => { fetch("/api/clients").then((r) => r.json()).then(setClients); }, []);

  const getWeekDays = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  };
  const weekDays = getWeekDays();

  const loadBookings = () => {
    const from = weekDays[0].toISOString().split("T")[0];
    const to = weekDays[6].toISOString().split("T")[0];
    fetch(`/api/bookings?from=${from}&to=${to}`).then((r) => r.json()).then(setBookings);
  };

  useEffect(() => { loadBookings(); }, [weekOffset]);

  // Open modal with pre-filled slot
  const openModal = (day: Date, startHour: number, endHour: number) => {
    const dateStr = day.toISOString().split("T")[0];
    const startTime = `${startHour.toString().padStart(2, "0")}:00`;
    const endTime = `${Math.min(endHour, 20).toString().padStart(2, "0")}:00`;
    setModal({
      clientId: filterClientId,
      date: dateStr,
      startTime,
      endTime,
      type: "PERSONAL",
      notes: "",
    });
  };

  // Open blank modal (from New Booking button)
  const openBlankModal = () => {
    setModal({
      clientId: filterClientId,
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      type: "PERSONAL",
      notes: "",
    });
  };

  const createBooking = async () => {
    if (!modal || !modal.clientId || !modal.date) return;
    setCreating(true);
    await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal),
    });
    setCreating(false);
    setModal(null);
    toast(t("bookingCreated"));
    loadBookings();
  };

  const cancelBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });
    setBookings(bookings.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
    toast(t("bookingCancelled"), "info");
  };

  const deleteBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setBookings(bookings.filter((b) => b.id !== id));
    setDeleteConfirm(null);
    toast(t("bookingDeleted"), "info");
  };

  // Auto-set end time 1h after start
  const setStartTime = (time: string) => {
    if (!modal) return;
    const [h, m] = time.split(":").map(Number);
    const endH = Math.min(h + 1, 20);
    setModal({ ...modal, startTime: time, endTime: `${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` });
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNamesFull = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Date options: current week + next week (14 days from current week start)
  const dateOptions = (() => {
    const opts: { value: string; label: string }[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    for (let w = 0; w < 2; w++) {
      const days = w === 0 ? weekDays : (() => {
        const start = new Date(weekDays[0]);
        start.setDate(start.getDate() + 7);
        return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
      })();
      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        const val = d.toISOString().split("T")[0];
        const isToday = val === todayStr;
        const dayName = dayNamesFull[d.getDay() === 0 ? 6 : d.getDay() - 1];
        const label = `${dayName} ${d.getDate()}/${(d.getMonth() + 1).toString().padStart(2, "0")}${isToday ? ` (${t("today")})` : ""}`;
        opts.push({ value: val, label });
      }
    }
    return opts;
  })();

  const getBookingsForDayHour = (day: Date, hour: number) => {
    const dayStr = day.toISOString().split("T")[0];
    return bookings.filter((b) => {
      const bDate = new Date(b.date).toISOString().split("T")[0];
      const bHour = new Date(b.startTime).getUTCHours();
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

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  // --- Drag handlers for desktop grid ---
  const handleMouseDown = (dayIdx: number, hour: number) => {
    dragging.current = true;
    setDrag({ dayIdx, startHour: hour, endHour: hour + 1 });
  };

  const handleMouseEnter = (dayIdx: number, hour: number) => {
    if (!dragging.current || !drag || dayIdx !== drag.dayIdx) return;
    const newEnd = Math.max(hour + 1, drag.startHour + 1);
    setDrag({ ...drag, endHour: newEnd });
  };

  const handleMouseUp = useCallback(() => {
    if (!dragging.current || !drag) return;
    dragging.current = false;
    const startH = Math.min(drag.startHour, drag.endHour - 1);
    const endH = Math.max(drag.startHour + 1, drag.endHour);
    openModal(weekDays[drag.dayIdx], startH, endH);
    setDrag(null);
  }, [drag, weekDays, filterClientId]);

  // Global mouseup listener to catch drag end outside grid
  useEffect(() => {
    const onUp = () => {
      if (dragging.current && drag) {
        dragging.current = false;
        const startH = Math.min(drag.startHour, drag.endHour - 1);
        const endH = Math.max(drag.startHour + 1, drag.endHour);
        openModal(weekDays[drag.dayIdx], startH, endH);
        setDrag(null);
      }
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [drag, weekDays, filterClientId]);

  const isCellInDrag = (dayIdx: number, hour: number) => {
    if (!drag || dayIdx !== drag.dayIdx) return false;
    const lo = Math.min(drag.startHour, drag.endHour - 1);
    const hi = Math.max(drag.startHour, drag.endHour - 1);
    return hour >= lo && hour <= hi;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold tracking-tight">{t("schedule")}</h1>
        <button onClick={openBlankModal} className="btn-primary text-[14px]">
          {t("newBooking")}
        </button>
      </div>
      <p className="text-[14px] text-neutral-500 mb-4 sm:mb-6">{t("scheduleSub")}</p>

      {/* Client filter — pre-fills bookings */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-[12px] text-neutral-500 shrink-0">{t("client")}:</label>
        <select
          value={filterClientId}
          onChange={(e) => setFilterClientId(e.target.value)}
          className="input-field max-w-[220px] text-[13px] py-2"
        >
          <option value="">{t("allClients") || "All clients"}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {filterClientId && (
          <button onClick={() => setFilterClientId("")} className="text-[11px] text-neutral-600 hover:text-neutral-300 transition-colors">
            {t("clear") || "Clear"}
          </button>
        )}
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-6 flex-wrap">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-ghost text-[13px]">{t("prev")}</button>
        <button onClick={() => setWeekOffset(0)}
          className={`text-[13px] px-4 py-2 rounded-full transition-all duration-200 ${weekOffset === 0 ? "bg-bordeaux-800/20 text-bordeaux-400" : "btn-ghost"}`}>
          {t("thisWeek")}
        </button>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-ghost text-[13px]">{t("next")}</button>
        <span className="text-[12px] sm:text-[13px] text-neutral-600 ml-1 sm:ml-3">
          {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Mobile: Day list view */}
      <div className="sm:hidden space-y-3">
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const dayStr = day.toISOString().split("T")[0];
          const dayBookings = bookings.filter((b) => {
            const bDate = new Date(b.date).toISOString().split("T")[0];
            return bDate === dayStr;
          }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          return (
            <div key={i} className={`card overflow-hidden ${isToday ? "ring-1 ring-bordeaux-800/30" : ""}`}>
              <div className={`px-4 py-3 border-b border-[#181818] flex items-center justify-between ${isToday ? "bg-bordeaux-950/15" : "bg-[#0e0e0e]"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-medium ${isToday ? "text-bordeaux-400" : "text-neutral-400"}`}>{dayNames[i]}</span>
                  <span className={`text-[14px] tabular-nums ${isToday ? "text-bordeaux-400 font-bold" : "text-neutral-300"}`}>{day.getDate()}</span>
                </div>
                <button
                  onClick={() => openModal(day, 9, 10)}
                  className="text-[11px] text-neutral-600 hover:text-bordeaux-400 transition-colors px-2 py-1"
                >+ {t("newBooking").toLowerCase()}</button>
              </div>
              {dayBookings.length > 0 ? (
                <div className="divide-y divide-[#111]">
                  {dayBookings.map((b) => (
                    <div key={b.id} className={`px-4 py-3 ${b.status === "CANCELLED" ? "opacity-50" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[13px] font-medium text-neutral-200">{b.client?.name || "Unknown"}</span>
                          <span className="text-[12px] text-neutral-600 ml-2 tabular-nums">
                            {formatTime(b.startTime)} – {formatTime(b.endTime)}
                          </span>
                        </div>
                        <span className={`pill ${statusColor[b.status] || statusColor.CONFIRMED}`}>
                          {typeLabels[b.type] || b.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {b.status !== "CANCELLED" && (
                          <button onClick={() => cancelBooking(b.id)} className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors">{t("cancel").toLowerCase()}</button>
                        )}
                        <button onClick={() => setDeleteConfirm(b.id)} className="text-[11px] text-neutral-600 hover:text-red-400 transition-colors">{t("delete").toLowerCase()}</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-[12px] text-neutral-700 text-center">—</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Grid view with drag-to-book */}
      <div className="card overflow-hidden hidden sm:block select-none">
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
              const inDrag = isCellInDrag(di, hour);
              return (
                <div key={di}
                  className={`px-1.5 py-1 border-l border-[#111] min-h-[48px] cursor-pointer transition-colors group/cell ${
                    inDrag ? "bg-bordeaux-900/20" : "hover:bg-[#0d0d0d]"
                  }`}
                  onMouseDown={(e) => {
                    if (dayBookings.length === 0) { e.preventDefault(); handleMouseDown(di, hour); }
                  }}
                  onMouseEnter={() => handleMouseEnter(di, hour)}
                >
                  {dayBookings.length > 0 ? dayBookings.map((b) => (
                    <div key={b.id} className={`text-[11px] rounded-xl px-2 py-1.5 border mb-1 ${statusColor[b.status] || statusColor.CONFIRMED}`}>
                      <div className="font-medium">{b.client?.name || "Unknown"}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="uppercase text-[9px] opacity-60">{typeLabels[b.type] || b.type}</span>
                        {b.status !== "CANCELLED" && (
                          <button onClick={(e) => { e.stopPropagation(); cancelBooking(b.id); }} className="text-[9px] opacity-30 hover:opacity-80 underline transition-opacity">{t("cancel").toLowerCase()}</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(b.id); }} className="text-[9px] opacity-30 hover:opacity-80 text-red-400 underline transition-opacity">{t("delete").toLowerCase()}</button>
                      </div>
                    </div>
                  )) : inDrag ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-full h-full rounded-lg border border-dashed border-bordeaux-700/40 bg-bordeaux-900/10" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                      <span className="text-[10px] text-neutral-700">+</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {modal && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-[#121212] border border-[#1e1e1e] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md sm:mx-4 p-6 shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-neutral-100 mb-5">{t("newBooking")}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="label">{t("client")} *</label>
                <select value={modal.clientId} onChange={(e) => setModal({ ...modal, clientId: e.target.value })} className="input-field">
                  <option value="">{t("select")}</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t("date")} *</label>
                <select value={modal.date} onChange={(e) => setModal({ ...modal, date: e.target.value })} className="input-field">
                  <option value="">{t("select")}</option>
                  {dateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="label">{t("start")}</label>
                <select value={modal.startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field">
                  {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t("end")}</label>
                <select value={modal.endTime} onChange={(e) => setModal({ ...modal, endTime: e.target.value })} className="input-field">
                  {TIME_SLOTS.filter((slot) => slot > modal.startTime).map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t("type")}</label>
                <select value={modal.type} onChange={(e) => setModal({ ...modal, type: e.target.value })} className="input-field">
                  <option value="PERSONAL">{t("personal")}</option>
                  <option value="GROUP">{t("group")}</option>
                  <option value="ONLINE">{t("online")}</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="label">{t("notes")}</label>
              <input type="text" value={modal.notes} onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                placeholder={t("optional")} className="input-field" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 btn-ghost text-[13px] py-2.5 text-center">
                {t("cancel")}
              </button>
              <button onClick={createBooking} disabled={!modal.clientId || !modal.date || creating}
                className="flex-1 btn-primary disabled:opacity-40 text-[13px] py-2.5">
                {creating ? t("saving") : t("createBooking")}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title={t("deleteBooking")}
          message={t("deleteBookingMsg")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          destructive
          onConfirm={() => deleteBooking(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
