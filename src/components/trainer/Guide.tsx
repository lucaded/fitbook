"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface GuideStep {
  title: string;
  page: string;
  content: string;
  visual: React.ReactNode;
}

export function Guide({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(0);

  const steps: GuideStep[] = locale === "it" ? [
    {
      title: "Benvenuto su FitBook",
      page: "Dashboard",
      content: "FitBook ti permette di gestire clienti, creare programmi di allenamento e pianificare sessioni. Inizia dalla Dashboard dove vedi una panoramica dei tuoi clienti attivi, programmi e azioni rapide.",
      visual: (
        <div className="space-y-3">
          <div className="flex gap-3">
            {["Clienti Attivi", "Programmi", "Inattivi"].map((l) => (
              <div key={l} className="flex-1 bg-[#121212] border border-[#1c1c1c] rounded-2xl px-4 py-3">
                <div className="text-xl font-bold text-neutral-200">3</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="bg-bordeaux-700 text-white/90 text-[12px] px-4 py-2 rounded-xl">Gestisci Clienti</div>
            <div className="border border-[#252525] text-neutral-400 text-[12px] px-4 py-2 rounded-xl">Vedi Agenda</div>
          </div>
          <div className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            Clicca su questi pulsanti per navigare
          </div>
        </div>
      ),
    },
    {
      title: "Gestione Clienti",
      page: "Clienti",
      content: "Nella pagina Clienti puoi aggiungere nuovi clienti, cercarli per nome/email/telefono, e cliccare su uno per vedere il suo profilo completo con programmi e record personali.",
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-bold text-neutral-200">Clienti</div>
            <div className="bg-bordeaux-700 text-white/90 text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>Aggiungi Cliente</span>
              <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5" /></svg>
            </div>
          </div>
          <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl px-3 py-2 text-[11px] text-neutral-600 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Cerca per nome, email o telefono...
          </div>
          <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl overflow-hidden divide-y divide-[#181818]">
            {["Marco Rossi", "Laura Bianchi"].map((n) => (
              <div key={n} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[12px] text-neutral-300">{n}</span>
                </div>
                <svg className="w-3 h-3 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-neutral-600 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" /></svg>
            Clicca su un cliente per aprire il profilo
          </div>
        </div>
      ),
    },
    {
      title: "Profilo Cliente",
      page: "Clienti / [nome]",
      content: "Qui vedi tutti i dettagli del cliente: informazioni personali, record personali (il miglior carico per ogni esercizio), e la lista dei programmi. Puoi modificare le info, creare un nuovo programma da zero o da un modello esistente.",
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="col-span-1 sm:col-span-2 space-y-2">
            <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl p-3">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2">Info</div>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-neutral-600">Email</span><p className="text-neutral-300">marco@email.com</p></div>
                <div><span className="text-neutral-600">Peso</span><p className="text-neutral-300">82 kg</p></div>
                <div><span className="text-neutral-600">Obiettivi</span><p className="text-neutral-300">Ipertrofia</p></div>
              </div>
            </div>
            <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl p-3">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2">Record Personali</div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-300">Squat</span>
                <span className="text-neutral-100 tabular-nums">165 kg × 3</span>
              </div>
            </div>
          </div>
          <div className="col-span-1 sm:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Programmi</div>
              <div className="bg-bordeaux-700 text-white/90 text-[10px] px-2.5 py-1 rounded-xl">Nuovo Programma</div>
            </div>
            <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl overflow-hidden">
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-neutral-200">Forza Base</div>
                  <div className="text-[10px] text-neutral-600">4 giorni/settimana</div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Editor Programma — Vista Tabella",
      page: "Programmi / [nome]",
      content: "Il cuore dell'app. La tabella mostra Settimane (righe) × Giorni (colonne). Clicca su una cella per attivarla, poi aggiungi esercizi dalla libreria. Ogni esercizio mostra: serie × ripetizioni · carico · RPE. Clicca su una cella attiva per modificare i valori.",
      visual: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex bg-[#111] rounded-full p-0.5 border border-[#1c1c1c]">
              {["Tabella", "Riepilogo", "Grafici"].map((v, i) => (
                <div key={v} className={`text-[10px] rounded-full px-2.5 py-0.5 ${i === 0 ? "bg-[#1e1e1e] text-neutral-200" : "text-neutral-600"}`}>{v}</div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <div className="text-neutral-600 p-1">W1</div>
            <div className="text-neutral-400 p-1 font-medium text-center">Upper A</div>
            <div className="text-neutral-400 p-1 font-medium text-center">Lower B</div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="text-[10px] text-neutral-600 p-1">W1</div>
            <div className="bg-[#0f0f0f] rounded-xl p-2 border border-[#181818] col-span-1">
              <div className="bg-[#111] border border-[#181818] rounded-lg px-2 py-1.5">
                <div className="text-[11px] font-semibold text-neutral-100">Bench Press</div>
                <div className="text-[10px] text-neutral-500">4 × 6  ·  92.5 kg  ·  RPE 8</div>
              </div>
              <div className="mt-1 bg-[#111] border border-[#181818] rounded-lg px-2 py-1.5">
                <div className="text-[11px] font-semibold text-neutral-100">Overhead Press</div>
                <div className="text-[10px] text-neutral-500">3 × 8  ·  55 kg</div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-2 border border-dashed border-[#181818] flex items-center justify-center">
              <span className="text-[10px] text-neutral-700">+ Clicca per aggiungere</span>
            </div>
          </div>
          <div className="text-[10px] text-neutral-600 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" /></svg>
            Clicca su una cella → aggiungi/modifica esercizi
          </div>
        </div>
      ),
    },
    {
      title: "Modifica Esercizi",
      page: "Programmi / [nome] → cella attiva",
      content: "Quando una cella è attiva, ogni esercizio si espande per mostrare i campi editabili: Serie, Ripetizioni, %1RM, kg, RPE, Note. Sotto c'è la sezione Effettivi per registrare cosa ha fatto il cliente. Puoi copiare un esercizio su tutte le settimane.",
      visual: (
        <div className="bg-[#111] border border-[#181818] rounded-xl p-3 space-y-2">
          <div className="flex justify-between">
            <div className="text-[11px] font-semibold text-neutral-100">Squat</div>
            <div className="text-[10px] text-neutral-500">5 × 3  ·  165 kg  ·  RPE 7.5</div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {["Serie", "Rip", "%1RM", "kg"].map((l) => (
              <div key={l}>
                <div className="text-[9px] text-neutral-600">{l}</div>
                <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1 text-[10px] text-neutral-200 text-center tabular-nums">
                  {l === "Serie" ? "5" : l === "Rip" ? "3" : l === "%1RM" ? "93" : "165"}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#181818] pt-1.5">
            <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-medium mb-1">Effettivi</div>
            <div className="grid grid-cols-3 gap-1">
              {["Serie", "Rip", "kg"].map((l) => (
                <div key={l} className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1 text-[10px] text-neutral-700 text-center">{l}</div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-neutral-600">Copia su tutte le settimane  ·  1RM 177.5 kg  ·  Vol 2,475 kg</div>
        </div>
      ),
    },
    {
      title: "Funzioni Avanzate",
      page: "Programmi / [nome]",
      content: "Copia Settimana: copia tutti gli esercizi a un'altra settimana. Completa Giorno: salva gli effettivi e genera automaticamente la settimana successiva con progressione (+2.5kg). 1RM: imposta il massimale per calcoli automatici %1RM ↔ kg. Tabella RPE: personalizza la tabella RPE per ogni atleta.",
      visual: (
        <div className="space-y-2.5">
          {[
            { label: "Copia W1 → W2", desc: "Duplica tutti gli esercizi e le etichette", color: "text-bordeaux-400" },
            { label: "Completa", desc: "Salva effettivi + genera progressione", color: "text-emerald-400" },
            { label: "Valori 1RM", desc: "Imposta massimali per calcolo automatico %", color: "text-neutral-400" },
            { label: "Tabella RPE", desc: "RPE × Ripetizioni = %1RM personalizzabile", color: "text-neutral-400" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className={`text-[11px] font-medium ${f.color} w-28 shrink-0`}>{f.label}</div>
              <div className="text-[10px] text-neutral-600">{f.desc}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Agenda",
      page: "Agenda",
      content: "La pagina Agenda mostra un calendario settimanale con le prenotazioni dei clienti. Puoi creare nuove prenotazioni (Personale, Gruppo, Online), navigare tra le settimane, e cancellare o eliminare prenotazioni esistenti.",
      visual: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-neutral-600 px-2 py-1 rounded-full border border-[#1c1c1c]">Prec</div>
            <div className="text-[10px] text-bordeaux-400 px-2.5 py-1 rounded-full bg-bordeaux-800/20">Questa Settimana</div>
            <div className="text-[10px] text-neutral-600 px-2 py-1 rounded-full border border-[#1c1c1c]">Succ</div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <div className="text-neutral-700 p-1">09:00</div>
            <div className="p-1"><div className="bg-bordeaux-900/30 border border-bordeaux-800/30 text-bordeaux-300 rounded-lg px-1.5 py-1 text-[9px]">Marco R.<br/><span className="text-[8px] opacity-60">PERSONALE</span></div></div>
            <div className="p-1"></div>
            <div className="p-1"><div className="bg-amber-900/15 border border-amber-800/20 text-amber-400/80 rounded-lg px-1.5 py-1 text-[9px]">Laura B.<br/><span className="text-[8px] opacity-60">GRUPPO</span></div></div>
          </div>
        </div>
      ),
    },
  ] : [
    // English steps
    {
      title: "Welcome to FitBook",
      page: "Dashboard",
      content: "FitBook lets you manage clients, build training programs, and schedule sessions. Start from the Dashboard where you see an overview of your active clients, programs, and quick actions.",
      visual: (
        <div className="space-y-3">
          <div className="flex gap-3">
            {["Active Clients", "Programs", "Inactive"].map((l) => (
              <div key={l} className="flex-1 bg-[#121212] border border-[#1c1c1c] rounded-2xl px-4 py-3">
                <div className="text-xl font-bold text-neutral-200">3</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="bg-bordeaux-700 text-white/90 text-[12px] px-4 py-2 rounded-xl">Manage Clients</div>
            <div className="border border-[#252525] text-neutral-400 text-[12px] px-4 py-2 rounded-xl">View Schedule</div>
          </div>
          <div className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            Click these buttons to navigate
          </div>
        </div>
      ),
    },
    {
      title: "Client Management",
      page: "Clients",
      content: "On the Clients page you can add new clients, search by name/email/phone, and click any client to view their full profile with programs and personal records.",
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-bold text-neutral-200">Clients</div>
            <div className="bg-bordeaux-700 text-white/90 text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>Add Client</span>
              <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5" /></svg>
            </div>
          </div>
          <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl px-3 py-2 text-[11px] text-neutral-600 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search by name, email, or phone...
          </div>
          <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl overflow-hidden divide-y divide-[#181818]">
            {["Marco Rossi", "Laura Bianchi"].map((n) => (
              <div key={n} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[12px] text-neutral-300">{n}</span>
                </div>
                <svg className="w-3 h-3 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-neutral-600 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" /></svg>
            Click a client to open their profile
          </div>
        </div>
      ),
    },
    {
      title: "Client Profile",
      page: "Clients / [name]",
      content: "Here you see all client details: personal info, personal records (best load per exercise), and their program list. You can edit info, create a new program from scratch or from an existing template.",
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="col-span-1 sm:col-span-2 space-y-2">
            <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl p-3">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2">Info</div>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-neutral-600">Email</span><p className="text-neutral-300">marco@email.com</p></div>
                <div><span className="text-neutral-600">Weight</span><p className="text-neutral-300">82 kg</p></div>
                <div><span className="text-neutral-600">Goals</span><p className="text-neutral-300">Hypertrophy</p></div>
              </div>
            </div>
            <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl p-3">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2">Personal Records</div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-300">Squat</span>
                <span className="text-neutral-100 tabular-nums">165 kg × 3</span>
              </div>
            </div>
          </div>
          <div className="col-span-1 sm:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Programs</div>
              <div className="bg-bordeaux-700 text-white/90 text-[10px] px-2.5 py-1 rounded-xl">New Program</div>
            </div>
            <div className="bg-[#121212] border border-[#1c1c1c] rounded-2xl overflow-hidden">
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-neutral-200">Strength Base</div>
                  <div className="text-[10px] text-neutral-600">4 days/week</div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Program Editor — Table View",
      page: "Programs / [name]",
      content: "The core of the app. The table shows Weeks (rows) × Days (columns). Click a cell to activate it, then add exercises from the library. Each exercise shows: sets × reps · load · RPE. Click an active cell to edit values.",
      visual: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex bg-[#111] rounded-full p-0.5 border border-[#1c1c1c]">
              {["Table", "Summary", "Charts"].map((v, i) => (
                <div key={v} className={`text-[10px] rounded-full px-2.5 py-0.5 ${i === 0 ? "bg-[#1e1e1e] text-neutral-200" : "text-neutral-600"}`}>{v}</div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <div className="text-neutral-600 p-1"></div>
            <div className="text-neutral-400 p-1 font-medium text-center">Upper A</div>
            <div className="text-neutral-400 p-1 font-medium text-center">Lower B</div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="text-[10px] text-neutral-600 p-1">W1</div>
            <div className="bg-[#0f0f0f] rounded-xl p-2 border border-[#181818]">
              <div className="bg-[#111] border border-[#181818] rounded-lg px-2 py-1.5">
                <div className="text-[11px] font-semibold text-neutral-100">Bench Press</div>
                <div className="text-[10px] text-neutral-500">4 × 6  ·  92.5 kg  ·  RPE 8</div>
              </div>
              <div className="mt-1 bg-[#111] border border-[#181818] rounded-lg px-2 py-1.5">
                <div className="text-[11px] font-semibold text-neutral-100">Overhead Press</div>
                <div className="text-[10px] text-neutral-500">3 × 8  ·  55 kg</div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-2 border border-dashed border-[#181818] flex items-center justify-center">
              <span className="text-[10px] text-neutral-700">+ Click to add</span>
            </div>
          </div>
          <div className="text-[10px] text-neutral-600 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" /></svg>
            Click a cell → add/edit exercises
          </div>
        </div>
      ),
    },
    {
      title: "Editing Exercises",
      page: "Programs / [name] → active cell",
      content: "When a cell is active, each exercise expands to show editable fields: Sets, Reps, %1RM, kg, RPE, Notes. Below that is the Actuals section to record what the client actually did. You can copy an exercise to all weeks.",
      visual: (
        <div className="bg-[#111] border border-[#181818] rounded-xl p-3 space-y-2">
          <div className="flex justify-between">
            <div className="text-[11px] font-semibold text-neutral-100">Squat</div>
            <div className="text-[10px] text-neutral-500">5 × 3  ·  165 kg  ·  RPE 7.5</div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {["Sets", "Reps", "%1RM", "kg"].map((l) => (
              <div key={l}>
                <div className="text-[9px] text-neutral-600">{l}</div>
                <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1 text-[10px] text-neutral-200 text-center tabular-nums">
                  {l === "Sets" ? "5" : l === "Reps" ? "3" : l === "%1RM" ? "93" : "165"}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#181818] pt-1.5">
            <div className="text-[9px] text-neutral-600 uppercase tracking-wider font-medium mb-1">Actuals</div>
            <div className="grid grid-cols-3 gap-1">
              {["Sets", "Reps", "kg"].map((l) => (
                <div key={l} className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1 text-[10px] text-neutral-700 text-center">{l}</div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-neutral-600">Copy to all weeks  ·  1RM 177.5 kg  ·  Vol 2,475 kg</div>
        </div>
      ),
    },
    {
      title: "Advanced Features",
      page: "Programs / [name]",
      content: "Copy Week: duplicate all exercises to another week. Complete Day: saves actuals and auto-generates next week's exercises with progression (+2.5kg). 1RM: set maxes for automatic %1RM ↔ kg conversion. RPE Table: customize the RPE chart per athlete.",
      visual: (
        <div className="space-y-2.5">
          {[
            { label: "Copy W1 → W2", desc: "Duplicates all exercises and labels", color: "text-bordeaux-400" },
            { label: "Complete", desc: "Saves actuals + generates progression", color: "text-emerald-400" },
            { label: "1RM Values", desc: "Set maxes for automatic % calculation", color: "text-neutral-400" },
            { label: "RPE Table", desc: "RPE × Reps = %1RM customizable chart", color: "text-neutral-400" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className={`text-[11px] font-medium ${f.color} w-28 shrink-0`}>{f.label}</div>
              <div className="text-[10px] text-neutral-600">{f.desc}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Schedule",
      page: "Schedule",
      content: "The Schedule page shows a weekly calendar with client bookings. You can create new bookings (Personal, Group, Online), navigate between weeks, and cancel or delete existing bookings.",
      visual: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-neutral-600 px-2 py-1 rounded-full border border-[#1c1c1c]">Prev</div>
            <div className="text-[10px] text-bordeaux-400 px-2.5 py-1 rounded-full bg-bordeaux-800/20">This Week</div>
            <div className="text-[10px] text-neutral-600 px-2 py-1 rounded-full border border-[#1c1c1c]">Next</div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <div className="text-neutral-700 p-1">09:00</div>
            <div className="p-1"><div className="bg-bordeaux-900/30 border border-bordeaux-800/30 text-bordeaux-300 rounded-lg px-1.5 py-1 text-[9px]">Marco R.<br/><span className="text-[8px] opacity-60">PERSONAL</span></div></div>
            <div className="p-1"></div>
            <div className="p-1"><div className="bg-amber-900/15 border border-amber-800/20 text-amber-400/80 rounded-lg px-1.5 py-1 text-[9px]">Laura B.<br/><span className="text-[8px] opacity-60">GROUP</span></div></div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#181818] sticky top-0 bg-[#121212] z-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-neutral-100">{current.title}</h2>
            <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors text-lg leading-none p-1">×</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-bordeaux-400 bg-bordeaux-500/10 px-2 py-0.5 rounded-full">{current.page}</span>
            <span className="text-[11px] text-neutral-700">{step + 1} / {steps.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-6 py-5">
          <p className="text-[13px] text-neutral-400 leading-relaxed mb-5">{current.content}</p>
          <div className="bg-[#0a0a0a] rounded-xl border border-[#181818] p-3 sm:p-4 overflow-x-auto">
            {current.visual}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#181818] flex items-center justify-between sticky bottom-0 bg-[#121212]">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${i === step ? "bg-bordeaux-500 w-5" : "bg-[#252525] hover:bg-[#333]"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="text-[13px] text-neutral-500 hover:text-neutral-300 px-3 py-2 rounded-full transition-colors">
                {locale === "it" ? "Indietro" : "Back"}
              </button>
            )}
            {isLast ? (
              <button onClick={onClose} className="text-[13px] font-medium text-white bg-bordeaux-700 hover:bg-bordeaux-600 px-5 py-2 rounded-full transition-colors">
                {locale === "it" ? "Inizia" : "Get Started"}
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)} className="text-[13px] font-medium text-white bg-bordeaux-700 hover:bg-bordeaux-600 px-5 py-2 rounded-full transition-colors">
                {locale === "it" ? "Avanti" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
