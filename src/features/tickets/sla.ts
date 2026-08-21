/**
 * SLA helpers — Rentli support runs on an asynchronous ticket system with a
 * guaranteed first response within 48 hours (no live chat, no permanent presence).
 */

export const SLA_RESPONSE_HOURS = 48;

export type SlaState = "answered" | "on_track" | "due_soon" | "breached";

export interface SlaInfo {
  state: SlaState;
  dueAt: Date | null;
  hoursLeft: number | null;
}

export const getSlaDueDate = (ticket: {
  sla_due_at?: string | null;
  created_at?: string | null;
}): Date | null => {
  if (ticket.sla_due_at) return new Date(ticket.sla_due_at);
  if (ticket.created_at) {
    return new Date(new Date(ticket.created_at).getTime() + SLA_RESPONSE_HOURS * 3_600_000);
  }
  return null;
};

export const getSlaInfo = (
  ticket: {
    sla_due_at?: string | null;
    created_at?: string | null;
    first_response_at?: string | null;
    status?: string | null;
  },
  now: Date = new Date(),
): SlaInfo => {
  const dueAt = getSlaDueDate(ticket);
  if (ticket.first_response_at || ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    return { state: "answered", dueAt, hoursLeft: null };
  }
  if (!dueAt) return { state: "on_track", dueAt: null, hoursLeft: null };
  const hoursLeft = (dueAt.getTime() - now.getTime()) / 3_600_000;
  if (hoursLeft <= 0) return { state: "breached", dueAt, hoursLeft };
  if (hoursLeft <= 12) return { state: "due_soon", dueAt, hoursLeft };
  return { state: "on_track", dueAt, hoursLeft };
};

export const formatSlaDeadline = (dueAt: Date | null, language: string): string => {
  if (!dueAt) return "";
  return dueAt.toLocaleString(language === "ro" ? "ro-RO" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const slaLabel = (info: SlaInfo, language: string): string => {
  const ro = language === "ro";
  const deadline = formatSlaDeadline(info.dueAt, language);
  switch (info.state) {
    case "answered":
      return ro ? "Echipa a răspuns" : "Team replied";
    case "breached":
      return ro ? "Termen de răspuns depășit" : "Response deadline passed";
    case "due_soon":
      return ro ? `Răspuns până la ${deadline}` : `Reply due by ${deadline}`;
    default:
      return ro ? `Răspundem până la ${deadline}` : `We reply by ${deadline}`;
  }
};

export const SLA_PROMISE = {
  ro: "Răspundem la fiecare tichet în maximum 48 de ore.",
  en: "We answer every ticket within 48 hours.",
};
