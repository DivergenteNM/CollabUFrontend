# Migration Notes

## Componentes con template o estilos inline (excepciones aprobadas)

| Componente | Archivo | Inline | Razon |
|---|---|---|---|
| App root | src/app/app.ts | template (~3 lineas) | Template minimo con router-outlet y animacion de ruta. |
| Admin redirect | src/app/features/dashboard/pages/admin-redirect/admin-redirect.component.ts | template (~1 linea), styles (~8 lineas) | Componente de redireccion simple con mensaje temporal de carga. |
| Dashboard router | src/app/features/dashboard/pages/dashboard-router/dashboard-router.component.ts | template (~6 lineas) | Router de dashboard con switch por rol, sin logica de vista compleja. |
