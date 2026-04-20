/**
 * Expected SQL patterns and MigrationResult objects
 * CHANGE 4 - Backend Pipeline Integration
 */

import type { MigrationResult } from '../../services/sql/types';

/**
 * SQL regex patterns for validation in tests
 */
export const EXPECTED_SQL_PATTERNS = {
  /**
   * CREATE TABLE statement pattern
   */
  tableCreation: /CREATE TABLE IF NOT EXISTS \w+/,

  /**
   * UUID extension pattern
   */
  uuidExtension: /CREATE EXTENSION IF NOT EXISTS "uuid-ossp"/,

  /**
   * Row Level Security enable pattern
   */
  rlsEnable: /ALTER TABLE \w+ ENABLE ROW LEVEL SECURITY/,

  /**
   * Storage bucket insertion pattern
   */
  storageBucket: /INSERT INTO storage\.buckets/,

  /**
   * Foreign key reference pattern
   */
  foreignKey: /REFERENCES \w+\(\w+\)/,
};

/**
 * Sample MigrationResult objects for testing
 */
export const EXPECTED_MIGRATIONS: {
  simpleUser: MigrationResult;
  withAuth: MigrationResult;
  withStorage: MigrationResult;
  complex: MigrationResult;
} = {
  /**
   * Migration for simple user entity
   */
  simpleUser: {
    sql: `-- Migration: Create users table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);
`,
    tables: ['users'],
    warnings: [],
  },

  /**
   * Migration with auth requirements
   */
  withAuth: {
    sql: `-- Migration: Create users table with auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Auth is handled by Supabase Auth service
-- This table extends the auth.users with additional fields
`,
    tables: ['users'],
    warnings: ['Auth detected - using Supabase built-in auth service'],
  },

  /**
   * Migration with storage requirements
   */
  withStorage: {
    sql: `-- Migration: Setup storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images-bucket', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
`,
    tables: [],
    warnings: ['Storage bucket created - configure file size limits in dashboard'],
  },

  /**
   * Migration for complex app with multiple entities
   */
  complex: {
    sql: `-- Migration: Create blog schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
`,
    tables: ['users', 'posts', 'comments'],
    warnings: [
      'Foreign key relationships detected - cascade delete enabled',
      'Indexes created for foreign key columns',
    ],
  },
};

export default EXPECTED_MIGRATIONS;
