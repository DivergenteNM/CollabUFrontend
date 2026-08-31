# Collab-U — Frontend

**Collab-U** es una plataforma web para la Facultad de Ingeniería de la Universidad de Nariño que centraliza la gestión de pasantías, prácticas profesionales y proyectos colaborativos entre **estudiantes**, **empresas**, **docentes/asesores** y **administración/Facultad**: publicación y postulación a oportunidades, emparejamiento (matching) entre perfiles y proyectos, seguimiento académico del proceso (anteproyecto, jurados, entregables), comunicación por chat, evaluación bidireccional y paneles institucionales de reportes y verificación.

Este repositorio contiene el **frontend** (SPA Angular). Toda la lógica de negocio y los datos viven en un repositorio hermano, **[CollabUBackend](https://github.com/JesusGD25/CollabUBackend)** (14 microservicios NestJS) — este frontend **no funciona de forma aislada**: necesita el API Gateway del backend corriendo en el puerto 3000 del mismo host. Ver [Puesta en marcha desde cero](#puesta-en-marcha-desde-cero-ambos-repos) para cómo levantar ambos juntos.

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
| socket.io-client | ^4.8.3 | WebSocket (chat y notificaciones en tiempo real) |
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
│   │   ├── guards/                  # authGuard, guestGuard, roleGuard, developmentStageGuard
│   │   ├── interceptors/            # authInterceptor, errorInterceptor, loadingInterceptor
│   │   ├── models/                  # Interfaces TypeScript (User, Project, Application, Conversation…)
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
│       ├── dashboard/                # DashboardRouter → Student / Company / Faculty / AdminRedirect
│       ├── projects/                 # ProjectList, ProjectDetail, MyProjectsList, Create, Edit, Applicants
│       ├── applications/             # MyApplicationsList, ApplicationDetail, ReceivedApplications, Review
│       ├── matching/                 # RecommendationsList, MatchDetail
│       ├── chat/                     # ChatContainer, ChatRoom, ConversationList, MessageBubble, TypingIndicator
│       ├── evaluations/              # EvaluationList, EvaluationCreate, EvaluationDetail
│       ├── notifications/            # NotificationCenter
│       ├── selection-workspace/      # Espacio de selección previo al desarrollo del proyecto
│       ├── workspace/                # Espacio de trabajo del proyecto ya en desarrollo
│       ├── admin/                    # AdminDashboard, Reports, CompanyVerifications, VerificationDetail,
│       │                             # SupervisorAssignments, AcademicProcess, PeriodManagement, UserManagement
│       ├── faculty/                  # AssignedStudentsList, StudentSupervision
│       ├── profile/                  # ProfileView, ProfileEdit, SkillsManager, DocumentsManager,
│       │                             # StudentPublicProfile, CompanyPublicProfile, Settings
│       ├── students/                 # StudentService
│       └── analytics/                # AnalyticsService
```

## Features Implementados

### Autenticación (Auth)
- Login con email/contraseña + toggle de visibilidad
- Registro multi-paso: selección de rol → formulario Student o Company (stepper)
- Forgot password, reset password (con token), verificación email
- Guards: `authGuard`, `guestGuard`, `roleGuard(roles)`, `developmentStageGuard` (dirige a selección o desarrollo según el estado real del proceso)
- Interceptors: JWT auto-inject, error handler global, loading counter

### Dashboards (por rol)
- **Estudiante:** stat-cards, recomendaciones de matching (top 3 con score y desglose de habilidades coincidentes/faltantes), aplicaciones activas, notificaciones recientes
- **Empresa:** stat-cards, aplicaciones pendientes, mis proyectos, actividad reciente
- **Docente:** estudiantes asignados con tabla de avance, evaluaciones pendientes
- **Admin:** redirige a `/admin/dashboard` con panel analítico, cola de trabajo académico y módulo de reportes

### Proyectos
- Listado público con filtros (búsqueda, tipo, skills, modalidad, ordenamiento) + paginación
- Detalle de proyecto con información completa, skills requeridas y acción "Aplicar"
- CRUD de proyectos para empresas (crear, editar, listar)
- Vista de aplicantes por proyecto con acciones de aceptar/rechazar

### Aplicaciones y espacio de trabajo del proyecto
- Lista de mis aplicaciones (estudiante) con status badges y progress stepper
- Detalle de aplicación con timeline de eventos
- Aplicaciones recibidas (empresa) con filtros y revisión detallada
- Espacio de **selección** (previo al desarrollo: asesor, anteproyecto, jurados) con tarjeta de estado de proceso, y espacio de **desarrollo** (proyecto ya en marcha: entregables, chat propio)

### Matching
- Lista de recomendaciones con match score visual (barras de progreso) y chips de habilidades coincidentes/faltantes en la propia tarjeta
- Detalle de match: desglose de score por categoría (skills, ubicación, horario, etc.)

### Chat (tiempo real)
- Vista `/chat` propia, separada del resto del flujo, con diseño en tarjeta
- Lista de conversaciones dividida en "Conversaciones" (directas) y "Grupos", con avatar y color diferenciados
- Una conversación directa vinculada a un proyecto muestra el **título del proyecto** como nombre principal (en vez del nombre del otro participante), resuelto contra `project-service`
- Sala de chat con burbujas de mensaje, indicador de escritura, aviso de estado de conexión y reintento de envío ante fallo
- WebSocket vía socket.io-client

### Evaluaciones
- Lista de evaluaciones dadas/recibidas
- Creación de evaluación con StarRating, criterios múltiples y comentarios
- Detalle de evaluación readonly

### Notificaciones
- Centro de notificaciones con filtros (todas, no leídas) y marcar como leídas
- Badge de contador en tiempo real (WebSocket)

### Administración
- Menú lateral administrativo agrupado por dominio (verificación institucional, seguimiento académico, configuración, reportes)
- Panel analítico con stat-cards comparativas y acciones pendientes
- Cola de trabajo académico: casos activos organizados por estado, con búsqueda
- Módulo de reportes institucionales
- Verificación de empresas: lista con filtro de estado + detalle con aprobar/rechazar
- Asignación de asesores/supervisores docentes a estudiantes
- Gestión de periodos académicos (CRUD con diálogo)
- Gestión de usuarios con búsqueda y filtros (rol, estado)

### Docente (Faculty)
- Lista de estudiantes asignados con DataTable (avance, empresa, proyecto)
- Supervisión de estudiante: entregables, evaluaciones, barra de progreso, participación en jurados de anteproyecto

### Perfil
- Vista de perfil propio (estudiante: bio, skills, horas, documentos; empresa: logo, descripción, info)
- Edición de perfil con formularios reactivos por rol, con accesos directos a edición de habilidades y documentos
- Gestor de skills con autocompletado y niveles de competencia
- Gestor de documentos con upload y categorías
- Perfiles públicos de estudiante y empresa

### Configuración (Settings)
- **Notificaciones:** toggles (email, push, chat, aplicaciones, recomendaciones, evaluaciones, digest)
- **Cuenta:** email readonly, cambio de contraseña, desactivar cuenta
- **Apariencia:** tema (light/dark/system vía `UiStore`), idioma (es/en)

### Sistema de Diseño
- **Tema M3:** verde institucional UDENAR (green-palette) + azul complementario + tema oscuro
- **Variables CSS:** design tokens (colores, espaciado 4px, sombras, bordes, z-index, tipografía)
- **Tipografía:** Inter 300-700, clases utilitarias `.text-xs`–`.text-3xl`
- **Grid responsive:** `.grid .cols-1..4`, `.auto-fill-sm/md/lg`, `.container`
- **Animaciones CSS y Angular:** shimmer skeleton, fade-in, slide-up, route transitions, list stagger, sidebar expand/collapse
- **Accesibilidad:** skip-link, `prefers-reduced-motion`, `:focus-visible`, `.sr-only`, forced-colors
- **ToastService:** `success/error/warning/info` con MatSnackBar coloreado
- **i18n:** `@angular/localize`, sourceLocale `es`, locale `en` (XLIFF)

## Componentes UI Compartidos

| Componente | Descripción |
|---|---|
| `DataTableComponent<T>` | Tabla genérica con columnas tipadas, sorting, paginación |
| `StatCardComponent` | Card métrica con icono, valor, trend, color, tooltip de ayuda contextual, clickable |
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
`/my-applications/*`, `/matching/*`, `/my-evaluations/*`, `/selection-workspace/:id`, `/workspace/:id`

### Empresa
`/my-projects/*`, `/received-applications/*`, `/my-evaluations/*`

### Docente
`/my-students/*`, `/my-evaluations/*`

### Admin
`/admin/dashboard`, `/admin/verifications/*`, `/admin/supervisors`, `/admin/academic-process`, `/admin/reports`, `/admin/periods`, `/admin/users`

---

## Puesta en marcha desde cero (ambos repos)

Este frontend **necesita el backend corriendo primero**: sin el API Gateway en el puerto 3000, la app carga pero ningún dato real aparece (login, proyectos, chat, etc. dependen todos de la API). Hay dos formas de levantar todo el proyecto — elige una en el repo del backend y termina aquí con el frontend.

### Prerequisitos

| Herramienta | Versión mínima | Verificar con |
|-------------|---------------|---------------|
| Node.js | 20+ (probado con 24) | `node -v` |
| npm | 9+ | `npm -v` |
| Docker Desktop | 4+ (solo si vas a levantar el backend, ver su README) | `docker --version` |
| Git | 2+ | `git --version` |

### Paso 0 — Clonar ambos repositorios como carpetas hermanas

```bash
mkdir CollabU && cd CollabU
git clone https://github.com/JesusGD25/CollabUBackend.git Backend
git clone https://github.com/DivergenteNM/CollabUFrontend.git CollabUFrontend
```

```
CollabU/
├── Backend/           ← repositorio del backend
└── CollabUFrontend/   ← este repositorio
```

### Paso 1 — Levantar el backend

Sigue la sección **"Puesta en marcha desde cero"** de [`../Backend/README.md`](../Backend/README.md) — resumen de la ruta de desarrollo local:

```bash
cd ../Backend
cp .env.example .env
cd shared && npm install && npm run build && cd ..
# instalar dependencias de los 14 servicios (ver Backend/README.md para el bloque completo)
cd docker && docker compose up -d && cd ..
# arrancar los 14 servicios con npm run start:dev (ver Backend/README.md)
cd scripts && .\Run-Seed.ps1   # sembrar datos de prueba (PowerShell)
```

Confirma que responde antes de continuar:

```bash
curl http://localhost:3000/health
```

> Alternativa: la **Ruta B (todo en Docker)** del README del backend levanta backend **y** este frontend con un solo `docker compose up -d --build`, sirviendo el frontend ya compilado en el puerto 4200 — en ese caso no necesitas los pasos 2 y 3 siguientes.

### Paso 2 — Instalar dependencias del frontend

```bash
cd ../CollabUFrontend
npm install
```

### Paso 3 — Levantar el servidor de desarrollo

```bash
npm start
```

Disponible en **http://localhost:4200/**. El frontend calcula la URL del API en tiempo real a partir del host desde el que se sirve (`src/environments/environment.ts`): si el gateway del backend está en el puerto 3000 del mismo host, **no se necesita ninguna configuración adicional**. Esto también funciona si accedes desde otra IP de la misma red (por ejemplo, `http://192.168.1.50:4200`), siempre que el backend esté publicado en el puerto 3000 de esa misma IP.

### Cuentas de prueba

Una vez sembrado el backend (`Run-Seed.ps1`), todas las cuentas usan la contraseña **`CollabU2026!`**. Tabla completa de cuentas por rol y escenarios de proceso académico cubiertos: `Backend/GUIA_EJECUCION.md`, sección "Cuentas de Prueba y Escenarios Cubiertos". Accesos rápidos:

| Rol | Cuenta |
|---|---|
| Administrador | `admin01@collabu.dev` |
| Empresa verificada | `company01@collabu.dev` |
| Docente / asesor | `faculty01@collabu.dev` |
| Estudiante | `student01@collabu.dev` … `student19@collabu.dev` |

---

## Desarrollo

### Servidor de desarrollo

```bash
npm start          # equivalente a: ng serve
```

Navegar a `http://localhost:4200/`. Recarga automática al modificar archivos.

### Build

```bash
npm run build                          # Producción (SSR + prerender)
ng build --configuration development   # Desarrollo
```

Output en `dist/frontend/`. Servir el build SSR de forma standalone (sin `ng serve`):

```bash
npm run serve:ssr:frontend
```

### Tests

```bash
npm test          # Unit tests (Vitest) — 248 pruebas / 35 archivos, 100% en verde
npm run e2e        # End-to-end (Playwright)
```

### Lint

```bash
npm run lint        # ESLint (TS) + Stylelint (SCSS)
npm run lint:fix
```

### i18n

```bash
ng extract-i18n --output-path src/locale --format xlf   # Extraer cadenas
ng build --localize                                       # Build localizado
```

### Temas

El tema se controla vía `UiStore.setTheme('light' | 'dark' | 'system')`. Se persiste en localStorage y aplica la clase `.dark-theme` en `<html>`.

---

## Documentación adicional

| Documento | Contenido |
|---|---|
| [`../Backend/README.md`](../Backend/README.md) | Cómo levantar el backend (dev local o todo en Docker), arquitectura de microservicios |
| [`../Backend/GUIA_EJECUCION.md`](../Backend/GUIA_EJECUCION.md) | Guía detallada de desarrollo local: seed, cuentas de prueba, troubleshooting |
| [`../Backend/GUIA_DESPLIEGUE_DOCKER_PRODUCCION.md`](../Backend/GUIA_DESPLIEGUE_DOCKER_PRODUCCION.md) | Despliegue 100% Docker de backend + este frontend |
| `MIGRATION_NOTES.md` | Notas de migración de versiones de Angular/dependencias |

## Estadísticas del Proyecto

- **156+ archivos TypeScript**
- **32 rutas prerenderizadas** (SSR)
- **9+ feature modules** (lazy-loaded)
- **17 componentes UI compartidos**
- **248 pruebas unitarias** (Vitest), 35 archivos de prueba, 100% en verde
- **7 archivos SCSS de diseño** (theme, variables, typography, mixins, grid, animations, accessibility)
- **0 errores, 0 warnings** en build de producción
