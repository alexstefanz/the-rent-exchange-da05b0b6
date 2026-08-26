import { containsProfanity } from "@/lib/profanityFilter";

export const TICKET_TITLE_MIN = 8;
export const TICKET_TITLE_MAX = 120;
export const TICKET_DESCRIPTION_MIN = 30;
export const TICKET_DESCRIPTION_MAX = 5000;
export const TICKET_REPLY_MIN = 3;
export const TICKET_REPLY_MAX = 500;

export type TicketValidationError =
  | "TITLE_TOO_SHORT"
  | "TITLE_TOO_LONG"
  | "DESCRIPTION_TOO_SHORT"
  | "DESCRIPTION_TOO_LONG"
  | "REPLY_TOO_SHORT"
  | "REPLY_TOO_LONG"
  | "PROFANITY";

export function validateTicketContent(
  title: string,
  description: string,
): TicketValidationError | null {
  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  if (cleanTitle.length < TICKET_TITLE_MIN) return "TITLE_TOO_SHORT";
  if (cleanTitle.length > TICKET_TITLE_MAX) return "TITLE_TOO_LONG";
  if (cleanDescription.length < TICKET_DESCRIPTION_MIN) return "DESCRIPTION_TOO_SHORT";
  if (cleanDescription.length > TICKET_DESCRIPTION_MAX) return "DESCRIPTION_TOO_LONG";
  if (containsProfanity(`${cleanTitle} ${cleanDescription}`).hit) return "PROFANITY";
  return null;
}

export function validateTicketReply(text: string): TicketValidationError | null {
  const cleanText = text.trim();
  if (cleanText.length < TICKET_REPLY_MIN) return "REPLY_TOO_SHORT";
  if (cleanText.length > TICKET_REPLY_MAX) return "REPLY_TOO_LONG";
  if (containsProfanity(cleanText).hit) return "PROFANITY";
  return null;
}

export function ticketValidationMessage(
  error: TicketValidationError,
  language: "ro" | "en" = "ro",
): string {
  const messages: Record<TicketValidationError, { ro: string; en: string }> = {
    TITLE_TOO_SHORT: {
      ro: `Subiectul trebuie să aibă minimum ${TICKET_TITLE_MIN} caractere.`,
      en: `The subject must contain at least ${TICKET_TITLE_MIN} characters.`,
    },
    TITLE_TOO_LONG: {
      ro: `Subiectul poate avea maximum ${TICKET_TITLE_MAX} caractere.`,
      en: `The subject can contain at most ${TICKET_TITLE_MAX} characters.`,
    },
    DESCRIPTION_TOO_SHORT: {
      ro: `Descrierea trebuie să aibă minimum ${TICKET_DESCRIPTION_MIN} de caractere.`,
      en: `The description must contain at least ${TICKET_DESCRIPTION_MIN} characters.`,
    },
    DESCRIPTION_TOO_LONG: {
      ro: `Descrierea poate avea maximum ${TICKET_DESCRIPTION_MAX} de caractere.`,
      en: `The description can contain at most ${TICKET_DESCRIPTION_MAX} characters.`,
    },
    REPLY_TOO_SHORT: {
      ro: `Răspunsul trebuie să aibă minimum ${TICKET_REPLY_MIN} caractere.`,
      en: `The reply must contain at least ${TICKET_REPLY_MIN} characters.`,
    },
    REPLY_TOO_LONG: {
      ro: `Răspunsul poate avea maximum ${TICKET_REPLY_MAX} de caractere.`,
      en: `The reply can contain at most ${TICKET_REPLY_MAX} characters.`,
    },
    PROFANITY: {
      ro: "Textul conține limbaj nepotrivit. Reformulează înainte de trimitere.",
      en: "The text contains inappropriate language. Please rephrase it before submitting.",
    },
  };
  return messages[error][language];
}