# Spec: Backend Requirements Analyzer

## CHANGE 2 - Backend Requirements Analyzer

**Artifact Store Mode**: openspec
**Status**: SPEC_COMPLETE
**Created**: 2026-04-17

---

## 1. Purpose

### What This Component Does

El **Backend Requirements Analyzer** es un componente que analiza código React generado automáticamente para detectar qué recursos de backend necesita la aplicación: entidades de base de datos, autenticación, almacenamiento de archivos, y operaciones CRUD.

### Why It Matters for App Builder Pro

Permite que App Builder Pro cree automáticamente el backend de Supabase con un solo clic, basándose en el código React que el usuario ya tiene. Sin esto, el usuario tendría que especificar manualmente qué tablas, auth y storage necesita. Con el analyzer, detectamos estos requerimientos automáticamente y los pasamos al SupabaseMCPClient (CHANGE 1) para generar las migrations.

---

## 2. Requirements

**Requirements ID**: REQ-BRA-{number}

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Detectar entidades desde TypeScript interfaces | MUST |
| R2 | Detectar requerimientos de auth desde patrones de usuario (login, register, user profile) | MUST |
| R3 | Detectar storage desde patrones de upload de archivos | MUST |
| R4 | Detectar operaciones CRUD desde form handlers | MUST |
| R5 | Proveer confidence scoring para cada detección | MUST |
| R6 | Soportar análisis híbrido: pattern matching + AI fallback | SHOULD |
| R7 | Cachear resultados para performance | SHOULD |

---

## 3. BackendRequirements Interface

```typescript
export interface Entity {
  /** Nombre de la entidad detectada (e.g., "User", "Product", "Order") */
  name: string;
  /** Tipo de dato de la entidad */
  typeName: string;
  /** Campos detectados con sus tipos */
  fields: EntityField[];
  /** Confidence score: 0-100 */
  confidence: number;
  /** Tipo de match: pattern | ai */
  matchType: 'pattern' | 'ai';
}

export interface EntityField {
  name: string;
  type: string;
  isOptional: boolean;
}

export interface CRUDSOperation {
  /** Entidad relacionada */
  entity: string;
  /** Tipo de operación */
  operation: 'create' | 'read' | 'update' | 'delete';
  /** Tipo de código que realizó la detección */
  triggerPattern: string;
  /** Confidence score: 0-100 */
  confidence: number;
}

export interface AuthRequirement {
  /** Tipo de requerimiento de auth */
  type: 'login' | 'register' | 'profile' | 'logout' | 'password-reset';
  /** Patrón que detectó el requerimiento */
  triggerPattern: string;
  /** Campos de usuario relacionados */
  userFields?: string[];
  /** Confidence score: 0-100 */
  confidence: number;
}

export interface StorageRequirement {
  /** Tipo de contenido a almacenar */
  contentType: 'image' | 'document' | 'video' | 'audio' | 'any';
  /** Tamaño máximo esperado en MB */
  maxSizeMB?: number;
  /** Bucket name sugerido */
  bucketName?: string;
  /** Patrón que detectó el requerimiento */
  triggerPattern: string;
  /** Confidence score: 0-100 */
  confidence: number;
}

export interface BackendRequirements {
  /** Entidades de base de datos detectadas */
  entities: Entity[];
  /** Indica si se detectó necesidad de auth */
  hasAuth: boolean;
  /** Requerimientos de autenticación */
  authRequirements?: AuthRequirement[];
  /** Indica si se detectó necesidad de storage */
  hasStorage: boolean;
  /** Requerimientos de storage */
  storageRequirements?: StorageRequirement[];
  /** Operaciones CRUD detectadas */
  crudOperations: CRUDSOperation[];
  /** Nivel de confidence general: 0-100 */
  overallConfidence: number;
  /** Método de análisis Used: pattern | hybrid */
  analysisMethod: 'pattern' | 'hybrid';
  /** Timestamp del análisis */
  analyzedAt: string;
}
```

---

## 4. Scenarios (Gherkin Format)

### Scenario 1: Detectar entidad User desde interface TypeScript

**Scenario**: Detectar entidad de base de datos desde interfaz TypeScript

```
GIVEN un componente React con una interface TypeScript "User"
WHEN el analyzer procesa el código
THEN debe detectar la entidad "User"
AND debe extraer los campos: id, email, name, createdAt
AND debe asignar confidence >= 80
```

**Testable**: YES - Unit test con código de ejemplo

---

### Scenario 2: Detectar requerimiento de auth desde login form

**Scenario**: Detectar requerimiento de autenticación desde formulario de login

```
GIVEN un componente React con un formulario de login
WHEN el analyzer procesa el código
THEN debe detectar requerimiento de auth tipo "login"
AND debe asignar confidence >= 85
AND debe marcar hasAuth = true
```

**Testable**: YES - Unit test con código de ejemplo

---

### Scenario 3: Detectar requerimiento de storage desde file upload

**Scenario**: Detectar requerimiento de storage desde componente de upload

```
GIVEN un componente React con input type="file" o Dropzone
WHEN el analyzer procesa el código
THEN debe detectar requerimiento de storage
AND debe detectar tipo de contenido ("image" si es preview)
AND debe marcar hasStorage = true
AND debe asignar confidence >= 80
```

**Testable**: YES - Unit test con código de ejemplo

---

### Scenario 4: Usar AI fallback cuando confidence es bajo

**Scenario**: Usar AI fallback cuando pattern matching no tiene suficiente confidence

```
GIVEN código ambiguo donde pattern matching tiene confidence < 50
WHEN el analyzer procesa el código con hybrid mode
THEN debe invocar al AI fallback (AIOrchestrator)
AND debe combinar resultados de pattern + AI
AND debe retornar overallConfidence mejorada
AND debe marcar analysisMethod = "hybrid"
```

**Testable**: YES - Integration test mockeando AIOrchestrator

---

### Scenario 5: Retornar resultado cacheado cuando se re-analiza el mismo código

**Scenario**: Usar cache para evitar re-análisis innecesario

```
GIVEN un análisis previo cacheado de código específico
WHEN se solicita re-análisis del mismo código
THEN debe retornar el resultado cacheado instantáneamente
AND no debe invocar pattern matching ni AI
AND debe marcar análisis como "cached"
```

**Testable**: YES - Unit test con mock de cache

---

## 5. Pattern Definitions

### 5.1 Entity Detection Patterns

#### R1: TypeScript Interface → Entity

| Pattern | Regex | Confidence |
|---------|-------|------------|
| interface declaration | `interface\s+(\w+)\s*\{` | 90 |
| type alias object | `type\s+(\w+)\s*=\s*\{` | 85 |
| export interface | `export\s+interface\s+(\w+)` | 95 |
| zod schema | `z\.object\(\{` | 80 |

**Field Extraction**:
- Simple: `(\w+)\??:\s*(\w+)\??;`
- Array: `(\w+)\??:\s*(\w+)\[\];`
- Optional: `(\w+)\??:\s*\w+<(\w+)>;`

---

### R2: Auth Requirement Patterns

| Pattern | Regex | Confidence |
|---------|-------|------------|
| login form | `<form[^>]*onSubmit=\{.*login` | 90 |
| login function | `handleLogin\|onLogin\|submitLogin` | 85 |
| register | `handleRegister\|onRegister\|signUp` | 90 |
| auth context | `useAuth\(\)\|AuthContext` | 95 |
| user state | `user\|currentUser` | 70 |
| auth provider | `<AuthProvider` | 95 |

---

### R3: Storage Requirement Patterns

| Pattern | Regex | Confidence |
|---------|-------|------------|
| file input | `<input\s+type="file"` | 85 |
| dropzone | `Dropzone\|react-dropzone` | 90 |
| file reader | `FileReader\|readAsDataURL` | 80 |
| s3/upload | `upload\|s3\|storage` | 75 |
| image preview | `URL\.createObjectURL` | 80 |
| blob | `new\s+Blob\(` | 85 |

---

### R4: CRUD Operation Patterns

| Pattern | Regex | Operation | Confidence |
|---------|-------|-----------|------------|
| create form | `onSubmit.*create\|handleCreate` | create | 85 |
| form (generic) | `<form[^>]*onSubmit` | create | 70 |
| list/grid | `useQuery.*\|\.map\(.*\)` | read | 80 |
| get/fetch | `fetch\|getBy\|findBy` | read | 85 |
| update form | `handleUpdate\|onEdit` | update | 85 |
| delete | `handleDelete\|onDelete\|remove` | delete | 90 |
| save | `handleSave\|onSave` | create/update | 75 |

---

### 5.2 Confidence Calculation Rules

```
Pattern Confidence:
- Base: 80
- Modifiers:
  - +10: export keyword presente
  - +5: contexto de tipo claro (User, Product, etc.)
  - -10: nombre genérico (Item, Data, Obj)
  - -20: múltiples posible matches (confuso)

AI Fallback:
- Solo usar si avg pattern confidence < 50
- Combinar: (pattern_avg * 0.4) + (ai_confidence * 0.6)
- Timeout: 3000ms max

Final Confidence:
- entity: max(field_confidences) - 10 por campo faltante
- auth: avg(all_auth_patterns) * 1.1 (cap at 100)
- storage: max(storage_patterns)
- overall: weighted avg de todos los detections
```

---

## 6. Error Handling

### 6.1 Invalid Code Input

```
Error: INVALID_INPUT
Message: "Código fuente no válido o vacío"
Handling:
- Si input es vacío → retornar empty requirements con confidence = 0
- Si input no es string → throw Error("Input debe ser string")
- Si input > 50000 chars → truncate con warning
```

### 6.2 AI Timeout

```
Error: AI_TIMEOUT
Message: "AI fallback excedió el timeout de 3 segundos"
Handling:
- Retry: 1 vez máximo
- Fallback: retornar solo resultados de pattern con warning
- Log: "Using pattern-only results due to AI timeout"
```

### 6.3 Malformed AI Output

```
Error: AI_PARSE_ERROR
Message: "AI retornó formato inválido"
Handling:
- Retry: no (ya falló el parse)
- Fallback: retornar solo resultados de pattern
- Log: "Using pattern-only results due to AI parse error"
```

### 6.4 Cache Failure

```
Error: CACHE_ERROR
Message: "Error accediendo al cache"
Handling:
- Fallback: continuar sin cache (re-analizar)
- No throw, solo warning log
```

---

## 7. Integration Points

### AIOrchestrator Integration

```typescript
// El analyzer usa AIOrchestrator para AI fallback
import { AIOrchestrator } from '../ai/AIOrchestrator';

class BackendRequirementsAnalyzer {
  private orchestrator = AIOrchestrator.getInstance();
  
  async analyzeWithAI(sourceCode: string): Promise<BackendRequirements> {
    // Llama al orchestrator solo cuando pattern confidence < 50
    const prompt = this.buildAnalysisPrompt(sourceCode);
    return this.orchestrator.generateApp(prompt);
  }
}
```

### Cache Strategy

```typescript
// Use Map con key = hashSHA256(sourceCode)
// TTL: 5 minutos
// Max entries: 50
// Eviction: LRU
```

---

## 8. Acceptance Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Detection rate | >= 80% | Precision en test set |
| Latency pattern | < 100ms | Benchmark |
| Latency hybrid | < 500ms | Benchmark |
| Test coverage | > 85% | Istanbul/Vitest |
| False positives | < 10% | Precision en test set |

---

## 9. File Structure

```
src/
├── services/
│   ├── ai/
│   │   ├── AIOrchestrator.ts        (exists)
│   │   ├── AIQuotaManager.ts        (exists)
│   │   ├── codeParser.ts            (exists)
│   │   ├── prompts.ts               (exists)
│   │   └── BackendRequirementsAnalyzer.ts  (NEW)
│   │       ├── analyze(sourceCode: string): BackendRequirements
│   │       ├── analyzeWithCache(sourceCode: string): BackendRequirements
│   │       └── detectWithAI(sourceCode: string): Promise<BackendRequirements>
```

---

## 10. Deliverables

- [ ] BackendRequirementsAnalyzer class
- [ ] Pattern detection engine
- [ ] AI fallback integration
- [ ] LRU cache (Map-based)
- [ ] Unit tests (>85% coverage)
- [ ] Integration test with AIOrchestrator mock

---

**END OF SPEC**