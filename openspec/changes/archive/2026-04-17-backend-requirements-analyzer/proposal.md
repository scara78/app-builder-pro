# Proposal: Backend Requirements Analyzer (CHANGE 2)

## 1. Intent

El objetivo de este cambio es construir un componente que analice el código React generado por el sistema AI y detecte automáticamente los requerimientos de backend necesarios: entidades de base de datos, autenticación, almacenamiento de archivos, y operaciones CRUD. Este componente actúa como el puente entre el código frontend generado (CHANGE 1 - SupabaseMCPClient ya completado) y la generación automática de migrations/backend (CHANGE 3).

El problema que resuelve es la fricción actual donde el usuario debe especificar manualmente qué tablas, auth y storage necesita su aplicación. Con este analyzer, el sistema infiere estos requerimientos directamente del código generado, permitiendo una experiencia de "backend automático" basada en el código frontend que el usuario ya tiene.

## 2. Scope IN

Este cambio incluye:

- **Pattern Detection Engine**: Sistema de detección basado en regex y parsing de AST para identificar patrones comunes en código React:
  - Interfaces TypeScript → entidades de base de datos (ej: `interface User { id, email, name }`)
  - Componentes con `<form onSubmit=...>` → operaciones CRUD (create, update)
  - Referencias a `user`, `login`, `register`, `auth` → autenticación
  - Uso de `File`, `Blob`, `upload`, `storage` → storage buckets
  - Referencias a `realtime`, `subscribe`, `onSnapshot` → features realtime (marcado para v2)

- **Hybrid Analysis Strategy**:
  - Fase 1: Pattern matching para casos obvios (80% del código típico)
  - Fase 2: AI fallback usando Gemini para casos ambiguos o complejos
  - Confidence scoring para cada detección

- **BackendRequirements Interface**: Output estructurado que incluye:
  ```typescript
  interface BackendRequirements {
    entities: EntityDefinition[];
    auth: AuthRequirements | null;
    storage: StorageBucket[];
    realtime: RealtimeFeature[];
    confidence: number;
    analysisMethod: 'pattern' | 'ai' | 'hybrid';
  }
  ```

- **Integración con AIOrchestrator**: Reutilización del sistema existente de quota y manejo de API

- **Cache de resultados**: Para evitar re-análisis del mismo código

## 3. Scope OUT

Este cambio NO incluye:

- **Generación de SQL/Migrations**: Esto es CHANGE 3 - backend-migration-generator
- **Modificaciones al frontend**: Solo analiza código existente, no genera nuevo código
- **Detección de features realtime**: Marcado como v2 (futuro)
- **Validación de schemas**: Se hace en CHANGE 3
- **Deployment o ejecución de migrations**: Fuera del scope
- **Detección de APIs externas**: Solo analiza patrones Supabase/Backend locales

## 4. Approach

### Arquitectura Híbrida Propuesta

La estrategia híbrida combina velocidad con inteligencia semántica:

**Fase 1 - Pattern Matching (Fast Path)**:
- Analizador basado en regex para detecciones rápidas
- Whitelist de patterns probados (no blacklists para evitar falsos positivos)
- Patrones priorizados por specificity (más específico primero)
- Tiempo objetivo: <100ms para análisis básico

**Fase 2 - AI Fallback (Smart Path)**:
- Se activa cuando:
  - Pattern matching tiene confidence < 0.7
  - Código contiene patrones ambiguos
  - Usuario solicita análisis profundo
- Prompt especializado para análisis de requirements
- Tiempo objetivo: <500ms adicional con caching

**Fase 3 - Confidence Scoring**:
- Cada detección tiene score 0.0-1.0
- Threshold mínimo para incluir: 0.5
- Promedio ponderado para confidence general

### Integración con Sistema Existente

El analyzer se integra con AIOrchestrator.ts existente:
- Reutiliza quotaManager para control de costos
- Usa la misma instancia de Gemini para fallback
- Expande codeParser.ts con nueva función `analyzeBackendRequirements()`

### Flujo de Datos

```
Generated React Code
        ↓
   Pattern Engine
        ↓
 ¿confidence < 0.7?
   /              \
 YES              NO
  ↓               ↓
 AI Fallback   Final Output
    ↓
Final Output (hybrid)
```

## 5. Success Criteria

### Métricas Cuantitativas

| Criterio | Target | Medición |
|----------|--------|----------|
| Pattern Detection Rate | ≥80% | Test suite con 50+ casos conocidos |
| Analysis Time (typical) | <500ms | Benchmark de apps comunes |
| False Positive Rate | <10% | Review manual de detecciones |
| Test Coverage | >85% | Istanbul/Vitest coverage |
| AI Fallback Usage | <20% | Métrica de logging |

### Métricas Cualitativas

- **Integración con CHANGE 1**: El analyzer debe输出的 BackendRequirements sea consumible directamente por SupabaseMCPClient
- **Fallback graceful**: Si AI no está disponible, el sistema debe funcionar solo con patterns
- **Extensibilidad**: Fácil agregar nuevos patterns sin modificar core
- **Debugging**: Logs claros indicando qué patrón detectó cada requirement

### Definition of Done

- [ ] Pattern engine implementado con los 4 tipos principales (entities, auth, storage, CRUD)
- [ ] AI fallback integrado con AIOrchestrator existente
- [ ] Confidence scoring funcionando
- [ ] Test coverage >85%
- [ ] Documentación de patrones detectados
- [ ] Propuesta para CHANGE 3 basada en el output de este cambio
