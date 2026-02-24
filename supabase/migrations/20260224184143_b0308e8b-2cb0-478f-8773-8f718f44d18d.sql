
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage categories" ON platform_categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON platform_categories;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can manage categories"
  ON platform_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active categories"
  ON platform_categories
  FOR SELECT
  USING (is_active = true);

-- Same fix for platform_subcategories
DROP POLICY IF EXISTS "Admins can manage subcategories" ON platform_subcategories;
DROP POLICY IF EXISTS "Anyone can view active subcategories" ON platform_subcategories;

CREATE POLICY "Admins can manage subcategories"
  ON platform_subcategories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active subcategories"
  ON platform_subcategories
  FOR SELECT
  USING (is_active = true);
