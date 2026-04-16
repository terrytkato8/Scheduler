-- Migration 010: Add category and subcategory to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category    text DEFAULT 'General';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS subcategory text;
