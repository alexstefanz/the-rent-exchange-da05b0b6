export const uxCopy = {
  search: {
    placeholder: "Caută obiecte de închiriat în apropiere",
    noResults: "Nu am găsit exact ce cauți",
    noResultsSubtitle: "Încearcă termeni mai generali sau extinde zona de căutare",
    suggestions: "Sugestii pentru tine",
    resultsCount: (count: number) => `${count} rezultat${count !== 1 ? 'e' : ''} găsite`,
    filters: {
      category: "Categorie",
      priceRange: "Interval preț",
      availability: "Disponibilitate",
      distance: "Distanță maximă",
      sortBy: "Sortează după",
      relevance: "Relevanță",
      priceAsc: "Preț crescător",
      priceDesc: "Preț descrescător",
      nearest: "Cele mai apropiate",
      clearAll: "Șterge filtrele"
    }
  },
  booking: {
    ctaPrimary: "Trimite cerere de închiriere",
    ctaSecondary: "Contactează proprietarul",
    reassurance: "Nu vei fi taxat până când proprietarul acceptă cererea",
    confirmation: "Cererea ta a fost trimisă cu succes!",
    whatNext: "Ce urmează?",
    ownerResponse: "Proprietarul va răspunde în maxim 24 ore",
    steps: {
      period: "Selectează perioada",
      message: "Mesaj pentru proprietar",
      auth: "Autentificare",
      confirm: "Confirmare"
    },
    messagePlaceholder: "Salut! Aș dori să închiriez acest produs. Când ar fi disponibil?",
    priceBreakdown: {
      perDay: "preț/zi",
      days: "zile",
      subtotal: "Subtotal",
      serviceFee: "Taxă serviciu",
      total: "Total"
    },
    freeCancellation: "Anulare gratuită până la confirmare"
  },
  trust: {
    verified: "Utilizator verificat",
    securePay: "Plăți protejate",
    insurance: "Asigurare inclusă",
    support: "Suport dedicat",
    verifiedOwner: "Proprietar verificat",
    fastResponse: "Răspuns rapid",
    identityVerified: "Identitate verificată"
  },
  product: {
    includes: "Ce este inclus",
    rules: "Reguli de utilizare",
    reviews: "Recenzii",
    seeAllReviews: "Vezi toate recenziile",
    noReviews: "Încă nu există recenzii",
    beFirstReview: "Fii primul care lasă o recenzie!",
    cancellationPolicy: "Politică de anulare",
    deposit: "Garanție",
    availability: "Disponibilitate"
  },
  owner: {
    memberSince: "Membru din",
    responseTime: "Timp mediu de răspuns",
    responseTimeValue: "< 1 oră",
    sendMessage: "Trimite mesaj",
    viewProfile: "Vezi profil"
  },
  dashboard: {
    myRentals: "Închirierile mele",
    myListings: "Anunțurile mele",
    borrowing: "Am împrumutat",
    lending: "Am dat cu împrumut",
    upcomingRentals: "Rezervări viitoare",
    rentalHistory: "Istoric închirieri",
    myItems: "Obiectele mele",
    pendingRequests: "Cereri în așteptare",
    activeRentals: "Închirieri active",
    noRentals: "Nu ai nicio rezervare încă",
    noRentalsSubtitle: "Caută primul obiect de închiriat!",
    noListings: "Nu ai listat nimic încă",
    noListingsSubtitle: "Transformă obiectele nefolosite în venit!",
    startListing: "Listează acum",
    startSearching: "Caută acum"
  },
  status: {
    pending: "În așteptare",
    accepted: "Acceptat",
    rejected: "Refuzat",
    completed: "Finalizat",
    cancelled: "Anulat",
    active: "Activ",
    inactive: "Inactiv"
  },
  reassurance: {
    paymentProtected: "Plata ta este protejată. Nu se debitează până la confirmare.",
    freeCancellation: "Poți anula gratuit până la confirmare.",
    keepOnPlatform: "Ține conversația pe platformă pentru protecție.",
    secureTransaction: "Tranzacție securizată"
  },
  common: {
    loading: "Se încarcă...",
    error: "Ceva nu a mers bine",
    tryAgain: "Încearcă din nou",
    cancel: "Anulează",
    confirm: "Confirmă",
    continue: "Continuă",
    back: "Înapoi",
    save: "Salvează",
    edit: "Editează",
    delete: "Șterge",
    viewAll: "Vezi toate",
    perDay: "/ zi",
    ron: "RON"
  },
  home: {
    heroTitle: "Închiriază ce ai nevoie,",
    heroTitleHighlight: "când ai nevoie",
    heroSubtitle: "Platforma ta de încredere pentru închiriere. Găsește echipamente, vehicule și multe altele de la oameni din comunitatea ta.",
    popularCategories: "Categorii populare",
    featuredListings: "Populare în zona ta",
    howItWorks: "Cum funcționează",
    ctaTitle: "Ai ceva de închiriat?",
    ctaSubtitle: "Transformă obiectele nefolosite în venit. Listează gratuit și începe să câștigi azi.",
    ctaButton: "Începe să listezi"
  }
};

export type UxCopyType = typeof uxCopy;
