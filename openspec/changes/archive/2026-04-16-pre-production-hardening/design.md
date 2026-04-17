# Design: Pre-Production Hardening

## Technical Approach

Estrategia "Waves" con 7 oleadas secuenciales que respetan dependencias técnicas: test infra primero, luego quick fixes (1 línea), core pipeline, refactor arquitectural, security hardening, integración completa, y polish. Cada oleada es testeable independientemente.

## Architecture Decisions

### Decision: Test Runner — Vitest + jsdom

**Choice**: Vitest como test runner con jsdom environment
**Alternatives considered**: Jest (config legacy), Playwright (overkill para unit tests)
**Rationale**: Vitest tiene zero-config con Vite 8, shared tsconfig, y API idéntica a Jest. jsdom permite testing de componentes React sin browser real.

### Decision: API Key Storage — SessionStorage + runtime fallback

**Choice**: Cambiar de localStorage a sessionStorage, eliminar console.log sensibles, mantener fallback a VITE_GEMINI_API_KEY
**Alternatives considered**: Web Crypto API (overkill complexity), backend proxy (out of scope según proposal)
**Rationale**: sessionStorage limpia al cerrar tab (menor persistencia XSS), no requiere nueva arquitectura. console.log eliminado en H-02 requiere cambio mínimo.

### Decision: TailwindCSS — SYSTEM_PROMPT dice "plain CSS"

**Choice**: Cambiar prompts.ts línea 3 de "Tailwind CSS" a "plain CSS" / "CSS", agregar explicación en output example
**Alternatives considered**: Instalar tailwindcss en package.json (no request por user, genera apps con clases que no existen)
**Rationale**: AI genera CSS que funciona sin dependencia faltante. usuarios que quieran Tailwind pueden agregarlo manualmente después.

### Decision: codeParser — Return warnings array

**Choice**: Modificar parseAIResponse para retornar `{ message, files, warnings: string[] }`, populate warnings en casos de parsing failure
**Alternatives considered**: throw on failure (rompe flujo), return null (necesita null checks en todos los callers)
**Rationale**:warnings permite C-05 (error UI) mostrar feedback útil sin romper chain.

### Decision: BuilderPage Refactor — Extraer hooks

**Choice**: Extraer handleNewMessage y WebContainer logic a custom hooks: useAIBuilder, useWebContainer
**Alternatives considered**: Mantener en componente (no testable), usar HOC (mayor refactor)
**Rationale**: Separación de preocupaciones habilita testing unit de cada hook con mocks. useAIBuilder testea generateApp sin mounting.

### Decision: Markdown Sanitization — rehype-sanitize plugin

**Choice**: Agregar rehype-sanitize a ReactMarkdown remarkPlugins, mantener remark-gfm
**Alternatives considered**: Custom sanitizer (reinventing wheel), DOMPurify (no React-native)
**Rationale**: rehype-sanitize es el estándar para unified/rehype ecosystem, integra con remark-gfm sin conflicto.

### Decision: Error Boundary — Componente dedicado

**Choice**: Crear src/components/common/AppErrorBoundary.tsx wrapping App en main.tsx
**Alternatives considered**: Boundary en cada página (too granular para este app size)
**Rationale**: Catch errores de render a nivel root, provee fallback UI con retry button.

### Decision: CSP Meta Tag — index.html

**Choice**: Agregar `<meta http-equiv="Content-Security-Policy" content="...">`
**Alternatives considered**: Headers via server (vite no tiene built-in), nonce-based (requires build changes)
**Rationale**: Meta tag es simplest path para XSS mitigation sin infraestructura nueva. 'self' + https allowed, inline blocked.

### Decision: Preview Sandbox — sandbox="allow-scripts"

**Choice**: Agregar sandbox="allow-scripts" al iframe, manejar estado 'error' en PreviewPanel
**Alternatives considered**: allow-same-origin (security risk), no sandbox (current state - insecure)
**Rationale**: allow-scripts permite JS generated app, bloquea top navigation/forms. Error state requerido por H-12.

### Decision: WebContainer Null Checks

**Choice**: Agregar if (!this.webcontainerInstance) await this.boot() en TODOS los métodos públicos
**Alternatives considered**: Non-null assertion (current - crash), optional chaining (silent failure)
**Rationale**: Explicit boot() call con null check es claro y permite error handling apropiado.

### Decision: Fix SettingsModal Bug className

**Choice**: Cambiar línea 84 de `` `${localModelId === model.id ? 'active' : ''}` ``a templ literals correctos
**Alternatives considered**: Regex replace (no precisa para un fix)
**Rationale**: Bug simple - backslash escapa $ en template literal. Fix en una línea.

### Decision: FileExplorer/ConsolePanel Integration

**Choice**: Pasar currentFiles de BuilderPage via props, aceptar FileExplorer como componente controlado
**Alternatives considered**: Conectar directamente a WebContainer (tight coupling, difícil de testear)
**Rationale**: BuilderPage tiene currentFiles y wc instance, pasa como props habilita testing sin WebContainer real.

## Data Flow

**ANTES** (flujo actual con problemas):
```
ChatPanel → BuilderPage.handleNewMessage(GOD)
  → AIOrchestrator.updateConfig() [C-01,C-02,H-01,H-02]
    → codeParser.parseAIResponse() [C-09 silent failure]
      → WebContainerManager.mount() [C-07 non-null!]
        → PreviewPanel [M-01 no sandbox]
```

**DESPUÉS** (flujo mejorado con 7 waves):
```
Wave 3: BuilderPage refactor → hooks extraídos
Wave 4: AIOrchestrator sanitization + config
Wave 4: SettingsContext sessionStorage
Wave 5: ChatPanel sanitized markdown
Wave 5: PreviewPanel sandbox + error state
Wave 5: FileExplorer/ConsolePanel real data
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Agregar vitest, @testing-library/react, @vitest/coverage-v8, jsdom |
| `src/main.tsx` | Modify | Wrap App con ErrorBoundary |
| `src/contexts/SettingsContext.tsx` | Modify | sessionStorage en vez de localStorage, eliminar logging |
| `src/services/ai/AIOrchestrator.ts` | Modify | Prompt sanitization, remove console.log sensibles, tipos correctos |
| `src/services/ai/codeParser.ts` | Modify | Return warnings array |
| `src/services/ai/prompts.ts` | Modify | "CSS" en vez de "Tailwind CSS" |
| `src/services/webcontainer/WebContainerManager.ts` | Modify | Null checks en todos los métodos |
| `src/pages/BuilderPage.tsx` | Modify | Extraer hooks, error UI, pass props a componentes |
| `src/components/chat/ChatPanel.tsx` | Modify | Agregar rehype-sanitize |
| `src/components/preview/PreviewPanel.tsx` | Modify | sandbox + error state |
| `src/components/editor/FileExplorer.tsx` | Modify | Props para archivos reales |
| `src/components/common/ConsolePanel.tsx` | Modify | Props para logs reales |
| `src/components/settings/SettingsModal.tsx` | Modify | Fix className bug |
| `src/components/common/AppErrorBoundary.tsx` | Create | Error Boundary component |
| `index.html` | Modify | CSP meta tag |

## Interfaces / Contracts

```typescript
// Nuevos tipos para codeParser response
export interface ParseResult {
  message: string;
  files: ProjectFile[];
  warnings: string[]; // array vacío si no hay issues
}

// BuilderPage hook signature
interface UseAIBuilderReturn {
  generate: (prompt: string) => Promise<void>;
  builderState: BuilderState;
  error: Error | null;
}

// WebContainer hook signature  
interface UseWebContainerReturn {
  mount: (files: ProjectFile[]) => Promise<void>;
  isReady: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | codeParser warnings array | Input con missing markers → expect(warnings.length > 0) |
| Unit | prompts content | Verify no "Tailwind" string |
| Unit | SettingsContext sessionStorage | Mock localStorage/sessionStorage |
| Integration | AIOrchestrator mock | vitest.mock('@google/generative-ai') |
| Integration | BuilderPage hooks | renderHook desde @testing-library/react |
| Component | ChatPanel XSS sanitize | render con script tag → verify not in DOM |
| Component | PreviewPanel sandbox | find sandbox attribute in iframe |

## Migration / Rollout

No migration required. Cambios son backwards-compatibles excepto:
- API key migra de localStorage a sessionStorage (usuario necesitará re-ingresar key en nueva sesión)
- Tailwind generar apps diferente output (CSS plano siempre funcionó, no es breaking change)

## Open Questions

- [ ] H-04: CodeEditor Save/Run handlers — ¿se implementan en esta fase o se deja como placeholder?
- [ ] H-11: refineApp flow UI — ¿se habilita botón en ChatPanel para "modify existing app"?
- [ ] M-03: Path traversal validation en fileSystem.ts — ¿validar paths antes de mount?
- [ ] WebContainer API mock para tests — ¿sufficient el mock factory o necesitamos browser real en CI?