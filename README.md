# RepeClub

RepeClub es una app para coleccionistas de figuritas: marcas las que tienes, detectas repetidas y encuentras personas de tu zona para hacer canjes mas rapido.

## Parte 1: para todo publico

### Que puedes hacer en RepeClub

- Llevar control de tu album de forma simple.
- Marcar figuritas faltantes y repetidas.
- Ver sugerencias de canje con otros coleccionistas.
- Gestionar propuestas de canje desde la misma app.

### Como funciona la app

1. Entras y creas/inicias tu perfil.
2. Cargas tu coleccion: que tienes, que te falta y que te sobra.
3. RepeClub compara tu inventario con otros usuarios.
4. La app te muestra matches de canje utiles.
5. Enviais propuesta, coordinan y listo.

### Modos de uso

- Modo online con Firebase: sincroniza tus datos y canjes entre dispositivos.
- Modo local/offline: puedes probar la app sin Firebase, guardando datos localmente.

### Para quien esta pensada

- Coleccionistas que quieren completar album mas rapido.
- Amigos, cursos, grupos de barrio o comunidades que canjean seguido.
- Cualquier persona que quiera dejar de buscar figuritas a mano en chats.

## Parte 2: tecnica

### Stack principal

- Frontend: React 19 + TypeScript
- Build tool: Vite 6
- UI: Tailwind CSS 4 + Lucide Icons + Motion
- Backend/BaaS: Firebase (Auth + Firestore)

### Estructura general

- `src/App.tsx`: layout principal, onboarding y navegacion.
- `src/components/AlbumGrid.tsx`: gestion visual de figuritas.
- `src/components/MatchMaker.tsx`: sugerencias y flujo de canjes.
- `src/components/Header.tsx`: perfil, notificaciones y acciones globales.
- `src/context/AppContext.tsx`: estado global de usuario/inventario/canjes.
- `src/firebase.ts`: inicializacion de Firebase y modo fallback offline.
- `firebase-blueprint.json`: referencia de entidades y colecciones Firestore.
- `firestore.rules`: reglas de seguridad de Firestore.

### Variables de entorno

Crea `.env.local` a partir de `.env.example` y completa al menos estas variables para habilitar Firebase:

- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Si no defines estas variables, la app arranca en modo local/offline.

### Scripts disponibles

- `npm run dev`: inicia entorno local en puerto 3000.
- `npm run build`: genera build de produccion en `dist/`.
- `npm run preview`: sirve localmente el build generado.
- `npm run lint`: chequeo de tipos con TypeScript.

### Levantar el proyecto en local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo local de entorno:

```bash
cp .env.example .env.local
```

3. Completa valores Firebase en `.env.local`.
4. Inicia la app:

```bash
npm run dev
```

### Despliegue

Como es una app Vite, puedes desplegar `dist/` en cualquier hosting estatico.

#### Opcion A: Vercel (recomendada)

1. Importa el repo en Vercel.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Carga todas las variables `VITE_FIREBASE_*` en Project Settings > Environment Variables.
5. Deploy.

#### Opcion B: Netlify

1. Conecta el repo en Netlify.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Agrega variables `VITE_FIREBASE_*` en Site settings > Environment variables.
5. Deploy.

### Checklist de seguridad antes de publicar repo

- No subir `.env.local` ni secretos.
- Verificar que `.env.example` solo tenga placeholders.
- Revisar `firestore.rules` antes de produccion.
- Rotar claves si alguna vez se expusieron en commits historicos.
- Ejecutar una busqueda rapida de patrones sensibles antes de cada release.

### Notas utiles para el equipo

- El nombre del paquete en `package.json` sigue como `react-example`; se puede renombrar si quieren alinear branding.
- Si cambian el modelo de datos, actualicen tambien `firebase-blueprint.json` para mantener documentacion tecnica consistente.
