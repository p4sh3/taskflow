# TaskFlow — Sistema de Gestión de Tareas

Aplicación web de gestión de tareas desarrollada con **TypeScript vanilla + Vite**, sin React, Vue ni Angular. El proyecto implementa operaciones CRUD, filtros, búsqueda y persistencia mediante `localStorage`, con una arquitectura organizada por responsabilidades.

## Características

- Crear tareas con título, descripción, categoría y prioridad.
- Editar tareas existentes.
- Eliminar tareas con confirmación previa.
- Marcar tareas como completadas o pendientes.
- Filtrar por estado: todas, pendientes y completadas.
- Filtrar por prioridad: alta, media y baja.
- Buscar por título en tiempo real.
- Persistir los datos en `localStorage`.
- Recuperar automáticamente las tareas al iniciar.
- Panel de estadísticas con total, pendientes, completadas y alta prioridad.
- Diseño responsive para móvil, tablet y desktop.

## Tecnologías

- TypeScript 7.0.2
- Vite
- HTML5
- CSS3
- Web APIs: DOM, `localStorage`, `dialog`, `crypto.randomUUID()`

## Requisitos

- Node.js 20.19+ o una versión compatible con la versión instalada de Vite.
- TypeScript 7.0.2 (gestionado como dependencia de desarrollo del proyecto).
- npm, pnpm, yarn o Bun.

## Instalación

```bash
git clone https://github.com/p4sh3/taskflow.git
cd taskflow
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre la URL mostrada por Vite

## Build de producción

```bash
npm run build
```

Para comprobar únicamente el tipado:

```bash
npm run typecheck
```

Para previsualizar el build:

```bash
npm run preview
```

## Arquitectura

La aplicación sigue una separación inspirada en **Clean Architecture**, evitando que la lógica de negocio dependa directamente del DOM o de `localStorage`.

```text
src/
├── domain/
│   ├── task.ts
│   └── task-repository.ts
│
├── application/
│   └── task-service.ts
│
├── infrastructure/
│   └── local-storage-task-repository.ts
│
├── presentation/
│   └── task-view.ts
│
├── main.ts
└── style.css
```

### Domain

Contiene las entidades y contratos principales del sistema. `Task` representa una tarea y `TaskRepository` define las operaciones que necesita la aplicación para almacenar tareas.

### Application

`TaskService` contiene las reglas de negocio: creación, actualización, eliminación, cambio de estado, estadísticas, búsqueda y filtrado.

### Infrastructure

`LocalStorageTaskRepository` implementa el contrato `TaskRepository` utilizando la Web Storage API. Esto mantiene el almacenamiento aislado de la lógica de negocio.

### Presentation

`TaskView` se encarga del DOM, formularios, eventos, modal y renderizado de tareas. No contiene la lógica de persistencia.

## Persistencia

Las tareas se almacenan en `localStorage` bajo la clave:

```text
taskflow:tasks:v1
```

Por eso los datos permanecen disponibles después de recargar o cerrar el navegador, siempre que no se limpie el almacenamiento local del sitio.

## Flujo principal

```text
Usuario
  ↓
TaskView
  ↓
TaskService
  ↓
TaskRepository
  ↓
LocalStorageTaskRepository
  ↓
localStorage
```

Al invertir la dependencia mediante `TaskRepository`, sería posible sustituir `localStorage` por una API, IndexedDB u otra fuente de datos sin reescribir la lógica de negocio.
