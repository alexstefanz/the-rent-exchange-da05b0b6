// Shared check: an account can only be deleted when every rental process is closed.
// deno-lint-ignore no-explicit-any
export async function getAccountDeletionBlocker(adminClient: any, userId: string): Promise<string | null> {
  const { count: activeCount } = await adminClient
    .from("rentals")
    .select("id", { count: "exact", head: true })
    .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
    .not("status", "in", "(completed,cancelled,rejected,expired)");
  if ((activeCount ?? 0) > 0) {
    return `Ai ${activeCount} închirieri în desfășurare. Contul poate fi șters doar după finalizarea tuturor închirierilor.`;
  }

  const { count: disputeCount } = await adminClient
    .from("rentals")
    .select("id", { count: "exact", head: true })
    .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
    .eq("dispute_status", "open");
  if ((disputeCount ?? 0) > 0) {
    return "Ai o dispută deschisă. Contul poate fi șters doar după soluționarea ei.";
  }

  const { data: ledger } = await adminClient.from("wallet_ledger").select("amount").eq("user_id", userId);
  const balance = (ledger ?? []).reduce((s: number, r: { amount: number }) => s + Number(r.amount || 0), 0);
  if (balance > 0.009) {
    return "Ai sold disponibil. Retrage banii înainte de ștergerea contului.";
  }
  return null;
}
