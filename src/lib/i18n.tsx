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
    variant: "Variant",
    addVariant: "+ variant",
    variantPlaceholder: "e.g. close grip, paused...",
    actuals: "Actuals",
    apply: "Apply",
    clickToAdd: "+ Click to add exercises",
    dayNotes: "Day Notes",
    addNote: "Add note",
    programNotFound: "Program not found",
    duplicate: "Duplicate",
    duplicating: "Duplicating...",
    completion: "completion",

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

    // Toasts & Modals
    changesSaved: "Changes saved",
    clientDeleted: "Client deleted",
    clientAdded: "Client added",
    programCreated: "Program created",
    bookingCreated: "Booking created",
    bookingCancelled: "Booking cancelled",
    bookingDeleted: "Booking deleted",
    deleteClient: "Delete client",
    deleteClientMsg: "Are you sure? This will delete all programs and bookings for this client.",
    createFirstProgram: "Create a training program to get started",
    weekStreak: "week streak",
    weeksStreak: "week streak",
    weeksCompleted: "weeks completed",
    week: "Week",
    deleteBooking: "Delete booking",
    deleteBookingMsg: "Are you sure you want to delete this booking?",
    today: "Today",
    yesterday: "Yesterday",
    allClients: "All clients",
    clear: "Clear",

    // Weekly Pulse
    weeklyPulse: "This Week",
    sessionsCompleted: "Sessions Done",
    sessionsBooked: "Booked",
    programsActive: "Active Programs",
    exercisesLogged: "Exercises Logged",
    pulseGreat: "Great week — keep it up!",
    pulseGood: "Solid progress this week.",
    pulseStart: "Let's get this week going!",

    // Client dashboard
    myPrograms: "Programs",
    myBookings: "Bookings",
    welcome: "Welcome",
    subscriptionActive: "Active until",
    subscriptionExpiring: "Expiring soon — contact your trainer",
    subscriptionExpired: "Subscription expired",
    contactTrainer: "Contact your trainer",
    upcomingSessions: "Upcoming Sessions",
    noUpcomingSessions: "No upcoming sessions",
    activeUntil: "Active until",

    // Client program view
    prescribed: "Prescribed",
    yourLog: "Your Log",
    repSpeed: "Rep speed",
    repSpeedSec: "Rep speed (sec)",
    velocity: "Velocity",
    clientNote: "Your notes",
    clientNotePlaceholder: "How did it feel? Any issues...",
    logSaved: "Log saved",
    subscriptionRequired: "Subscription required",
    exerciseVariant: "Variant",

    // Invite
    invite: "Invite",
    inviteClient: "Invite Client",
    inviteLinkCopied: "Invite link copied!",
    inviteExpires: "Expires in 7 days",
    copyLink: "Copy Link",

    // Client bookings
    bookSession: "Book a Session",
    upcomingBookings: "Upcoming Bookings",
    pastBookings: "Past Bookings",
    noBookingsYet: "No bookings yet",
    bookFirstSession: "Book your first session to get started",
    cancelBooking: "Cancel Booking",
    cancelBookingConfirm: "Are you sure you want to cancel this booking?",

    // Subscription management (trainer)
    subscription: "Subscription",
    setPayment: "Set Payment",
    paidUntil: "Paid Until",
    expiresIn: "Expires in",
    expired: "Expired",
    noSubscription: "No subscription",
    oneMonth: "+1 Month",
    threeMonths: "+3 Months",
    sixMonths: "+6 Months",
    oneYear: "+1 Year",
    renewSubscription: "Renew Subscription",
    subscriptionUpdated: "Subscription updated",
    daysAgo: "days ago",
    days: "days",

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
    variant: "Variante",
    addVariant: "+ variante",
    variantPlaceholder: "es. presa stretta, con pausa...",
    actuals: "Effettivi",
    apply: "Applica",
    clickToAdd: "+ Clicca per aggiungere esercizi",
    dayNotes: "Note del Giorno",
    addNote: "Aggiungi nota",
    programNotFound: "Programma non trovato",
    duplicate: "Duplica",
    duplicating: "Duplicazione...",
    completion: "completamento",

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

    // Toasts & Modals
    changesSaved: "Modifiche salvate",
    clientDeleted: "Cliente eliminato",
    clientAdded: "Cliente aggiunto",
    programCreated: "Programma creato",
    bookingCreated: "Prenotazione creata",
    bookingCancelled: "Prenotazione annullata",
    bookingDeleted: "Prenotazione eliminata",
    deleteClient: "Elimina cliente",
    deleteClientMsg: "Sei sicuro? Questo eliminerà tutti i programmi e le prenotazioni di questo cliente.",
    createFirstProgram: "Crea un programma di allenamento per iniziare",
    weekStreak: "settimana consecutiva",
    weeksStreak: "settimane consecutive",
    weeksCompleted: "settimane completate",
    week: "Settimana",
    deleteBooking: "Elimina prenotazione",
    deleteBookingMsg: "Sei sicuro di voler eliminare questa prenotazione?",
    today: "Oggi",
    yesterday: "Ieri",
    allClients: "Tutti i clienti",
    clear: "Cancella",

    // Weekly Pulse
    weeklyPulse: "Questa Settimana",
    sessionsCompleted: "Sessioni Fatte",
    sessionsBooked: "Prenotate",
    programsActive: "Programmi Attivi",
    exercisesLogged: "Esercizi Registrati",
    pulseGreat: "Ottima settimana — continua cos\u00ec!",
    pulseGood: "Buoni progressi questa settimana.",
    pulseStart: "Iniziamo questa settimana!",

    // Client dashboard
    myPrograms: "Programmi",
    myBookings: "Prenotazioni",
    welcome: "Benvenuto",
    subscriptionActive: "Attivo fino al",
    subscriptionExpiring: "In scadenza — contatta il tuo trainer",
    subscriptionExpired: "Abbonamento scaduto",
    contactTrainer: "Contatta il tuo trainer",
    upcomingSessions: "Prossime Sessioni",
    noUpcomingSessions: "Nessuna sessione in programma",
    activeUntil: "Attivo fino al",

    // Client program view
    prescribed: "Prescritto",
    yourLog: "Il Tuo Log",
    repSpeed: "Velocità rep",
    repSpeedSec: "Velocità rep (sec)",
    velocity: "Velocità",
    clientNote: "Le tue note",
    clientNotePlaceholder: "Come ti sei sentito? Problemi...",
    logSaved: "Log salvato",
    subscriptionRequired: "Abbonamento richiesto",
    exerciseVariant: "Variante",

    // Invite
    invite: "Invita",
    inviteClient: "Invita Cliente",
    inviteLinkCopied: "Link di invito copiato!",
    inviteExpires: "Scade tra 7 giorni",
    copyLink: "Copia Link",

    // Client bookings
    bookSession: "Prenota una Sessione",
    upcomingBookings: "Prossime Prenotazioni",
    pastBookings: "Prenotazioni Passate",
    noBookingsYet: "Nessuna prenotazione",
    bookFirstSession: "Prenota la tua prima sessione per iniziare",
    cancelBooking: "Annulla Prenotazione",
    cancelBookingConfirm: "Sei sicuro di voler annullare questa prenotazione?",

    // Subscription management (trainer)
    subscription: "Abbonamento",
    setPayment: "Imposta Pagamento",
    paidUntil: "Pagato Fino Al",
    expiresIn: "Scade tra",
    expired: "Scaduto",
    noSubscription: "Nessun abbonamento",
    oneMonth: "+1 Mese",
    threeMonths: "+3 Mesi",
    sixMonths: "+6 Mesi",
    oneYear: "+1 Anno",
    renewSubscription: "Rinnova Abbonamento",
    subscriptionUpdated: "Abbonamento aggiornato",
    daysAgo: "giorni fa",
    days: "giorni",

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
