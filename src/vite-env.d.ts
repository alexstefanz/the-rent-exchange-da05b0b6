/// <reference types="vite/client" />

interface CookiebotConsent {
  necessary: boolean;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}

interface CookiebotApi {
  consent: CookiebotConsent;
  consented: boolean;
  renew: () => void;
  show: () => void;
  hide: () => void;
  withdraw: () => void;
}

declare global {
  interface Window {
    Cookiebot?: CookiebotApi;
  }
}

export {};

