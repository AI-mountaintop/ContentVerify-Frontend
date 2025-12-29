-- =============================================================================
-- DIAGNOSTIC & FIX SCRIPT
-- Run this in Supabase SQL Editor to diagnose and fix the signup issue
-- =============================================================================

-- STEP 1: Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- STEP 2: Check if users table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';
