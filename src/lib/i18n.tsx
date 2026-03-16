"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "en" | "it";

const translations = {
  en: {
    // Nav
    home: "Home",
    clients: "Clients",
    schedule: "Schedule",
    signOut: "Sign out",

    // Dashboard
    dashboard: "Dashboard",
    dashboardSub: "Overview of your clients and programs.",
    activeClients: "Active Clients",
    programs: "Programs",
    inactive: "Inactive",
    manageClients: "Manage Clients",
    viewSchedule: "View Schedule",
    noClientsYet: "No clients yet",
    addFirstClient: "Add your first client",

    // Clients page
    clientsSub: "Manage your clients. Click to view profile and programs.",
    addClient: "Add Client",
    cancel: "Cancel",
    searchPlaceholder: "Search by name, email, or phone...",
    newClient: "New Client",
    name: "Name",
    email: "Email",
    phone: "Phone",
    heightCm: "Height (cm)",
    weightKg: "Weight (kg)",
    goals: "Goals",
    injuriesNotes: "Injuries / Notes",
    injuries: "Injuries",
    notes: "Notes",
    saving: "Saving...",
    noClientsMatch: "No clients match",
    clickAddClient: 'Click "Add Client" to get started',

    // Client detail
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    info: "Info",
    height: "Height",
    weight: "Weight",
    noDetailsYet: "No details yet. Click Edit to add.",
    personalRecords: "Personal Records",
    newProgram: "New Program",
    startFromTemplate: "Start from template",
    blankProgram: "Blank program",
    programName: "Program Name",
    weeks: "Weeks",
    daysPerWeek: "Days / Week",
    createFromTemplate: "Create from Template",
    createProgram: "Create Program",
    noProgramsYet: "No programs yet. Create one to get started.",
    deleteConfirm: "Delete this client and all their data?",
    clientNotFound: "Client not found",

    // Program editor
    saved: "Saved",
    addDay: "Add Day",
    removeDay: "Remove Day",
    removeDayConfirm: "Remove Day {n} from all weeks?",
    table: "Table",
    summary: "Summary",
    charts: "Charts",
    print: "Print",
    oneRMValues: "1RM values",
    set: "set",
    rpeChart: "RPE Chart",
    resetDefaults: "Reset defaults",
    volume: "Volume",
    avgIntensity: "Avg Intensity",
    peakVolume: "Peak Volume",
    peakIntensity: "Peak Intensity",
    vol: "Vol",
    reps: "Reps",
    int: "Int",
    sets: "Sets",
    kg: "kg",
    addExercise: "+ Add exercise",
    complete: "Complete",
    searchExercises: "Search exercises...",
    addAsCustom: "Add as custom",
    copyToAllWeeks: "Copy to all weeks",
    actuals: "Actuals",
    apply: "Apply",
    clickToAdd: "+ Click to add exercises",
    programNotFound: "Program not found",

    // Schedule
    scheduleSub: "Weekly calendar for training sessions.",
    newBooking: "New Booking",
    client: "Client",
    date: "Date",
    start: "Start",
    end: "End",
    type: "Type",
    personal: "Personal",
    group: "Group",
    online: "Online",
    createBooking: "Create Booking",
    prev: "Prev",
    thisWeek: "This Week",
    next: "Next",
    select: "Select...",
    optional: "Optional...",

    // Login
    personalTrainingMgmt: "Personal training management",
    signInGoogle: "Sign in with Google",
    credit: "Antonio De Donno Personal Training",
  },
  it: {
    // Nav
    home: "Home",
    clients: "Clienti",
    schedule: "Agenda",
    signOut: "Esci",

    // Dashboard
    dashboard: "Dashboard",
    dashboardSub: "Panoramica dei tuoi clienti e programmi.",
    activeClients: "Clienti Attivi",
    programs: "Programmi",
    inactive: "Inattivi",
    manageClients: "Gestisci Clienti",
    viewSchedule: "Vedi Agenda",
    noClientsYet: "Nessun cliente",
    addFirstClient: "Aggiungi il primo cliente",

    // Clients page
    clientsSub: "Gestisci i tuoi clienti. Clicca per vedere profilo e programmi.",
    addClient: "Aggiungi Cliente",
    cancel: "Annulla",
    searchPlaceholder: "Cerca per nome, email o telefono...",
    newClient: "Nuovo Cliente",
    name: "Nome",
    email: "Email",
    phone: "Telefono",
    heightCm: "Altezza (cm)",
    weightKg: "Peso (kg)",
    goals: "Obiettivi",
    injuriesNotes: "Infortuni / Note",
    injuries: "Infortuni",
    notes: "Note",
    saving: "Salvataggio...",
    noClientsMatch: "Nessun cliente corrisponde a",
    clickAddClient: 'Clicca "Aggiungi Cliente" per iniziare',

    // Client detail
    edit: "Modifica",
    delete: "Elimina",
    save: "Salva",
    info: "Info",
    height: "Altezza",
    weight: "Peso",
    noDetailsYet: "Nessun dettaglio. Clicca Modifica per aggiungere.",
    personalRecords: "Record Personali",
    newProgram: "Nuovo Programma",
    startFromTemplate: "Parti da un modello",
    blankProgram: "Programma vuoto",
    programName: "Nome Programma",
    weeks: "Settimane",
    daysPerWeek: "Giorni / Settimana",
    createFromTemplate: "Crea da Modello",
    createProgram: "Crea Programma",
    noProgramsYet: "Nessun programma. Creane uno per iniziare.",
    deleteConfirm: "Eliminare questo cliente e tutti i suoi dati?",
    clientNotFound: "Cliente non trovato",

    // Program editor
    saved: "Salvato",
    addDay: "Aggiungi Giorno",
    removeDay: "Rimuovi Giorno",
    removeDayConfirm: "Rimuovere il Giorno {n} da tutte le settimane?",
    table: "Tabella",
    summary: "Riepilogo",
    charts: "Grafici",
    print: "Stampa",
    oneRMValues: "Valori 1RM",
    set: "impostati",
    rpeChart: "Tabella RPE",
    resetDefaults: "Ripristina",
    volume: "Volume",
    avgIntensity: "Intensità Media",
    peakVolume: "Volume Massimo",
    peakIntensity: "Intensità Massima",
    vol: "Vol",
    reps: "Rip",
    int: "Int",
    sets: "Serie",
    kg: "kg",
    addExercise: "+ Aggiungi esercizio",
    complete: "Completa",
    searchExercises: "Cerca esercizi...",
    addAsCustom: "Aggiungi come personalizzato",
    copyToAllWeeks: "Copia su tutte le settimane",
    actuals: "Effettivi",
    apply: "Applica",
    clickToAdd: "+ Clicca per aggiungere esercizi",
    programNotFound: "Programma non trovato",

    // Schedule
    scheduleSub: "Calendario settimanale per le sessioni di allenamento.",
    newBooking: "Nuova Prenotazione",
    client: "Cliente",
    date: "Data",
    start: "Inizio",
    end: "Fine",
    type: "Tipo",
    personal: "Personale",
    group: "Gruppo",
    online: "Online",
    createBooking: "Crea Prenotazione",
    prev: "Prec",
    thisWeek: "Questa Settimana",
    next: "Succ",
    select: "Seleziona...",
    optional: "Facoltativo...",

    // Login
    personalTrainingMgmt: "Gestione allenamento personale",
    signInGoogle: "Accedi con Google",
    credit: "Antonio De Donno Personal Training",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("fitbook-locale") as Locale | null;
    if (saved && (saved === "en" || saved === "it")) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("fitbook-locale", l);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
