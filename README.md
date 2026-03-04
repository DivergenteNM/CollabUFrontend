# Collab-U — Frontend

Plataforma de gestión de prácticas profesionales para la Universidad de Nariño. SPA construida con Angular 21, Angular Material 3 y NgRx SignalStore.

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 21.2.0 | Framework (zoneless, standalone, signals-first) |
| Angular Material | 21.2.0 | Componentes UI — Material Design 3 |
| NgRx SignalStore | 21.0.1 | State management reactivo |
| TypeScript | ~5.9.3 | Tipado estático |
| RxJS | ~7.8.2 | Programación reactiva |
| Chart.js | ^4.5.1 | Gráficos y visualizaciones |
| date-fns | ^4.1.0 | Utilidades de fechas |
| socket.io-client | ^4.8.3 | WebSocket (chat en tiempo real) |
| Vitest | — | Testing unitario |
| Playwright | ^1.58.2 | Testing e2e |

## Arquitectura

```
src/
├── styles/                          # Sistema de diseño global
│   ├── theme/_collab-u-theme.scss   # Material 3 — verde UDENAR + azul
│   ├── _variables.scss              # Design tokens (colores, espaciado, z-index…)
│   ├── _typography.scss             # Inter font, clases tipográficas
│   ├── _mixins.scss                 # Breakpoints responsive (xs/sm/md/lg/xl)
│   ├── _grid.scss                   # Grid system (.cols-1..4, .auto-fill-*)
│   ├── _animations.scss             # Shimmer, fade-in, slide-up, bounce
│   └── _accessibility.scss          # Skip links, prefers-reduced-motion, focus
│
├── locale/                          # i18n — archivos XLIFF (es/en)
│
├── app/
│   ├── core/                        # Singleton — servicios, guards, interceptors
│   │   ├── enums/                   # UserRole, ApplicationStatus, ProjectType…
│   │   ├── guards/                  # authGuard, guestGuard, roleGuard
│   │   ├── interceptors/            # authInterceptor, errorInterceptor, loadingInterceptor
│   │   ├── models/                  # Interfaces TypeScript (User, Project, Application…)
│   │   ├── resources/               # httpResource helpers
│   │   └── services/                # AuthService, ToastService, WebSocketService…
│   │
│   ├── state/                       # NgRx SignalStore global
│   │   ├── auth.store.ts            # Autenticación — user, token, role, isStudent/isCompany…
│   │   ├── ui.store.ts              # UI — sidebar, theme (light/dark/system), breakpoints
│   │   └── notifications.store.ts   # Notificaciones en tiempo real
│   │
│   ├── shared/                      # Componentes, pipes, directivas reutilizables
│   │   ├── animations/              # routeAnimation, listAnimation, sidebarAnimation…
│   │   ├── components/
│   │   │   ├── layout/              # MainLayout, AuthLayout, Header, Sidebar, Footer, Breadcrumbs
│   │   │   ├── cards/               # ProjectCard, ApplicationCard, MatchScoreCard
│   │   │   └── ui/                  # DataTable, StatCard, ConfirmDialog, EmptyState,
│   │   │                            # FileUpload, SearchFilterBar, Skeleton, StarRating,
│   │   │                            # StatusBadge, Timeline, Paginator, SkillChipList,
│   │   │                            # MatchScoreBar, ApplicationProgressStepper
│   │   ├── directives/              # ClickOutside, IntersectionObserver, AutoFocus
│   │   ├── pipes/                   # RelativeTime, Truncate, FileSize, HighlightSearch, InitialsPipe
│   │   ├── validators/              # Validadores custom de formulario
│   │   └── utils/                   # Funciones utilitarias
│   │
│   └── features/                    # Módulos por dominio (lazy-loaded)
│       ├── auth/                    # Login, Register, ForgotPassword, ResetPassword, VerifyEmail
│       ├── dashboard/               # DashboardRouter → Student / Company / Faculty / AdminRedirect
│       ├── projects/                # ProjectList, ProjectDetail, MyProjectsList, Create, Edit, Applicants
│       ├── applications/            # MyApplicationsList, ApplicationDetail, ReceivedApplications, Review
│       ├── matching/                # RecommendationsList, MatchDetail
│       ├── chat/                    # ChatContainer, ChatRoom, ConversationList, MessageBubble, TypingIndicator
│       ├── evaluations/             # EvaluationList, EvaluationCreate, EvaluationDetail
│       ├── notifications/           # NotificationCenter
│       ├── admin/                   # AdminAnalytics, CompanyVerifications, VerificationDetail,
│       │                            # SupervisorAssignments, PeriodManagement, UserManagement
│       ├── faculty/                 # AssignedStudentsList, StudentSupervision
│       ├── profile/                 # ProfileView, ProfileEdit, SkillsManager, DocumentsManager,
│       │                            # StudentPublicProfile, CompanyPublicProfile, Settings
│       ├── students/                # StudentService
│       └── analytics/               # AnalyticsService
```

## Features Implementados

### Autenticación (Auth)
- Login con email/contraseña + toggle de visibilidad
- Registro multi-paso: selección de rol → formulario Student o Company (stepper)
- Forgot password, reset password (con token), verificación email
- Guards: `authGuard`, `guestGuard`, `roleGuard(roles)`
- Interceptors: JWT auto-inject, error handler global, loading counter

### Dashboards (por rol)
- **Estudiante:** 4 stat-cards, recomendaciones de matching (top 3 con score), aplicaciones activas, notificaciones recientes
- **Empresa:** stat-cards, aplicaciones pendientes, mis proyectos, actividad reciente
- **Docente:** estudiantes asignados con tabla de avance, evaluaciones pendientes
- **Admin:** redirige a `/admin/dashboard` con panel analítico completo

### Proyectos
- Listado público con filtros (búsqueda, tipo, skills, modalidad, ordenamiento) + paginación
- Detalle de proyecto con información completa, skills requeridas y acción "Aplicar"
- CRUD de proyectos para empresas (crear, editar, listar)
- Vista de aplicantes por proyecto con acciones de aceptar/rechazar

### Aplicaciones
- Lista de mis aplicaciones (estudiante) con status badges y progress stepper
- Detalle de aplicación con timeline de eventos
- Aplicaciones recibidas (empresa) con filtros y revisión detallada
- Diálogo de apply con carta de motivación

### Matching
- Lista de recomendaciones con match score visual (barras de progreso)
- Detalle de match: desglose de score por categoría (skills, ubicación, horario, etc.)

### Chat (tiempo real)
- Lista de conversaciones con búsqueda y último mensaje
- Sala de chat con burbujas de mensaje, indicador de escritura
- WebSocket via socket.io-client

### Evaluaciones
- Lista de evaluaciones dadas/recibidas
- Creación de evaluación con StarRating, criterios múltiples y comentarios
- Detalle de evaluación readonly

### Notificaciones
- Centro de notificaciones con filtros (todas, no leídas) y marcar como leídas
- Badge de contador en tiempo real (WebSocket)

### Administración
- Panel analítico con 5 stat-cards comparativas, gráficos placeholder, acciones pendientes
- Verificación de empresas: lista con filtro de estado + detalle con aprobar/rechazar
- Asignación de supervisores docentes a estudiantes
- Gestión de periodos académicos (CRUD con diálogo)
- Gestión de usuarios con búsqueda y filtros (rol, estado)

### Docente (Faculty)
- Lista de estudiantes asignados con DataTable (avance, empresa, proyecto)
- Supervisión de estudiante: entregables, evaluaciones, barra de progreso

### Perfil
- Vista de perfil propio (estudiante: bio, skills, horas, documentos; empresa: logo, descripción, info)
- Edición de perfil con formularios reactivos por rol
- Gestor de skills con autocompletado y niveles de competencia
- Gestor de documentos con upload y categorías
- Perfiles públicos de estudiante y empresa

### Configuración (Settings)
- **Notificaciones:** 7 toggles (email, push, chat, aplicaciones, recomendaciones, evaluaciones, digest)
- **Cuenta:** email readonly, placeholder cambio contraseña, desactivar cuenta
- **Apariencia:** tema (light/dark/system via UiStore), idioma (es/en)

### Sistema de Diseño
- **Tema M3:** verde institucional UDENAR (green-palette) + azul complementario + tema oscuro
- **Variables CSS:** 90+ design tokens (colores, espaciado 4px, sombras, bordes, z-index, tipografía)
- **Tipografía:** Inter 300-700, clases utilitarias `.text-xs`–`.text-3xl`
- **Grid responsive:** `.grid .cols-1..4`, `.auto-fill-sm/md/lg`, `.container`
- **Mixins:** breakpoints `xs/sm/md/lg/xl`, `mobile/tablet/desktop`, helpers
- **Animaciones CSS:** shimmer skeleton, fade-in, slide-up, counter-bounce
- **Animaciones Angular:** route transitions, list stagger, sidebar expand/collapse, fade, slide
- **Accesibilidad:** skip-link, `prefers-reduced-motion`, `:focus-visible`, `.sr-only`, forced-colors
- **ToastService:** `success/error/warning/info` con MatSnackBar coloreado
- **i18n:** `@angular/localize`, sourceLocale `es`, locale `en` (XLIFF)

## Componentes UI Compartidos

| Componente | Descripción |
|---|---|
| `DataTableComponent<T>` | Tabla genérica con columnas tipadas, sorting, paginación |
| `StatCardComponent` | Card métrica con icono, valor, trend, color, clickable |
| `ConfirmDialogComponent` | Diálogo de confirmación (info/warning/danger) |
| `EmptyStateComponent` | Estado vacío con icono, título, mensaje, acción |
| `FileUploadComponent` | Upload con drag & drop, validación de tipo/tamaño |
| `SearchFilterBarComponent` | Barra de búsqueda con filtros configurables |
| `SkeletonComponent` | Loading placeholder con shimmer |
| `StarRatingComponent` | Rating de estrellas (readonly o editable) |
| `StatusBadgeComponent` | Badge de estado con colores semánticos |
| `TimelineComponent` | Línea de tiempo vertical de eventos |
| `PaginatorComponent` | Paginación con info y navegación |
| `SkillChipListComponent` | Lista de chips de skills con max visible |
| `MatchScoreBarComponent` | Barra visual de match score |
| `ApplicationProgressStepperComponent` | Stepper de progreso de aplicación |
| `ProjectCardComponent` | Card de proyecto con match score |
| `ApplicationCardComponent` | Card de aplicación con status |
| `MatchScoreCardComponent` | Card de score de matching |

## Rutas

### Públicas
| Ruta | Componente |
|---|---|
| `/auth/login` | LoginComponent |
| `/auth/register` | RegisterComponent |
| `/auth/register/student` | RegisterStudentComponent |
| `/auth/register/company` | RegisterCompanyComponent |
| `/auth/forgot-password` | ForgotPasswordComponent |
| `/auth/reset-password` | ResetPasswordComponent |
| `/auth/verify-email` | VerifyEmailComponent |
| `/projects` | ProjectListComponent |
| `/projects/:id` | ProjectDetailComponent |

### Autenticadas (cualquier rol)
`/dashboard`, `/profile/*`, `/notifications`, `/settings`, `/chat/*`

### Estudiante
`/my-applications/*`, `/matching/*`, `/my-evaluations/*`

### Empresa
`/my-projects/*`, `/received-applications/*`, `/my-evaluations/*`

### Docente
`/my-students/*`, `/my-evaluations/*`

### Admin
`/admin/dashboard`, `/admin/verifications/*`, `/admin/supervisors`, `/admin/periods`, `/admin/users`

## Desarrollo

### Servidor de desarrollo

```bash
ng serve
```

Navegar a `http://localhost:4200/`. Recarga automática al modificar archivos.

### Build

```bash
ng build                    # Producción (SSR + prerender)
ng build --configuration development  # Desarrollo
```

Output en `dist/frontend/`. SSR habilitado con 32 rutas prerenderizadas.

### Tests

```bash
ng test          # Unit tests (Vitest)
ng e2e           # End-to-end (Playwright)
```

### i18n

```bash
ng extract-i18n --output-path src/locale --format xlf   # Extraer cadenas
ng build --localize                                       # Build localizado
```

### Temas

El tema se controla via `UiStore.setTheme('light' | 'dark' | 'system')`. Se persiste en localStorage y aplica la clase `.dark-theme` en `<html>`.

## Estadísticas del Proyecto

- **156 archivos TypeScript**
- **32 rutas prerenderizadas**
- **9 feature modules** (lazy-loaded)
- **17 componentes UI compartidos**
- **6 archivos SCSS de diseño** (theme, variables, typography, mixins, grid, animations, accessibility)
- **0 errores, 0 warnings** en build
