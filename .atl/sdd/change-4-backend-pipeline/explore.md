# Exploration: Backend Pipeline Integration (CHANGE 4)

## Current State

CHANGE 1, 2, 3 están implementados y testeados (>85% coverage) pero **NO integrados** en la aplicación:

| CHANGE | Service | Status |
|--------|---------|--------|
| 1 | SupabaseMCPClient | ✅ Implemented, tested |
| 2 | BackendRequirementsAnalyzer | ✅ Implemented, tested |
| 3 | SQLGenerator | ✅ Implemented, tested |

**Pipeline esperado** (no existente):
```
Gemini → React Code → BackendRequirementsAnalyzer → SQLGenerator → SupabaseMCPClient → Supabase Backend
```

**Flujo actual**:
```
Gemini → React Code → WebContainer (preview)
```

## Affected Areas

- `src/pages/BuilderPage.tsx` — Entry point actual del builder, donde se dispara la generación de código
- `src/hooks/useAIBuilder.ts` — Hook que usa AIOrchestrator para generar código, lugar natural para integrar el pipeline
- `src/services/ai/AIOrchestrator.ts` — Generación de código via Gemini
- `src/contexts/SettingsContext.tsx` — Manejo de API keys (ya implementado)
- `src/hooks/useSupabase.ts` — Hook existente pero solo para Supabase client, NO para OAuth/MCP

## Approaches

### Option 1: Hook `useBackendCreation` (RECOMMENDED)

Crear un nuevo hook que orqueste el pipeline completo:
- Input: código generado + accessToken OAuth
- Estados: idle → analyzing → generating → migrating → ready → error
- Output: SupabaseProject con credenciales

```typescript
// src/hooks/useBackendCreation.ts
interface BackendCreationState {
  stage: 'idle' | 'analyzing' | 'generating' | 'migrating' | 'ready' | 'error';
  project: SupabaseProject | null;
  error: Error | null;
  progress: number; // 0-100
}

function useBackendCreation() {
  // Estados separados por stage para UI granular
  // Retry automático para MCP
  // Persistencia de credenciales en memoria
}
```

**Pros**:
- Separación limpia de responsabilidades
- Reusable en múltiples lugares
- Estados granulares para UI feedback
- Facilita testing

**Cons**:
- Más archivos a crear
- Requiere estado en React

**Effort**: Medium

---

### Option 2: Servicio `BackendOrchestrator` (Singleton)

Crear clase singleton que centralice el pipeline:
```typescript
// src/services/backend/BackendOrchestrator.ts
class BackendOrchestrator {
  async createBackend(code: string, accessToken: string): Promise<SupabaseProject>
}
```

**Pros**:
- Simple de usar
- Singleton ya común en el proyecto (AIOrchestrator)
- Menos cambio en componentes

**Cons**:
- Acoplamiento alto con servicios
- Difícil de testar
- No estados React (no hay loading states)

**Effort**: Low

---

### Option 3: Extender `useAIBuilder` existentes

Agregar método `createBackend` al hook useAIBuilder:
```typescript
// En src/hooks/useAIBuilder.ts
function useAIBuilder() {
  return { generate, createBackend, ... }
}
```

**Pros**:
- Minimal change
- Flujo unificado

**Cons**:
- Hook hace dos cosas (生成 código + crear backend)
- Alto acoplamiento
- Violates single responsibility

**Effort**: Low (pero arquitectura cuestionable)

---

### Option 4: Nuevo Componente UI + Contexto

Crear `BackendCreationContext` + componente modal/panel:
- Similar a SettingsModal existente
- Mayor cambio en UI pero más control

**Pros**:
- Full control UI
- Experiencia de usuario dedicada

**Cons**:
- Mucho cambio
- Paralelismo con SettingsContext

**Effort**: High

## Recommendation

**Option 1: Hook `useBackendCreation`**

**Por qué**:
1. El proyecto ya usa hooks para lógica de negocio (useAIBuilder, useSupabase, useWebContainer)
2. Estados granulares son necesarios para UI feedback
3. Séparation of concerns clara
4. Facilita testing y evolución futura

**Arquitectura propuesta**:
```
[BuilderPage.tsx]
       ↓
[useAIBuilder] → Código generado
       ↓
[useBackendCreation hook]
       ├──→ BackendRequirementsAnalyzer.analyze(code)
       ├──→ SQLGenerator.generate(requirements)
       ├──→ SupabaseMCPClient.createProject()
       └──→ SupabaseMCPClient.applyMigration()
       ↓
[SupabaseProject + credenciales]
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
├─────────────────────────────────────────────────────────────────────┤
│  BuilderPage.tsx                                                      │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────┐     ┌──────────────────────────────────────┐  │
│  │ useAIBuilder    │────▶│ AIOrchestrator.generateApp()          │  │
│  │ (genera código) │     └──────────────────────────────────────┘  │
│  └─────────────────┘                     │                            │
│       │                                ▼                            │
│       ▼                   ┌─────────────────────────────────────┐   │
│  ┌─────────────────────┐  │ useBackendCreation (NUEVO)         │   │
│  │ ProjectFile[]       │  │                                     │   │
│  │ (código generado)  │  │ Stage 1: analyze()                 │   │
│  └─────────────────────┘  │   ├─ BackendRequirementsAnalyzer    │   │
│       │                   │   │  Input: code string             │   │
│       ▼                   │   │  Output: BackendRequirements   │   │
│  ┌─────────────────────┐  │   └──────────────────────────────┘  │
│  │ Prompt para crear  │  │              │                         │
│  │ "Create Backend"   │  │              ▼                         │   │
│  └─────────────────────┘  │   Stage 2: generate()               │   │
│       │                   │   ├─ SQLGenerator                  │   │
│       ▼                   │   │  Input: BackendRequirements      │   │
│  ┌─────────────────────┐  │   │  Output: MigrationResult       │   │
│  │ accessToken        │  │   └──────────────────────────────┘  │
│  │ (OAuth Supabase)   │  │              │                         │
│  └─────────────────────┘  │              ▼                         │
│       │                   │   Stage 3: createProject()          │
│       ▼                   │   ├─ SupabaseMCPClient             ���
│  ┌─────────────────────┐  │   │  Input: name, region         │   │
│  │ useBackendCreation  │  │   │  Output: SupabaseProject     │   │
│  │ hook + accessToken │  │   └──────────────────────────────┘  │
│  └─────────────────────┘  │              │                         │
│       │                   │              ▼                         │
│       ▼                   │   Stage 4: applyMigration()        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  PIPELINE ORQUESTADO                         │   │
│  │                                                             │   │
│  │  code:string ──▶ BackendRequirements ──▶ Migration      │   │
│  │       │                 │                    │               │   │
│  │  (React/TS)         ▼                    ▼               │   │
│  │  files         Analyzer              SQL Generator         │   │
│  │                    │                    │                   │   │
│  │                    └────────┬─────────┘                   │   │
│  │                             ▼                              │   │
│  │                  SupabaseProject                         │   │
│  │                  + applyMigration()                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SupabaseProject {                                         │   │
│  │    ref: 'abc123',                                        │   │
│  │    name: 'my-app',                                        │   │
│  │    apiUrl: 'https://...supabase.co',                      │   │
│  │    anonKey: 'eyJ...'                                      │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

### Stage-by-Stage Error Handling

| Stage | Error | Strategy | UI Feedback |
|-------|-------|----------|-------------|
| 1. Analyze | Invalid code | Return empty requirements | "No backend detected" |
| 2. Generate | SQL gen error | Throw, no recovery | "Schema generation failed" |
| 3. Create Project | Auth/409 error | Retry with fallback | Project exists, retrying... |
| 4. Apply Migration | SQL error | Log, suggest manual review | "Migration failed, review SQL" |

### Partial Failure Scenarios

1. **Analyzer OK + Generator OK + MCP fails**:
   - Mostrar SQL generado para review manual
   - Opción de reintentar MCP

2. **Project exists (409)**:
   - Append suffix automático (ya implementado en MCP)
   - Si falla, listar proyectos existentes

### Retry Logic

- MCP createProject: 5 intentos con suffix automático
- MCP applyMigration: 3 intentos (sin retry automático, risky)
- MCP getProjectUrl/getAnonKey: 3 intentos con backoff

## State Management Needs

### What State to Track

1. **Backend Creation State** (en el hook):
   ```typescript
   type BackendCreationStage = 
     | 'idle'
     | 'analyzing'      // 0-25%
     | 'generating'     // 25-50%
     | 'creating'       // 50-75%
     | 'migrating'     // 75-99%
     | 'ready'
     | 'error';
   ```

2. **Supabase Project Credentials** (en memoria, nunca localStorage):
   ```typescript
   interface CreatedProject {
     ref: string;
     name: string;
     apiUrl: string;
     anonKey: string;
     createdAt: string;
   }
   ```

3. **OAuth Access Token**:
   - NO almacenar en localStorage (SEC-01)
   - Obtener de SettingsContext o flujo OAuth separado
   - Limitar vida del token

### State Storage

- **En memoria** (React state): Credenciales del proyecto
- **Context**: Podría usar SettingsContext existente o crear BackendContext
- **localStorage**: NUNCA para credenciales (viola Security Rules)

## UI/UX Considerations

### User Flow

1. Usuario genera código de app
2. App detecta necesidades backend (entities, auth, storage)
3. UI muestra notificación: "Backend detected - Create Supabase?"
4. Usuario hace click en "Create Backend"
5. Si no hay OAuth token, pedir login con Supabase
6. Progress bar por cada stage
7. Al completar, mostrar credenciales
8. Opción de copiar .env template

### Loading States

Cada stage necesita feedback visual:
- **Analyzing**: "Detecting backend requirements..."
- **Generating**: "Generating schema..."
- **Creating**: "Creating Supabase project..."
- **Migrating**: "Applying schema to database..."

### Error States

- Mostrar en qué stage falló
- Qué mensaje de error返回
- Opciones de retry o manual

### Component Suggestions

Opción A: Modificar ChatPanel para incluir botón "Create Backend"
Opción B: Nuevo botón en TopBar (cerca de Settings)
Opción C: Modal de confirmación tras generación exitosa

## Security Considerations

### OAuth Token Handling

- **REGLA**: token en memoria, nunca en localStorage
- Verificar token válido antes de cada request
- Clear token en beforeunload (ya en SettingsContext)

### API Keys

- API key de Supabase MCP en configuración
- Anon key expuesta al usuario (OK, es para frontend)
- Service key NUNCA expuesta (solo server-side)

### Code Input

- El código del usuario es trustworthy
- No sanitizar para el analyzer (es análisis estático)
- SQL output sí sanitizar antes de enviar a Supabase

## Open Questions

### Para Decisión del Usuario

1. **Trigger del Pipeline**:
   - Auto-detectar y preguntar?
   - Solo manual via botón?
   - Ambos?

2. **Acceso OAuth**:
   - Usar SettingsContext existente?
   - Nuevo flujo OAuth separado (login Supabase)?

3. **UI Integration**:
   - Botón en ChatPanel?
   - Botón en TopBar?
   - Modal tras generación?

4. **Gestión de Proyectos**:
   - Crear proyecto nuevo siempre?
   - Permitir seleccionar proyecto existente?
   - Ambos?

5. **Exposición de Credenciales**:
   - Mostrar en modal para copiar?
   - Descargar .env file?
   - Ambos?

### Dependencias Externas

1. **Supabase OAuth Flow**:
   - Currently no hay login con Supabase
   - Requiere implementar OAuth flow?
   - O usar token existente?

2. **WebContainer vs Backend**:
   - Corren en paralelo (WebContainer preview + Supabase backend)
   - Son ortogonales

## Files to Create

Basado en Option 1 (hook approach):

```
src/
├── hooks/
│   └── useBackendCreation.ts      (NUEVO - hook principal)
├── services/
│   └── backend/
│       └── BackendOrchestrator.ts (NUEVO - optional wrapper)
├── components/
│   └── backend/
│       ├── BackendPanel.tsx       (NUEVO - UI optional)
│       └── BackendCredentials.tsx (NUEVO - display creds)
└── contexts/
    └── BackendContext.tsx         (NUEVO - opcional)
```

## Next Steps

1. **Crear proposal** (sdd-propose) con la approach recomendada
2. **Spec** (sdd-spec) con requerimientos detallados
3. **Design** (sdd-design) con arquitectura del hook
4. **Tasks** (sdd-tasks) con breakdown de implementación

## Ready for Proposal

**Sí** — La exploración está completa. Tengo suficiente información para crear el proposal formal.

La recomendación es clara: crear hook `useBackendCreation` que orqueste el pipeline Analyzer → SQL → MCP.