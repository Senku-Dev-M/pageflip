# PageFlip - Biblioteca digital ciberpunk

PageFlip es una app web creada con Next.js 15 que combina el estilo de una biblioteca digital ciberpunk con integraciones en tiempo real. El catalogo consume el API publica de Open Library, mientras que prestamos, wishlist y sesiones se persisten en Firebase (Auth + Firestore). El resultado es un front-end 100 % TypeScript centrado en la experiencia de lectura y administracion de libros.

## Tabla de contenidos
- [Resumen](#resumen)
- [Caracteristicas clave](#caracteristicas-clave)
- [Stack tecnologico](#stack-tecnologico)
- [Arquitectura](#arquitectura)
- [Stores y estado](#stores-y-estado)
- [Integraciones externas](#integraciones-externas)
- [Tecnicas de rendimiento](#tecnicas-de-rendimiento)
- [Configuracion](#configuracion)
- [Variables de entorno](#variables-de-entorno)
- [Colecciones de Firestore](#colecciones-de-firestore)
- [Flujo de datos principal](#flujo-de-datos-principal)
- [Estilos y UX](#estilos-y-ux)
- [Scripts disponibles](#scripts-disponibles)
- [Calidad y recomendaciones](#calidad-y-recomendaciones)
- [Roadmap sugerido](#roadmap-sugerido)
- [Recursos](#recursos)

## Resumen

- Catalogo inicial renderizado en el servidor (`src/app/page.tsx`) con hidratacion de un cliente avanzado.
- Pagina de detalle dinamica (`src/app/book/[id]/page.tsx`) que amplifica metadata, recomendaciones y acciones de prestamo.
- Flujo completo de autenticacion con modales personalizados (login y registro) respaldados por Firebase Auth.
- Manejo de prestamos activos, historial y wishlist en tiempo real gracias a suscripciones a Firestore.
- Interfaz responsive con atmosfera neon y microinteracciones pensadas para portabilidad.

## Caracteristicas clave

- Catalogo con busqueda, filtros por categoria y ordenamiento con paginacion client-side optimizada.
- Acciones de prestamo y devolucion desde la tarjeta, la ficha del libro o los listados dedicados.
- Wishlist sincronizada por usuario y paneles especificos para prestamos activos e historial.
- Header con navegacion condicional, modales reutilizables y modo burger para dispositivos moviles.
- Componentes feature-first con estilos CSS Modules co-localizados y alias absolutos (`@/`).
- Notificaciones por correo a usuarios de wishlist cuando un libro vuelve a estar disponible.

## Stack tecnologico

- Next.js 15 (App Router, server components, `fetch` con `revalidate`).
- React 19 con Suspense, `lazy` y hooks concurrentes como `useDeferredValue`.
- TypeScript estricto con alias `@/*` definido en `tsconfig.json`.
- Firebase (Auth + Firestore) para identidad y persistencia en tiempo real.
- Zustand + Devtools para stores predecibles y trazables.
- CSS Modules y hoja global (`src/shared/styles/globals.css`) para la tematizacion ciberpunk.
- React Hot Toast para feedback no intrusivo.
- Herramientas de calidad: ESLint 9 y PostCSS.

## Arquitectura

```
src/
  app/                # Rutas Next.js con grupos (public) y (private), ademas de endpoints API
  modules/
    auth/             # API, UI (modales), hooks y store del dominio de autenticacion
    catalog/          # API externas, UI, hooks, store, utils y tipos del catalogo
  shared/
    ui/               # Componentes reutilizables como Header
    utils/            # Helpers agnosticos (ej. `cn`)
    styles/           # Estilos globales y tokens
    services/         # Integraciones transversales (espacio reservado)
  config/             # Singletons de configuracion (Firebase, constantes)
```

- Las paginas residen en `app/`, agrupadas en `(public)` y `(private)` para diferenciar flujos abiertos vs autenticados.
- Cada dominio vive en `modules/` y co-loca su API, UI, hooks, store y pruebas para mantener cohesion y escalabilidad.
- Los estilos globales se concentran en `shared/styles` y cada componente mantiene su propio `.module.css` adjunto.

## Stores y estado

| Store | Archivo | Dominio | Detalles |
| ----- | ------- | ------- | -------- |
| `useUserStore` | `src/modules/auth/store/useUserStore.ts` | Sesion y carga inicial | Mantiene usuario normalizado, integra devtools y controla `isLoading`. |
| `useBookStore` | `src/modules/catalog/store/useBookStore.ts` | Catalogo, filtros y paginacion | Sincroniza libros cargados, filtros, `useDeferredValue` y `AbortController` para busqueda. |
| `useBookLoansStore` | `src/modules/catalog/store/useBookLoansStore.ts` | Prestamos activos y por usuario | Expone selectores para disponibilidad y reutiliza en hooks `useBookLoans` y `useBookHistory`. |
| `useWishlistStore` | `src/modules/catalog/store/useWishlistStore.ts` | Wishlist por usuario | Guarda items suscritos en tiempo real y chequea existencia antes de agregar. |

Cada hook (`useBookLoans`, `useWishlist`, `useBookHistory`) comparte suscripciones a Firestore con contadores internos para evitar duplicar listeners cuando varios componentes montan simultaneamente.

## Integraciones externas

- **Open Library API** (`modules/catalog/api/booksApi.ts` y `app/(private)/book/[id]/page.tsx`): busqueda, fichas de obras y recomendaciones, con almacenamiento en cache via `revalidate`.
- **Firebase Auth** (`config/firebase.ts`, `modules/auth/api/auth.ts`): login, registro y cierre de sesion email/password.
- **Cloud Firestore** (`modules/catalog/api/loans.ts`, `modules/catalog/api/wishlist.ts`): colecciones `loans` y `wishlists` con suscripciones `onSnapshot`.
- **SendGrid** (`app/api/notifications/book-available/route.ts`): envia correos cuando un libro vuelve a estar disponible para las personas que lo tenian en wishlist.
- **Next Image**: manejo de portadas remotas habilitado mediante `next.config.ts`.

## Notificaciones por correo

El endpoint `POST /api/notifications/book-available` centraliza el envio de avisos cuando un libro observado vuelve a estar disponible:

- Espera un cuerpo JSON con `bookId` obligatorio y `bookTitle`, `bookAuthor`, `excludeUserId` opcionales.
- Consulta la coleccion `wishlists` en Firestore, deduplica por email y excluye al usuario que genero la notificacion (si se envia `excludeUserId`).
- Construye un mensaje de texto plano y lo envia via SendGrid usando las variables `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` y opcionalmente `SENDGRID_FROM_NAME`.
- Devuelve `{ notified: number }` con el total de destinatarios notificados o un codigo de error normalizado en caso de fallo.

Para probarlo manualmente puedes hacer un `fetch` desde el DevTools o un `curl` autenticado con la sesion vigente despues de insertar datos de wishlist de prueba en Firestore.

## Tecnicas de rendimiento

- Renderizado inicial en el servidor y `lazy()` + `Suspense` para diferir `CatalogFilters`, `BookGrid` y otros componentes pesados.
- Busqueda con `useDeferredValue`, debounce manual y `AbortController` para evitar peticiones obsoletas.
- Selectores especificos de Zustand, `useMemo` y `useCallback` para minimizar renders en cascada.
- Suscripciones compartidas a Firestore con recuento de consumidores para reducir costos de red y CPU.
- `fetch` server-side con `next: { revalidate: 3600 }` para cachear respuestas de Open Library.
- Componentes memoizados (`memo`) en tarjetas, filtros y grids para listas extensas.

## Configuracion

### Requisitos previos

- Node.js 20.0 o superior (Next.js 15 requiere Node >= 18.18; se recomienda la rama LTS 20).
- npm 10 (instalado junto con Node) o gestor equivalente.

### Instalacion rapida

1. Clonar el repositorio y entrar en la carpeta del proyecto.
2. Copiar `.env.example` a `.env.local` (o `.env`) y completar las credenciales de Firebase y SendGrid.
3. Instalar dependencias: `npm install`.
4. Levantar el entorno local: `npm run dev` y abrir `http://localhost:3000`.
5. Construir para produccion cuando sea necesario: `npm run build` seguido de `npm run start`.

## Variables de entorno

La app combina credenciales publicas para Firebase con secretos de servidor para los correos salientes. El archivo `.env.example` ya incluye todas las claves necesarias.

### Variables publicas (disponibles en el cliente)

| Variable | Descripcion |
| -------- | ----------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key del proyecto Firebase. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio auth (`xxxx.firebaseapp.com`). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID para servicios de Firebase. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Identificador de la app Firebase. |

### Variables privadas (solo en el entorno de servidor)

| Variable | Descripcion |
| -------- | ----------- |
| `SENDGRID_API_KEY` | Token con permisos para enviar correos via SendGrid. |
| `SENDGRID_FROM_EMAIL` | Direccion remitente verificada en SendGrid (e.g. `notificaciones@pageflip.io`). |
| `SENDGRID_FROM_NAME` | Nombre mostrado como remitente; opcional, por defecto `PageFlip`. |

Guarda todas las variables en `.env.local` (o el archivo `.env` correspondiente) y evita subirlas al control de versiones.

## Colecciones de Firestore

- `loans`: documentos con `bookId`, `title`, `borrowedBy`, fechas (`borrowedAt`, `dueDate`, `returnedAt`) y datos de usuario. Se consulta por `returnedAt == null` para prestamos activos y por `borrowedBy`.
- `wishlists`: documentos con `bookId`, `title`, `author`, `userId` y `addedAt`. Se consulta por usuario y se evita duplicar libros mediante queries previas.

La normalizacion en `loans.ts` y `wishlist.ts` transforma `Timestamp` en ISO strings listas para renderizar.

## Flujo de datos principal

- El catalogo se hidrata con libros renderizados en el servidor y luego sincroniza estado local en `useBookStore`.
- Los componentes de acciones (`BookCard`, `BookLoanActions`) consumen hooks que lean selectores de Zustand para disponibilidad y toasts.
- El header usa `useAuthSession` para escuchar a Firebase Auth y propagar el usuario al resto de la app.
- Paginas de prestamos, historial y wishlist montan suscripciones en `useBookLoans` / `useBookHistory` / `useWishlist`, reutilizando listeners cuando multiples vistas estan activas.

## Estilos y UX

- Tema oscuro global definido en `src/styles/globals.css` con variables CSS y helpers (`cyber-input`, `cyber-select`).
- Cada componente tiene su propio `.module.css` con efectos neon, brillos y degradados.
- El layout (`src/app/layout.tsx`) aloja el `Header` y deja espacio para futuros providers globales.

## Scripts disponibles

- `npm run dev`: inicia el entorno de desarrollo con recarga en caliente.
- `npm run build`: genera la version optimizada para produccion.
- `npm run start`: sirve la build producida.
- `npm run lint`: ejecuta ESLint con la configuracion de Next 15.

## Calidad y recomendaciones

- El proyecto usa TypeScript estricto y ESLint 9; se sugiere ejecutar `npm run lint` antes de cada commit.
- No existen pruebas automatizadas aun; considera agregar unit tests para hooks criticos y pruebas E2E para los flujos de prestamo.
- Aprovecha la extension Redux DevTools para inspeccionar stores de Zustand en desarrollo (`devtools` ya esta habilitado).

## Roadmap sugerido

- Integrar Firebase Analytics y un plan de caching adicional para mejorar observabilidad y tiempos de respuesta.
- Implementar persistencia offline o caching local para catalogo cuando la API externa falle.
- Integrar un gestor de toasts global (p.ej. `<Toaster />`) y mensajes de error mas detallados.
- Mejorar accesibilidad con avisos ARIA en modales y feedback del teclado.

## Recursos

- [Documentacion de Next.js](https://nextjs.org/docs)
- [SDK web de Firebase](https://firebase.google.com/docs/web/setup)
- [Open Library API](https://openlibrary.org/developers/api)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
