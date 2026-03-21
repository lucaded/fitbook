"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { ConfirmModal } from "@/components/ConfirmModal";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string | null;
}

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

export default function ClientBookingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    notes: string;
  } | null>(null);
  const [creating, setCreating] = useState(false);

  const loadBookings = async () => {
    try {
      const res = await fetch("/api/client/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const upcoming = bookings.filter((b) => {
    const bDate = new Date(b.date).toISOString().split("T")[0];
    return bDate >= todayStr && b.status !== "CANCELLED";
  });

  const past = bookings.filter((b) => {
    const bDate = new Date(b.date).toISOString().split("T")[0];
    return bDate < todayStr || b.status === "CANCELLED";
  }).reverse();

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getUTCDate();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${dayNames[d.getUTCDay()]} ${day}/${month}`;
  };

  const typeLabels: Record<string, string> = {
    PERSONAL: t("personal"),
    GROUP: t("group"),
    ONLINE: t("online"),
  };

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-bordeaux-900/30 border-bordeaux-800/30 text-bordeaux-300",
    PENDING: "bg-amber-900/15 border-amber-800/20 text-amber-400/80",
    CANCELLED: "bg-neutral-800/20 border-neutral-700/30 text-neutral-600",
    COMPLETED: "bg-emerald-900/15 border-emerald-800/20 text-emerald-400/80",
  };

  const cancelBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
    setCancelId(null);
    toast(t("bookingCancelled"), "info");
  };

  // Date options: next 14 days
  const dateOptions = (() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const val = d.toISOString().split("T")[0];
      const dayName = dayNamesFull[d.getDay()];
      const label = `${dayName} ${d.getDate()}/${(d.getMonth() + 1).toString().padStart(2, "0")}${i === 0 ? ` (${t("today")})` : ""}`;
      opts.push({ value: val, label });
    }
    return opts;
  })();

  const openModal = () => {
    setModal({
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      type: "PERSONAL",
      notes: "",
    });
  };

  const setStartTime = (time: string) => {
    if (!modal) return;
    const [h, m] = time.split(":").map(Number);
    const endH = Math.min(h + 1, 20);
    setModal({
      ...modal,
      startTime: time,
      endTime: `${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    });
  };

  const createBooking = async () => {
    if (!modal || !modal.date) return;
    setCreating(true);
    try {
      const res = await fetch("/api/client/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modal),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Error creating booking", "error");
        setCreating(false);
        return;
      }
      setModal(null);
      toast(t("bookingCreated"));
      loadBookings();
    } catch {
      toast("Error creating booking", "error");
    } finally {
      setCreating(false);
    }
  };

  const BookingCard = ({ booking, showCancel }: { booking: Booking; showCancel?: boolean }) => (
    <div
      className={`px-5 py-4 flex items-center justify-between ${
        booking.status === "CANCELLED" ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-neutral-200 tabular-nums">
            {formatDate(booking.date)}
          </span>
          <span className="text-[13px] text-neutral-500 tabular-nums">
            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`pill text-[11px] px-2 py-0.5 rounded-full border ${
              statusColor[booking.status] || statusColor.CONFIRMED
            }`}
          >
            {typeLabels[booking.type] || booking.type}
          </span>
          <span className="text-[11px] text-neutral-600 uppercase">{booking.status}</span>
        </div>
        {booking.notes && (
          <p className="text-[12px] text-neutral-600 mt-1.5 truncate">{booking.notes}</p>
        )}
      </div>
      {showCancel && booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
        <button
          onClick={() => setCancelId(booking.id)}
          className="text-[12px] text-neutral-600 hover:text-red-400 transition-colors shrink-0 ml-4"
        >
          {t("cancel")}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-neutral-800 rounded animate-pulse" />
        <div className="card p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold tracking-tight">{t("myBookings")}</h1>
        <button onClick={openModal} className="btn-primary text-[14px]">
          {t("bookSession")}
        </button>
      </div>
      <p className="text-[14px] text-neutral-500 mb-6">{t("upcomingSessions")}</p>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="section-title mb-3">{t("upcomingBookings")}</h2>
        {upcoming.length === 0 ? (
          <div className="card px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#1e1e1e] flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-neutral-400 text-[14px] mb-1">{t("noBookingsYet")}</p>
            <p className="text-[13px] text-neutral-600 mb-4">{t("bookFirstSession")}</p>
            <button onClick={openModal} className="btn-primary text-[13px] mx-auto">
              {t("bookSession")}
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-[#181818]">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} showCancel />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="section-title mb-3">{t("pastBookings")}</h2>
          <div className="card overflow-hidden divide-y divide-[#181818]">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-[#121212] border border-[#1e1e1e] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md sm:mx-4 p-6 shadow-2xl animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-semibold text-neutral-100 mb-5">
              {t("bookSession")}
            </h3>

            <div className="mb-4">
              <label className="label">{t("date")} *</label>
              <select
                value={modal.date}
                onChange={(e) => setModal({ ...modal, date: e.target.value })}
                className="input-field"
              >
                <option value="">{t("select")}</option>
                {dateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="label">{t("start")}</label>
                <select
                  value={modal.startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("end")}</label>
                <select
                  value={modal.endTime}
                  onChange={(e) => setModal({ ...modal, endTime: e.target.value })}
                  className="input-field"
                >
                  {TIME_SLOTS.filter((slot) => slot > modal.startTime).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("type")}</label>
                <select
                  value={modal.type}
                  onChange={(e) => setModal({ ...modal, type: e.target.value })}
                  className="input-field"
                >
                  <option value="PERSONAL">{t("personal")}</option>
                  <option value="GROUP">{t("group")}</option>
                  <option value="ONLINE">{t("online")}</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="label">{t("notes")}</label>
              <input
                type="text"
                value={modal.notes}
                onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                placeholder={t("optional")}
                className="input-field"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 btn-ghost text-[13px] py-2.5 text-center"
              >
                {t("cancel")}
              </button>
              <button
                onClick={createBooking}
                disabled={!modal.date || creating}
                className="flex-1 btn-primary disabled:opacity-40 text-[13px] py-2.5"
              >
                {creating ? t("saving") : t("bookSession")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {cancelId && (
        <ConfirmModal
          title={t("cancelBooking")}
          message={t("cancelBookingConfirm")}
          confirmLabel={t("cancelBooking")}
          cancelLabel={t("cancel")}
          destructive
          onConfirm={() => cancelBooking(cancelId)}
          onCancel={() => setCancelId(null)}
        />
      )}
    </div>
  );
}
