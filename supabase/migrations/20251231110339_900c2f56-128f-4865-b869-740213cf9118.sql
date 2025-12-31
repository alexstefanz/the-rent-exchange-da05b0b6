-- Add database-level validation constraints for products table
ALTER TABLE products ADD CONSTRAINT title_length CHECK (length(title) BETWEEN 5 AND 100);
ALTER TABLE products ADD CONSTRAINT description_length CHECK (description IS NULL OR length(description) <= 2000);
ALTER TABLE products ADD CONSTRAINT valid_price CHECK (daily_price_owner > 0 AND daily_price_owner < 1000000);
ALTER TABLE products ADD CONSTRAINT valid_fee_percent CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100);

-- Add length constraints for location fields
ALTER TABLE products ADD CONSTRAINT location_city_length CHECK (location_city IS NULL OR length(location_city) <= 100);
ALTER TABLE products ADD CONSTRAINT location_country_length CHECK (location_country IS NULL OR length(location_country) <= 100);
ALTER TABLE products ADD CONSTRAINT category_length CHECK (category IS NULL OR length(category) <= 100);
ALTER TABLE products ADD CONSTRAINT subcategory_length CHECK (subcategory IS NULL OR length(subcategory) <= 100);

-- Add full_name length constraint to profiles
ALTER TABLE profiles ADD CONSTRAINT full_name_length CHECK (full_name IS NULL OR length(full_name) <= 100);