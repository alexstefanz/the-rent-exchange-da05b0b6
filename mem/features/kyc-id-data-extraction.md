---
name: KYC ID Data Extraction
description: Automatic OCR of Romanian ID cards (CNP, series, number, name, address) from KYC uploads, used in PVs
type: feature
---
After a user submits KYC, the `extract-id-data` edge function calls Lovable AI (google/gemini-2.5-flash) on the ID_FRONT/ID_BACK images and saves CNP, id_series, id_number, full_name, address, birth_date, issued_by, valid_until into `public.kyc_extracted_data` (one row per user, upsert on user_id). CNP is validated with the Romanian checksum (warning only, not blocking).

Admin sees a card in AdminKYCDetail with: extracted values, OCR confidence %, manual Edit, Re-extract, and Confirm/Unverify buttons. The `verified_by_admin` flag is informational; PVs always prefer extracted values over `fakeIdentity()` from `src/lib/pvContent.ts` as soon as they exist.

`get_rental_full_detail` returns owner_cnp/id_series/id_number/address + renter_* by left-joining kyc_extracted_data on owner_id/renter_id. `buildPvContent` and `PvSignatureDialog` use these fields with fakeIdentity as fallback.

RLS: admins full access, users see their own row only. Cross-party access (owner sees renter's CNP for PV) is exposed exclusively via security-definer RPCs `get_rental_full_detail` and `get_pv_identity_data(rental_id)` which check the caller is a rental participant.
