UPDATE public.profiles
SET kyc_status = 'VERIFIED',
    kyc_level = 'LEVEL_1',
    kyc_last_verified_at = now(),
    phone_verified = true
WHERE email = 'rentli.tester+1786956801@gmail.com';