-- Add superadmin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false;

-- Create first superadmin (update with your email after running)
-- UPDATE users SET is_superadmin = true WHERE email = 'your-email@example.com';
