# 🏃 PubMed/Europe PMC Integration - Sprint Plan

> **3-Sprint roadmap for implementing scientific literature integration into PrimeKG Explorer**

---

## 📋 Sprint Overview

| Sprint | Focus | Duration | Key Deliverable |
|--------|-------|----------|-----------------|
| **Sprint 1** | Foundation & Core Services | 3-5 days | Working API integration with basic data fetching |
| **Sprint 2** | UI Components & User Experience | 4-6 days | Functional literature panel in the application |
| **Sprint 3** | Polish, Performance & Production | 3-4 days | Production-ready feature with full optimization |

**Total Estimated Time**: 10-15 days

---

## 🎯 Sprint 1: Foundation & Core Services

**Objetivo**: Establecer la infraestructura base y la integración con la API de Europe PMC.

### User Stories

1. **Como desarrollador**, necesito conectarme a la API de Europe PMC para obtener datos de publicaciones científicas.
2. **Como desarrollador**, necesito modelos de datos TypeScript que representen las citas científicas.
3. **Como desarrollador**, necesito funciones de servicio que transformen datos de la API en formatos utilizables.

### Tareas Técnicas

#### 1.1 TypeScript Types & Interfaces
- [ ] Crear `src/types/pubmed.ts`
- [ ] Definir interfaces:
  - `Citation`
  - `SearchResponse`
  - `SearchParams`
  - `DisplayCitation`
  - `PubMedError`
  - `Author`, `FullTextUrl`, `MeshHeading`
- [ ] Documentar cada interface con JSDoc

**Tiempo estimado**: 1 hora

#### 1.2 Core Service Implementation
- [ ] Crear `src/services/pubmedService.ts`
- [ ] Implementar funciones base:
  - `transformCitation()` - Transformar datos de API a DisplayCitation
  - `buildQuery()` - Constructor de queries con filtros
  - `searchCitations()` - Función principal de búsqueda
- [ ] Agregar manejo de errores con try/catch
- [ ] Implementar timeout handling (10 segundos)
- [ ] Configurar headers y parámetros de la API

**Tiempo estimado**: 3-4 horas

#### 1.3 Specialized Search Functions
- [ ] Implementar `searchEntityCitations()`:
  - Lógica específica por tipo (gene/drug/disease/pathway)
  - Query templates optimizadas
  - Filtro de últimos 5 años
- [ ] Implementar `searchRelationshipCitations()`:
  - Búsqueda de relaciones entre 2 entidades
  - Keywords: mechanism, interaction, effect, treatment
- [ ] Implementar `searchMechanismCitations()`:
  - Enfocado en drug-disease mechanisms
  - Keywords: mode of action, pathway, target

**Tiempo estimado**: 2-3 horas

#### 1.4 Testing & Validation
- [ ] Crear `src/services/__tests__/pubmedService.test.ts`
- [ ] Unit tests para:
  - `transformCitation()` con datos completos
  - `transformCitation()` con datos faltantes
  - `buildQuery()` con filtros de año
  - `buildQuery()` con filtro de open access
- [ ] Mock de fetch para tests
- [ ] Test de manejo de timeouts
- [ ] Test de manejo de errores de red

**Tiempo estimado**: 2-3 horas

#### 1.5 Manual API Testing
- [ ] Crear script de prueba manual `scripts/test-pubmed-api.ts`
- [ ] Probar consultas con entidades reales:
  - Gene: TP53, BRCA1
  - Drug: Metformin, Aspirin
  - Disease: Alzheimer's disease, Diabetes
- [ ] Documentar respuestas y edge cases
- [ ] Validar estructura de datos

**Tiempo estimado**: 1-2 horas

### Acceptance Criteria

✅ **Debe cumplir**:
- [ ] El servicio puede consultar la API de Europe PMC exitosamente
- [ ] Los datos de la API se transforman correctamente a `DisplayCitation`
- [ ] Las búsquedas específicas por tipo de entidad funcionan
- [ ] El manejo de errores captura timeouts y errores de red
- [ ] Los tests unitarios tienen >80% de cobertura
- [ ] No hay errores TypeScript
- [ ] Las consultas para entidades conocidas retornan resultados válidos

### Deliverables

📦 **Archivos creados**:
- `src/types/pubmed.ts`
- `src/services/pubmedService.ts`
- `src/services/__tests__/pubmedService.test.ts`
- `scripts/test-pubmed-api.ts`

📄 **Documentación**:
- Comentarios JSDoc en todas las funciones públicas
- README con ejemplos de uso del servicio

---

## 🎨 Sprint 2: UI Components & User Experience

**Objetivo**: Crear componentes React funcionales que muestren literatura científica a los usuarios.

### User Stories

1. **Como usuario**, quiero ver literatura científica relevante cuando exploro una entidad biomédica.
2. **Como usuario**, quiero poder expandir/colapsar abstracts de papers para ver más detalles.
3. **Como usuario**, quiero acceder a PDFs y enlaces a texto completo fácilmente.
4. **Como usuario**, quiero ver indicadores visuales de papers de acceso abierto y altamente citados.

### Tareas Técnicas

#### 2.1 React Query Setup
- [ ] Instalar dependencias:
  ```bash
  npm install @tanstack/react-query @tanstack/react-query-devtools
  ```
- [ ] Crear `src/lib/queryClient.ts`:
  - Configurar `staleTime: 30 minutos`
  - Configurar `gcTime: 1 hora`
  - Configurar retry logic (2 reintentos)
  - Configurar refetch behavior
- [ ] Agregar `QueryClientProvider` en `src/App.tsx`
- [ ] Agregar React Query DevTools (solo en desarrollo)

**Tiempo estimado**: 1 hora

#### 2.2 Custom Hooks
- [ ] Crear `src/hooks/usePubMed.ts`
- [ ] Implementar hooks:
  - `useEntityCitations(entityName, entityType, limit)`
  - `useRelationshipCitations(entity1, entity2, limit)`
  - `useMechanismCitations(drug, disease, limit)`
  - `usePrefetchCitation()` - Para hover previews
- [ ] Configurar query keys apropiadas
- [ ] Agregar enabled logic para queries condicionales
- [ ] Documentar cada hook

**Tiempo estimado**: 2-3 horas

#### 2.3 Main LiteraturePanel Component
- [ ] Crear `src/components/entity/LiteraturePanel.tsx`
- [ ] Implementar estados:
  - Loading: `<LiteratureSkeleton />`
  - Error: `<ErrorCard />`
  - Empty: `<EmptyState />`
  - Success: Lista de citations con Accordion
- [ ] Agregar header con título y badge de conteo
- [ ] Agregar link "View more on Europe PMC"
- [ ] Integrar con `useEntityCitations` hook

**Tiempo estimado**: 3-4 horas

#### 2.4 Citation Card Component
- [ ] Crear `<CitationCard />` dentro de LiteraturePanel.tsx
- [ ] Implementar con shadcn/ui Accordion:
  - Trigger: Título + autores + journal + año
  - Content: Abstract + enlaces
- [ ] Agregar badges:
  - "Open Access" (verde)
  - Citation count (si >0)
  - "Highly Cited" (si >100 citations)
- [ ] Agregar enlaces a:
  - PDF (si disponible)
  - Full text (PMC)
  - DOI
- [ ] Agregar iconos de Material Symbols

**Tiempo estimado**: 2-3 horas

#### 2.5 Skeleton & Error Components
- [ ] Crear `<LiteratureSkeleton count={n} />`
  - Usar shadcn/ui Skeleton
  - Animar con pulse
  - Simular estructura de citation cards
- [ ] Crear `<ErrorCard message onRetry />`
  - Mostrar icono de error
  - Mensaje descriptivo
  - Botón "Try again"
- [ ] Crear `<EmptyState entityName />`
  - Icono de library_books
  - Mensaje "No papers found"
  - Link directo a Europe PMC

**Tiempo estimado**: 1-2 horas

#### 2.6 Citation Tooltip (Hover Preview)
- [ ] Crear `src/components/entity/CitationTooltip.tsx`
- [ ] Implementar con shadcn/ui Tooltip
- [ ] Mostrar al hacer hover sobre entidades:
  - Top 2 papers
  - Badge de "+X more"
- [ ] Prefetch on hover con `usePrefetchCitation()`
- [ ] Delay de 500ms para evitar tooltips accidentales

**Tiempo estimado**: 1-2 horas

#### 2.7 Integration with Existing UI
- [ ] Integrar `<LiteraturePanel />` en:
  - Entity panel (cuando se muestra una entidad)
  - Search results (para cada resultado relevante)
  - Chat response (cuando se mencionan entidades)
- [ ] Agregar toggle "Show Literature" (opcional)
- [ ] Asegurar responsive design
- [ ] Probar en mobile

**Tiempo estimado**: 2-3 horas

#### 2.8 Styling & Polish
- [ ] Crear estilos en `index.css` o component CSS
- [ ] Implementar animación de fade-in para citation cards:
  ```css
  .citation-card:nth-child(n) { animation-delay: ... }
  ```
- [ ] Ajustar espaciado y padding
- [ ] Asegurar consistencia con diseño existente
- [ ] Probar tema dark mode

**Tiempo estimado**: 1-2 horas

### Acceptance Criteria

✅ **Debe cumplir**:
- [ ] El panel de literatura se muestra cuando se selecciona una entidad
- [ ] Los papers se cargan en <800ms (con cache)
- [ ] Los skeleton loaders se muestran mientras carga
- [ ] Los errores se manejan gracefully con opción de retry
- [ ] Los abstracts se expanden/colapsan correctamente
- [ ] Los enlaces a PDF/PMC/DOI funcionan
- [ ] Los badges (Open Access, citations) se muestran correctamente
- [ ] El tooltip de hover preview funciona
- [ ] El diseño es responsive (desktop + mobile)
- [ ] No rompe la UI existente

### Deliverables

📦 **Archivos creados**:
- `src/lib/queryClient.ts`
- `src/hooks/usePubMed.ts`
- `src/components/entity/LiteraturePanel.tsx`
- `src/components/entity/CitationTooltip.tsx`

📄 **Documentación**:
- Storybook stories para componentes (opcional)
- Screenshots de los componentes en docs

---

## ⚡ Sprint 3: Polish, Performance & Production

**Objetivo**: Optimizar el rendimiento, agregar features avanzadas, y preparar para producción.

### User Stories

1. **Como usuario**, quiero que el sistema cargue literatura rápidamente incluso con conexión lenta.
2. **Como usuario con discapacidad visual**, necesito que el panel sea accesible con screen readers.
3. **Como usuario móvil**, necesito que la interfaz funcione bien en mi dispositivo.
4. **Como administrador**, necesito monitorear errores y performance de la integración.

### Tareas Técnicas

#### 3.1 Performance Optimization
- [ ] Implementar Intersection Observer para lazy loading:
  - Crear `<LazyLiteraturePanel />`
  - Cargar solo cuando es visible en viewport
- [ ] Implementar debounced prefetching:
  - Usar `use-debounce` library
  - Debounce de 300ms en hover
- [ ] Optimizar bundle size:
  - Verificar con webpack-bundle-analyzer
  - Code splitting si es necesario
- [ ] Agregar performance monitoring:
  - Log de tiempos de carga
  - Analytics de cache hit rate

**Tiempo estimado**: 2-3 horas

#### 3.2 Advanced Caching Strategy
- [ ] Implementar React Query persistence:
  - Agregar `@tanstack/query-sync-storage-persister`
  - Persistir cache en localStorage
  - Max age: 24 horas
  - Cache version/buster
- [ ] Implementar `prefetchCitations()` para batch loading:
  - Función para prefetch múltiples entidades
  - Concurrency limit de 3 requests
  - Progress reporting
- [ ] Configurar cache warming:
  - Prefetch entidades comunes al cargar la app
  - Lista de top genes/drugs/diseases

**Tiempo estimado**: 2-3 horas

#### 3.3 Rate Limiting
- [ ] Crear `src/utils/rateLimiter.ts`:
  - Implementar clase `RateLimiter`
  - Queue-based processing
  - Min interval: 350ms (~3 req/sec)
- [ ] Integrar rate limiter en `pubmedService.ts`
- [ ] Agregar función `searchCitationsWithLimit()`
- [ ] Monitorear y log de rate limiting

**Tiempo estimado**: 1-2 horas

#### 3.4 Accessibility (a11y)
- [ ] Keyboard navigation:
  - Arrow keys para navegar entre citations
  - Enter para abrir/cerrar abstracts
  - Tab navigation apropiada
- [ ] Screen reader support:
  - Agregar `role="status"` para loading states
  - `aria-live="polite"` para anuncios
  - `aria-labelledby` y `aria-describedby` en cards
- [ ] Focus management:
  - Focus visible en elementos interactivos
  - Focus trap en modals (si aplica)
- [ ] Contrast checker:
  - Verificar ratios de contraste (WCAG 2.1 AA)
  - Ajustar colores si es necesario

**Tiempo estimado**: 2-3 horas

#### 3.5 Error Boundary & Resilience
- [ ] Crear `src/components/entity/LiteratureErrorBoundary.tsx`
- [ ] Implementar error boundary component
- [ ] Wrap `<LiteraturePanel />` con boundary
- [ ] Log errores a monitoring service (Sentry, etc.)
- [ ] Fallback UI apropiado
- [ ] Recovery mechanism

**Tiempo estimado**: 1-2 horas

#### 3.6 Integration & E2E Testing
- [ ] Crear tests de integración:
  - `__tests__/LiteraturePanel.integration.test.tsx`
  - Test con QueryClientProvider
  - Test de loading → success flow
  - Test de loading → error flow
  - Test de empty state
- [ ] Crear E2E tests con Playwright:
  - `e2e/literature.spec.ts`
  - Test de carga de citations
  - Test de expand/collapse
  - Test de clicks en enlaces
  - Test de error handling
- [ ] Configurar CI para correr tests

**Tiempo estimado**: 3-4 horas

#### 3.7 Documentation & Developer Experience
- [ ] Actualizar README principal con sección de Literatura
- [ ] Crear guía de troubleshooting
- [ ] Documentar common issues y soluciones
- [ ] Agregar ejemplos de código en docs
- [ ] Crear ADR (Architecture Decision Record) para elección de Europe PMC
- [ ] Actualizar CHANGELOG

**Tiempo estimado**: 1-2 horas

#### 3.8 Monitoring & Analytics
- [ ] Agregar analytics tracking:
  - Event: "literature_panel_viewed"
  - Event: "citation_clicked"
  - Event: "citation_pdf_opened"
- [ ] Agregar error tracking
- [ ] Configurar dashboard para métricas:
  - Cache hit rate
  - Average load time
  - Error rate
  - Most searched entities

**Tiempo estimado**: 1-2 horas

#### 3.9 Production Checklist
- [ ] Verificar environment variables
- [ ] Testing en staging environment
- [ ] Performance testing con Lighthouse
- [ ] Security audit (CSP headers, etc.)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Accessibility audit con axe DevTools
- [ ] Review de PRs
- [ ] Merge a main branch
- [ ] Deploy a production

**Tiempo estimado**: 2-3 horas

### Acceptance Criteria

✅ **Debe cumplir**:
- [ ] Cache hit rate >90% para entidades comunes
- [ ] First citation display <800ms (cached: <100ms)
- [ ] Lighthouse accessibility score >90
- [ ] Zero console errors en producción
- [ ] E2E tests passing en CI
- [ ] WCAG 2.1 AA compliance
- [ ] Works en Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- [ ] Works en mobile (iOS + Android)
- [ ] Error rate <1%
- [ ] Bundle size impact <50KB gzipped

### Deliverables

📦 **Archivos creados**:
- `src/utils/rateLimiter.ts`
- `src/components/entity/LiteratureErrorBoundary.tsx`
- `src/components/entity/LazyLiteraturePanel.tsx`
- `__tests__/LiteraturePanel.integration.test.tsx`
- `e2e/literature.spec.ts`

📄 **Documentación**:
- Troubleshooting guide
- Architecture Decision Record (ADR)
- Updated CHANGELOG
- Analytics dashboard setup guide

📊 **Métricas establecidas**:
- Performance benchmarks
- Cache efficiency reports
- Error tracking dashboard

---

## 📊 Definition of Done (General)

Para considerar la integración completa, debe cumplir:

### Funcional
- [ ] Todos los sprints completados con acceptance criteria cumplidos
- [ ] Feature funciona en producción sin errores
- [ ] Performance metrics dentro de targets

### Calidad
- [ ] Code coverage >80%
- [ ] Todos los tests (unit, integration, E2E) passing
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Linter passing sin warnings

### UX/UI
- [ ] Responsive design (mobile + desktop)
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] Loading states apropiados
- [ ] Error handling graceful
- [ ] Consistente con diseño existente

### DevOps
- [ ] CI/CD pipeline passing
- [ ] Deployed a production
- [ ] Monitoring configurado
- [ ] Analytics tracking activo
- [ ] Documentation actualizada

### Stakeholder
- [ ] Demo completado con stakeholders
- [ ] Feedback incorporado
- [ ] Sign-off de producto

---

## 🚀 Getting Started

### Pre-Sprint Checklist
- [ ] Ambiente de desarrollo configurado
- [ ] Acceso a Europe PMC API (no requiere key)
- [ ] shadcn/ui components instalados
- [ ] React Query familiarity
- [ ] Revisión del `docs/pubmed.md` completa

### Start Sprint 1
```bash
# Crear branch
git checkout -b feat/pubmed-integration-sprint-1

# Crear estructura base
mkdir -p src/types src/services src/services/__tests__ scripts

# Install dependencies
npm install @tanstack/react-query @tanstack/react-query-devtools
```

---

## 📞 Support & Questions

Para cualquier pregunta durante la implementación, consultar:
- 📚 **Documentación completa**: `docs/pubmed.md`
- 🔗 **Europe PMC API Docs**: https://europepmc.org/RestfulWebService
- 💬 **Team discussion**: Slack #primekg-development

---

*Sprint plan creado: January 23, 2026*
*Estimación total: 10-15 días de desarrollo*
