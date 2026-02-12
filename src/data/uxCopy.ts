const createUxCopy = () => ({
  search: {
    placeholder: { ro: "Caută obiecte de închiriat în apropiere", en: "Search items to rent nearby" },
    noResults: { ro: "Nu am găsit exact ce cauți", en: "We couldn't find what you're looking for" },
    noResultsSubtitle: { ro: "Încearcă termeni mai generali sau extinde zona de căutare", en: "Try broader terms or expand the search area" },
    suggestions: { ro: "Sugestii pentru tine", en: "Suggestions for you" },
    resultsCount: { ro: (count: number) => `${count} rezultat${count !== 1 ? 'e' : ''} găsite`, en: (count: number) => `${count} result${count !== 1 ? 's' : ''} found` },
    filters: {
      category: { ro: "Categorie", en: "Category" },
      priceRange: { ro: "Interval preț", en: "Price range" },
      availability: { ro: "Disponibilitate", en: "Availability" },
      distance: { ro: "Distanță maximă", en: "Max distance" },
      sortBy: { ro: "Sortează după", en: "Sort by" },
      relevance: { ro: "Relevanță", en: "Relevance" },
      priceAsc: { ro: "Preț crescător", en: "Price: low to high" },
      priceDesc: { ro: "Preț descrescător", en: "Price: high to low" },
      nearest: { ro: "Cele mai apropiate", en: "Nearest" },
      clearAll: { ro: "Șterge filtrele", en: "Clear filters" },
    }
  },
  booking: {
    ctaPrimary: { ro: "Trimite cerere de închiriere", en: "Send rental request" },
    ctaSecondary: { ro: "Contactează proprietarul", en: "Contact the owner" },
    reassurance: { ro: "Nu vei fi taxat până când proprietarul acceptă cererea", en: "You won't be charged until the owner accepts the request" },
    confirmation: { ro: "Cererea ta a fost trimisă cu succes!", en: "Your request has been sent successfully!" },
    whatNext: { ro: "Ce urmează?", en: "What's next?" },
    ownerResponse: { ro: "Proprietarul va răspunde în maxim 24 ore", en: "The owner will respond within 24 hours" },
    steps: {
      period: { ro: "Selectează perioada", en: "Select period" },
      message: { ro: "Mesaj pentru proprietar", en: "Message to owner" },
      auth: { ro: "Autentificare", en: "Authentication" },
      confirm: { ro: "Confirmare", en: "Confirmation" },
    },
    messagePlaceholder: { ro: "Salut! Aș dori să închiriez acest produs. Când ar fi disponibil?", en: "Hi! I'd like to rent this product. When would it be available?" },
    priceBreakdown: {
      perDay: { ro: "preț/zi", en: "price/day" },
      days: { ro: "zile", en: "days" },
      subtotal: { ro: "Subtotal", en: "Subtotal" },
      serviceFee: { ro: "Taxă serviciu", en: "Service fee" },
      total: { ro: "Total", en: "Total" },
    },
    freeCancellation: { ro: "Anulare gratuită până la confirmare", en: "Free cancellation until confirmation" },
  },
  trust: {
    verified: { ro: "Utilizator verificat", en: "Verified user" },
    securePay: { ro: "Plăți protejate", en: "Secure payments" },
    insurance: { ro: "Asigurare inclusă", en: "Insurance included" },
    support: { ro: "Suport dedicat", en: "Dedicated support" },
    verifiedOwner: { ro: "Proprietar verificat", en: "Verified owner" },
    fastResponse: { ro: "Răspuns rapid", en: "Fast response" },
    identityVerified: { ro: "Identitate verificată", en: "Identity verified" },
  },
  product: {
    includes: { ro: "Ce este inclus", en: "What's included" },
    rules: { ro: "Reguli de utilizare", en: "Usage rules" },
    reviews: { ro: "Recenzii", en: "Reviews" },
    seeAllReviews: { ro: "Vezi toate recenziile", en: "See all reviews" },
    noReviews: { ro: "Încă nu există recenzii", en: "No reviews yet" },
    beFirstReview: { ro: "Fii primul care lasă o recenzie!", en: "Be the first to leave a review!" },
    cancellationPolicy: { ro: "Politică de anulare", en: "Cancellation policy" },
    deposit: { ro: "Garanție", en: "Deposit" },
    availability: { ro: "Disponibilitate", en: "Availability" },
    description: { ro: "Descriere", en: "Description" },
    noDescription: { ro: "Fără descriere.", en: "No description." },
    notFound: { ro: "Produsul nu a fost găsit", en: "Product not found" },
    backToCategories: { ro: "Înapoi la Categorii", en: "Back to Categories" },
    allCategories: { ro: "Toate categoriile", en: "All categories" },
    viewOnMap: { ro: "Vezi pe Google Maps", en: "View on Google Maps" },
  },
  owner: {
    memberSince: { ro: "Membru din", en: "Member since" },
    responseTime: { ro: "Timp mediu de răspuns", en: "Average response time" },
    responseTimeValue: { ro: "< 1 oră", en: "< 1 hour" },
    sendMessage: { ro: "Trimite mesaj", en: "Send message" },
    viewProfile: { ro: "Vezi profil", en: "View profile" },
    respondsIn: { ro: "Răspunde în", en: "Responds in" },
    responseRate: { ro: "Rată răspuns", en: "Response rate" },
    reviews: { ro: "recenzii", en: "reviews" },
  },
  dashboard: {
    myRentals: { ro: "Închirierile mele", en: "My Rentals" },
    myListings: { ro: "Anunțurile mele", en: "My Listings" },
    borrowing: { ro: "Am împrumutat", en: "Borrowed" },
    lending: { ro: "Am dat cu împrumut", en: "Lent out" },
    upcomingRentals: { ro: "Rezervări viitoare", en: "Upcoming rentals" },
    rentalHistory: { ro: "Istoric închirieri", en: "Rental history" },
    myItems: { ro: "Obiectele mele", en: "My items" },
    pendingRequests: { ro: "Cereri în așteptare", en: "Pending requests" },
    activeRentals: { ro: "Închirieri active", en: "Active rentals" },
    noRentals: { ro: "Nu ai nicio rezervare încă", en: "You have no reservations yet" },
    noRentalsSubtitle: { ro: "Caută primul obiect de închiriat!", en: "Search for your first item to rent!" },
    noListings: { ro: "Nu ai listat nimic încă", en: "You haven't listed anything yet" },
    noListingsSubtitle: { ro: "Transformă obiectele nefolosite în venit!", en: "Turn unused items into income!" },
    startListing: { ro: "Listează acum", en: "List now" },
    startSearching: { ro: "Caută acum", en: "Search now" },
    owner: { ro: "Proprietar", en: "Owner" },
    contactOwner: { ro: "Contactează proprietarul", en: "Contact the owner" },
    activeProducts: { ro: "Produse active", en: "Active products" },
    pendingRequestsLabel: { ro: "Cereri în așteptare", en: "Pending requests" },
    wantsToRent: { ro: "Vrea să închirieze", en: "Wants to rent" },
    accept: { ro: "Acceptă", en: "Accept" },
    reject: { ro: "Refuză", en: "Reject" },
    addListing: { ro: "Adaugă anunț", en: "Add listing" },
  },
  status: {
    pending: { ro: "În așteptare", en: "Pending" },
    accepted: { ro: "Acceptat", en: "Accepted" },
    rejected: { ro: "Refuzat", en: "Rejected" },
    completed: { ro: "Finalizat", en: "Completed" },
    cancelled: { ro: "Anulat", en: "Cancelled" },
    active: { ro: "Activ", en: "Active" },
    inactive: { ro: "Inactiv", en: "Inactive" },
  },
  reassurance: {
    paymentProtected: { ro: "Plata ta este protejată. Nu se debitează până la confirmare.", en: "Your payment is protected. No charge until confirmation." },
    freeCancellation: { ro: "Poți anula gratuit până la confirmare.", en: "Free cancellation until confirmation." },
    keepOnPlatform: { ro: "Ține conversația pe platformă pentru protecție.", en: "Keep conversations on the platform for protection." },
    secureTransaction: { ro: "Tranzacție securizată", en: "Secure transaction" },
  },
  common: {
    loading: { ro: "Se încarcă...", en: "Loading..." },
    error: { ro: "Ceva nu a mers bine", en: "Something went wrong" },
    tryAgain: { ro: "Încearcă din nou", en: "Try again" },
    cancel: { ro: "Anulează", en: "Cancel" },
    confirm: { ro: "Confirmă", en: "Confirm" },
    continue: { ro: "Continuă", en: "Continue" },
    back: { ro: "Înapoi", en: "Back" },
    save: { ro: "Salvează", en: "Save" },
    edit: { ro: "Editează", en: "Edit" },
    delete: { ro: "Șterge", en: "Delete" },
    viewAll: { ro: "Vezi toate", en: "View all" },
    perDay: { ro: "/ zi", en: "/ day" },
    ron: { ro: "RON", en: "RON" },
    clear: { ro: "Șterge", en: "Clear" },
  },
  home: {
    heroTitle: { ro: "Închiriază ce ai nevoie,", en: "Rent what you need," },
    heroTitleHighlight: { ro: "când ai nevoie", en: "when you need it" },
    heroSubtitle: { ro: "Platforma ta de încredere pentru închiriere. Găsește echipamente, vehicule și multe altele de la oameni din comunitatea ta.", en: "Your trusted rental platform. Find equipment, vehicles and more from people in your community." },
    popularCategories: { ro: "Categorii principale", en: "Main categories" },
    featuredListings: { ro: "Populare în zona ta", en: "Popular in your area" },
    howItWorks: { ro: "Cum Funcționează", en: "How It Works" },
    howItWorksSubtitle: { ro: "Închirierea simplificată în trei pași", en: "Simplified rental in three steps" },
    ctaTitle: { ro: "Ai Ceva de Închiriat?", en: "Got Something to Rent?" },
    ctaSubtitle: { ro: "Transformă obiectele nefolosite în venit. Listează gratuit și începe să câștigi azi.", en: "Turn unused items into income. List for free and start earning today." },
    ctaButton: { ro: "Începe Să Listezi", en: "Start Listing" },
    step1Title: { ro: "Găsește Ce Ai Nevoie", en: "Find What You Need" },
    step1Desc: { ro: "Răsfoiește mii de produse disponibile în zona ta, de la camere foto la echipament de camping.", en: "Browse thousands of products available in your area, from cameras to camping gear." },
    step2Title: { ro: "Rezervă & Ridică", en: "Book & Pick Up" },
    step2Desc: { ro: "Alege perioada, coordonează cu proprietarul și ridică produsul când îți convine.", en: "Choose the period, coordinate with the owner and pick up the product when it suits you." },
    step3Title: { ro: "Închiriază cu Încredere", en: "Rent with Confidence" },
    step3Desc: { ro: "Fiecare închiriere este protejată. Returnează produsul și lasă o recenzie când termini.", en: "Every rental is protected. Return the product and leave a review when you're done." },
  },
  footer: {
    description: { ro: "Platforma ta de încredere pentru închiriere. Găsește sau oferă orice ai nevoie.", en: "Your trusted rental platform. Find or offer anything you need." },
    explore: { ro: "Explorează", en: "Explore" },
    allCategories: { ro: "Toate Categoriile", en: "All Categories" },
    searchProducts: { ro: "Caută Produse", en: "Search Products" },
    outdoorAdventure: { ro: "Outdoor & Aventură", en: "Outdoor & Adventure" },
    publish: { ro: "Publică", en: "Publish" },
    addListing: { ro: "Adaugă Anunț", en: "Add Listing" },
    howItWorks: { ro: "Cum Funcționează", en: "How It Works" },
    pricing: { ro: "Prețuri", en: "Pricing" },
    support: { ro: "Suport", en: "Support" },
    helpCenter: { ro: "Centru de Ajutor", en: "Help Center" },
    contactUs: { ro: "Contactează-ne", en: "Contact Us" },
    terms: { ro: "Termeni și Condiții", en: "Terms & Conditions" },
    copyright: { ro: "ÎnchiriazăAcum. Toate drepturile rezervate.", en: "RentNow. All rights reserved." },
  },
  search_page: {
    title: { ro: "Rezultatele Căutării", en: "Search Results" },
    searchFor: { ro: (q: string) => `Căutare pentru: "${q}"`, en: (q: string) => `Search for: "${q}"` },
    allProducts: { ro: "Toate produsele disponibile", en: "All available products" },
    products: { ro: "Produse", en: "Products" },
    users: { ro: "Utilizatori", en: "Users" },
    userFound: { ro: (count: number) => `${count} ${count === 1 ? "utilizator găsit" : "utilizatori găsiți"}`, en: (count: number) => `${count} user${count !== 1 ? 's' : ''} found` },
    listings: { ro: (count: number) => `${count} ${count === 1 ? "anunț" : "anunțuri"} active`, en: (count: number) => `${count} active listing${count !== 1 ? 's' : ''}` },
    user: { ro: "Utilizator", en: "User" },
    filters: { ro: "Filtre", en: "Filters" },
    allCategoriesFilter: { ro: "Toate categoriile", en: "All categories" },
    applyFilters: { ro: "Aplică filtrele", en: "Apply filters" },
  },
  categories_page: {
    title: { ro: "Toate Categoriile", en: "All Categories" },
    subtitle: { ro: "Explorează toate cele 22 de categorii de produse pentru închiriat", en: "Explore all 22 product categories for rent" },
    searchPlaceholder: { ro: "Caută categorii sau subcategorii...", en: "Search categories or subcategories..." },
    subcategories: { ro: (count: number) => `${count} subcategorii`, en: (count: number) => `${count} subcategories` },
    noResults: { ro: "Nu am găsit categorii care să corespundă căutării tale.", en: "We couldn't find categories matching your search." },
  },
  auth: {
    login: { ro: "Autentificare", en: "Login" },
    register: { ro: "Înregistrare", en: "Register" },
    welcomeBack: { ro: "Bine ai revenit!", en: "Welcome back!" },
    loginSubtitle: { ro: "Introdu datele tale pentru a te autentifica", en: "Enter your details to log in" },
    createAccount: { ro: "Creează un cont", en: "Create an account" },
    registerSubtitle: { ro: "Completează formularul pentru a te înregistra", en: "Fill in the form to register" },
    email: { ro: "Email", en: "Email" },
    password: { ro: "Parolă", en: "Password" },
    confirmPassword: { ro: "Confirmă parola", en: "Confirm password" },
    fullName: { ro: "Nume complet", en: "Full name" },
    forgotPassword: { ro: "Ai uitat parola?", en: "Forgot password?" },
    loggingIn: { ro: "Se autentifică...", en: "Logging in..." },
    creatingAccount: { ro: "Se creează contul...", en: "Creating account..." },
    resetPassword: { ro: "Resetare parolă", en: "Reset password" },
    resetDescription: { ro: "Introdu adresa de email și îți vom trimite un link pentru resetarea parolei.", en: "Enter your email address and we'll send you a password reset link." },
    sendResetLink: { ro: "Trimite link de resetare", en: "Send reset link" },
    sending: { ro: "Se trimite...", en: "Sending..." },
    // Validation messages
    invalidEmail: { ro: "Email invalid", en: "Invalid email" },
    passwordMin: { ro: "Parola trebuie să aibă minim 6 caractere", en: "Password must be at least 6 characters" },
    nameMin: { ro: "Numele trebuie să aibă minim 2 caractere", en: "Name must be at least 2 characters" },
    passwordMismatch: { ro: "Parolele nu se potrivesc", en: "Passwords don't match" },
    // Toast messages
    loginError: { ro: "Eroare la autentificare", en: "Login error" },
    invalidCredentials: { ro: "Email sau parolă incorectă", en: "Invalid email or password" },
    loginSuccess: { ro: "Autentificare reușită", en: "Login successful" },
    welcomeBackToast: { ro: "Bine ai venit înapoi!", en: "Welcome back!" },
    registerError: { ro: "Eroare la înregistrare", en: "Registration error" },
    accountExists: { ro: "Un cont cu acest email există deja", en: "An account with this email already exists" },
    accountCreated: { ro: "Cont creat cu succes", en: "Account created successfully" },
    accountCreatedDesc: { ro: "Te-ai înregistrat cu succes!", en: "You have registered successfully!" },
    emailSent: { ro: "Email trimis", en: "Email sent" },
    checkInbox: { ro: "Verifică inbox-ul pentru link-ul de resetare a parolei.", en: "Check your inbox for the password reset link." },
    errorGeneric: { ro: "Eroare", en: "Error" },
  },
  checkout: {
    title: { ro: "Confirmă și plătește", en: "Confirm and pay" },
    complete: { ro: "Rezervare completă", en: "Booking complete" },
    noData: { ro: "Nu există date de rezervare.", en: "No booking data available." },
    choosePaymentTime: { ro: "Alege când plătești", en: "Choose when to pay" },
    payNow: { ro: (amount: number) => `Plătește ${amount} RON acum`, en: (amount: number) => `Pay ${amount} RON now` },
    payLater: { ro: "Plătește 0 RON acum", en: "Pay 0 RON now" },
    payLaterDesc: { ro: (amount: number, date: string) => `${amount} RON va fi debitat pe ${date}. Fără taxe suplimentare.`, en: (amount: number, date: string) => `${amount} RON will be charged on ${date}. No extra fees.` },
    messageToOwner: { ro: "Mesaj pentru proprietar", en: "Message to owner" },
    messageDesc: { ro: "Trimite un mesaj proprietarului pentru a te prezenta și a pune întrebări.", en: "Send a message to the owner to introduce yourself and ask questions." },
    paymentMethod: { ro: "Metodă de plată", en: "Payment method" },
    selectMethod: { ro: "Selectează metoda", en: "Select method" },
    selectPaymentDesc: { ro: "Selectează metoda de plată preferată pentru a finaliza rezervarea.", en: "Select your preferred payment method to complete the booking." },
    reviewReservation: { ro: "Verifică rezervarea", en: "Review reservation" },
    product: { ro: "Produs", en: "Product" },
    period: { ro: "Perioadă", en: "Period" },
    duration: { ro: "Durată", en: "Duration" },
    days: { ro: "zile", en: "days" },
    paymentMethodLabel: { ro: "Metodă plată", en: "Payment method" },
    bankCard: { ro: "Card bancar", en: "Bank card" },
    totalToPay: { ro: "Total de plată", en: "Total to pay" },
    termsNotice: { ro: "Prin finalizarea rezervării, accepți", en: "By completing the booking, you accept the" },
    termsLink: { ro: "Termenii și Condițiile", en: "Terms & Conditions" },
    privacyLink: { ro: "Politica de Confidențialitate", en: "Privacy Policy" },
    and: { ro: "și", en: "and" },
    checkIn: { ro: "Check-in", en: "Check-in" },
    checkOut: { ro: "Check-out", en: "Check-out" },
    payment: { ro: "Plată", en: "Payment" },
    sentTo: { ro: "Am trimis cererea ta pentru", en: "We sent your request for" },
    periodLabel: { ro: "Perioada", en: "Period" },
    durationLabel: { ro: "Durată", en: "Duration" },
    totalLabel: { ro: "Total", en: "Total" },
    requestSent: { ro: "Cerere trimisă", en: "Request sent" },
    requestSentDesc: { ro: "Cererea ta a fost trimisă proprietarului", en: "Your request has been sent to the owner" },
    waitingResponse: { ro: "Așteptare răspuns", en: "Waiting for response" },
    waitingResponseDesc: { ro: (name: string) => `${name} va răspunde în maxim 24 ore`, en: (name: string) => `${name} will respond within 24 hours` },
    confirmationStep: { ro: "Confirmare", en: "Confirmation" },
    confirmationDesc: { ro: "După acceptare, vei primi instrucțiuni de ridicare", en: "After acceptance, you'll receive pickup instructions" },
    viewRequest: { ro: "Vezi cererea", en: "View request" },
    continueSearching: { ro: "Continuă căutarea", en: "Continue searching" },
  },
  nearby: {
    listingsFrom: { ro: (city: string) => `Anunțuri din ${city}`, en: (city: string) => `Listings from ${city}` },
    similarListings: { ro: "Anunțuri similare", en: "Similar listings" },
  },
  productDetail: {
    authRequired: { ro: "Autentificare necesară", en: "Authentication required" },
    authRequiredDesc: { ro: "Te rugăm să te autentifici pentru a trimite mesaje.", en: "Please log in to send messages." },
    cantContact: { ro: "Nu poți contacta", en: "Cannot contact" },
    cantContactDesc: { ro: "Nu îți poți trimite mesaje ție.", en: "You can't send messages to yourself." },
    conversationError: { ro: "Nu s-a putut crea conversația.", en: "Could not create conversation." },
    week: { ro: "săptămână", en: "week" },
    month: { ro: "lună", en: "month" },
    untilLabel: { ro: "Până la", en: "Until" },
  },
  usageRules: {
    cancellation: { ro: "Politică de anulare", en: "Cancellation policy" },
    cancellationDesc: { ro: "Anulare gratuită cu până la 24 de ore înainte de începerea închirierii.", en: "Free cancellation up to 24 hours before the rental starts." },
    payment: { ro: "Plată", en: "Payment" },
    paymentDesc: { ro: "Plata se face în avans pentru a confirma rezervarea. Acceptăm card și transfer bancar.", en: "Payment is made in advance to confirm the booking. We accept card and bank transfer." },
    return: { ro: "Returnare", en: "Return" },
    returnDesc: { ro: "Produsul trebuie returnat în aceeași stare în care a fost primit.", en: "The product must be returned in the same condition as received." },
    depositReturn: { ro: "Garanția se returnează integral la predarea produsului în stare bună.", en: "The deposit is fully refunded upon returning the product in good condition." },
  },
  productIncludes: {
    item1: { ro: "Produs în stare perfectă de funcționare", en: "Product in perfect working condition" },
    item2: { ro: "Încărcător / accesorii standard", en: "Charger / standard accessories" },
    item3: { ro: "Husă de transport (dacă este cazul)", en: "Carrying case (if applicable)" },
    item4: { ro: "Manual de utilizare", en: "User manual" },
  },
  emptySearch: {
    noProducts: { ro: (q: string) => `Nu am găsit produse pentru "${q}". ${''} Încearcă termeni mai generali sau extinde zona de căutare`, en: (q: string) => `No products found for "${q}". Try broader terms or expand the search area` },
    noUsers: { ro: (q: string) => `Nu am găsit utilizatori pentru "${q}". Încearcă termeni mai generali sau extinde zona de căutare`, en: (q: string) => `No users found for "${q}". Try broader terms or expand the search area` },
    noProductsAvailable: { ro: "Nu există produse disponibile momentan.", en: "No products available at the moment." },
    noUsersAvailable: { ro: "Nu există utilizatori disponibili momentan.", en: "No users available at the moment." },
    exploreCategories: { ro: "Explorează toate categoriile", en: "Explore all categories" },
  },
  progressIndicator: {
    stepOf: { ro: (step: number, total: number) => `Pasul ${step} din ${total}`, en: (step: number, total: number) => `Step ${step} of ${total}` },
  },
});

// Type for the bilingual copy
type BilingualCopy = ReturnType<typeof createUxCopy>;

// Helper to resolve a bilingual value
type Language = "ro" | "en";

// Deep resolve: converts { ro, en } pairs to the selected language value
type ResolveLanguage<T, L extends Language> = T extends { ro: infer R; en: infer E }
  ? L extends "ro" ? R : E
  : T extends Record<string, any>
  ? { [K in keyof T]: ResolveLanguage<T[K], L> }
  : T;

function resolveLanguage<T>(obj: T, lang: Language): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // Check if this is a bilingual pair
  if ('ro' in (obj as any) && 'en' in (obj as any)) {
    return (obj as any)[lang];
  }
  
  // Recurse into nested objects
  const result: any = {};
  for (const key in obj as any) {
    result[key] = resolveLanguage((obj as any)[key], lang);
  }
  return result;
}

const bilingualCopy = createUxCopy();

// For backward compatibility - resolves to Romanian by default
export const uxCopy = resolveLanguage(bilingualCopy, 'ro') as ResolveLanguage<BilingualCopy, 'ro'>;

// Export the bilingual copy for the hook
export const uxCopyBilingual = bilingualCopy;

// Export the resolver
export { resolveLanguage };

export type UxCopyResolved = typeof uxCopy;
