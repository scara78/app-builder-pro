/**
 * Script para crear tablas iniciales en Supabase
 * Ejecutar con: npx ts-node scripts/setup-database.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '[REDACTED-supabase-url]';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '[REDACTED-jwt]';

const supabase = createClient(supabaseUrl, supabaseKey);

const SQL = `
-- Tabla para proyectos creados
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  region TEXT DEFAULT 'us-east-1',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para componentes generados
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT DEFAULT 'typescript',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de seguridad (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Enable all access" ON projects;
DROP POLICY IF EXISTS "Enable all access" ON components;

-- Crear políticas nuevas
CREATE POLICY "Enable all access" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON components FOR ALL USING (true) WITH CHECK (true);
`;

async function setupDatabase() {
  console.log('🔧 Configurando base de datos...\n');
  console.log('URL:', supabaseUrl);
  console.log('');

  try {
    // Ejecutar SQL usando la función rpc o directamente
    // Como no tenemos una función RPC personalizada, usamos el método de query
    const { error } = await supabase.rpc('exec_sql', { sql: SQL });
    
    if (error) {
      console.log('⚠️  Nota: Usando método alternativo (SQL Editor manual)');
      console.log('\n📋 Por favor, copiá este SQL y ejecutalo en el SQL Editor de Supabase:\n');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(SQL);
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📍 Instrucciones:');
      console.log('   1. Andá a https://supabase.com/dashboard');
      console.log('   2. Seleccioná tu proyecto');
      console.log('   3. SQL Editor → New query');
      console.log('   4. Pegá el SQL de arriba');
      console.log('   5. Click en Run');
    } else {
      console.log('✅ Tablas creadas exitosamente');
    }
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

setupDatabase();
