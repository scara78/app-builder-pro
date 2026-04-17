# Proposal: Pre-Production Hardening

## Intent
Endurecer el proyecto App Builder Pro antes de producción, resolviendo 44 hallazgos de auditoría organizados en 3 ejes: seguridad (10), arquitectura (32), y trazabilidad (2). El objetivo es un sistema testeable, seguro, y mantenible.

## Scope

### In Scope
- Test infrastructure completa (Vitest + Testing Library)
- Pipeline/core fixes críticos (className interpolation, codeParser, TailwindCSS, error UI)
- Arquitectura refactor (God Component → hooks, Error Boundaries)
- Security hardening (API key, prompt injection, CSP, XSS)
- Integración de componentes (handlers reales, WebContainer real)
- Fixes Medium/Low restantes

### Out of Scope
- Backend proxy para API key (se implementa solución client-side temporal)
- Nueva funcionalidad de usuario (solo endurecimiento)
- Deploy pipeline CI/CD externo

## Capabilities

### New Capabilities
- `test-infrastructure`: Vitest + Testing Library configurados, patrones de test por módulo definidos, TDD habilitado
- `error-handling-system`: Error Boundary en main.tsx, UI de errores en BuilderPage, codeParser reporta warnings
- `security-hardening`: CSP meta tag, Markdown sanitizado (rehype-sanitize), prompt sanitización básica
- `integrated-file-explorer`: FileExplorer con datos reales de WebContainer, no más mocks
- `real-console`: ConsolePanel conectado a WebContainer logs, no más hardcoded

### Modified Capabilities
- `api-key-storage`: De plain localStorage a SessionStorage + runtime env fallback, logging eliminado
- `code-parsing`: De silent failure a returns warnings array con detalles del parseo
- `tailwind-support`: De mentira en SYSTEM_PROMPT a CSS plano en prompts + opcional Tailwind via WebContainer
- `chat-markdown`: De raw render a sanitizado con rehype-sanitize
- `preview-sandbox`: De iframe sin sandbox a sandbox="allow-scripts" + error state handling

## Approach
**"Waves"** — Un cambio con 7 oleadas secuenciales que respetan dependencias técnicas:

| Wave | Focus | Key Fixes |
|------|-------|-----------|
| 0 | Test Infrastructure | Vitest + Testing Library install |
| 1 | Quick Fixes | C-08 (className), C-07 (non-null), C-06 (any), H-02 (logs), H-10 (colors), M-04 |
| 2 | Core Pipeline | C-10 (Tailwind), C-09 (codeParser), C-05 (error UI) |
| 3 | Architecture Refactor | C-03, C-04 (God Component → hooks), H-06, H-07, H-09 (Error Boundary) |
| 4 | Security Hardening | C-01, C-02 (API key), H-01 (prompt injection), H-03 (CSP), M-01, M-02, M-03 |
| 5 | Integration Complete | H-04, H-05, H-11, H-12, M-08 |
| 6 | Polish | MEDIUMs restantes + LOWs |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| package.json | Modified | Añadir vitest, @testing-library/react, @vitest/coverage-v8 |
| src/main.tsx | Modified | Error Boundary wrapper |
| src/contexts/SettingsContext.tsx | Modified | API key en sessionStorage, logging eliminado |
| src/pages/BuilderPage.tsx | Modified | Extraer hooks, error UI, 5 responsabilidades→funciones |
| src/services/ai/AIOrchestrator.ts | Modified | Prompt sanitización, tipos correctos |
| src/services/ai/codeParser.ts | Modified | Returns warnings array, no silencioso |
| src/services/ai/prompts.ts | Modified | SYSTEM_PROMPT dice CSS, no Tailwind |
| src/services/webcontainer/WebContainerManager.ts | Modified | Null checks, error handling |
| src/components/chat/ChatPanel.tsx | Modified | Markdown sanitizado |
| src/components/preview/PreviewPanel.tsx | Modified | Sandbox + error state |
| src/components/editor/FileExplorer.tsx | Modified | Datos reales de WebContainer |
| src/components/common/ConsolePanel.tsx | Modified | WebContainer logs reales |
| index.html | Modified | CSP meta tag |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| God Component refactor rompe funcionalidad | Medium | Tests antes (TDD), verificar manualmente post-change |
| API key client-side es incompleta | High | Documentar que se necesita backend proxy en fase posterior |
| WebContainer API mocking es compleja | Medium | Crear mock factory dedicado, tests de integración con browser real si es necesario |
| TailwindCSS cambio impacta output de AI | Medium | Validar que apps generadas funcionan con CSS plano |

## Rollback Plan
1. **Git revert** del commit del cambio completo
2. **Restaurar package.json** si Vitest fue instalado (pero se queda como mejora permanente)
3. **Rollback manual** de cambios en archivos críticos (BuilderPage, AIOrchestrator) si hay regresión masiva
4. **Branches de Feature**: Cada oleada en branch separada permite revert por oleada si es necesario

## Dependencies
- Node.js 18+ (para Vitest)
- Vite 8 ya instalado (compatibilidad asegurada)
- No hay dependencias externas nuevas excepto devDependencies de testing

## Success Criteria
- [ ] `npm test` corre y pasa >80% de tests unitarios
- [ ] Error Boundary captura errores de render y muestra UI de fallback
- [ ] API key no aparece en `console.log` durante flujo normal
- [ ] codeParser retorna warnings cuando parsing falla (no silencioso)
- [ ] CSP meta tag presente en index.html
- [ ] ChatPanel renderiza Markdown sanitizado (sin XSS)
- [ ] PreviewPanel tiene sandbox="allow-scripts" y maneja estado 'error'
- [ ] FileExplorer muestra archivos真实的 de WebContainer (no mocks)
- [ ] SYSTEM_PROMPT dice CSS, no TailwindCSS
- [ ] Ningún `catch (error: any)` — tipos correctos en todo el codebase
- [ ] Ningún `this.webcontainerInstance!` — null checks proper