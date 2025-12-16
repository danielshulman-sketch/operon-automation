-- Migration: Add max_users column to organisations table
-- This migration adds subscription limits to organizations

-- Add max_users column with default value of 5
ALTER TABLE organisations 
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;

-- Update existing organizations to have a default of 5 users
UPDATE organisations 
SET max_users = 5 
WHERE max_users IS NULL;
