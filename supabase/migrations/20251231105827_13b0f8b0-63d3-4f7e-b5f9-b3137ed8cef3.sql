-- Add phone format validation constraint
ALTER TABLE profiles ADD CONSTRAINT phone_format 
CHECK (phone IS NULL OR (length(phone) <= 20 AND phone ~ '^[+0-9() -]+$'));