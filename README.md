<<<<<<< HEAD
# 🚨 CrisisMap Colombia (MVP)

> **Aplicación PWA móvil ultrarrápida de apoyo visual y reporte en tiempo real para situaciones de emergencia y desastres naturales (sismos, derrumbes, inundaciones).**

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2FPostGIS-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Objetivo del Proyecto

En una situación de emergencia, **el tiempo y la simplicidad salvan vidas**. La infraestructura de red suele colapsar (conectividad 3G/lenta) y los usuarios operan bajo alto estrés, con poca batería y sin tiempo para completar formularios extensos.

**CrisisMap Colombia** permite en cuestión de segundos:

- 🗺️ **Visualizar zonas de riesgo** activas en un mapa interactivo.
- 🚨 **Reportar vías bloqueadas y peligros estructurales**.
- 📦 **Identificar puntos de acopio** e informar sus necesidades críticas en tiempo real.
- 📋 **Consultar necesidades urgentes** mediante un panel deslizable priorizado.
- 👍 **Confirmar reportes (+1)** de otros ciudadanos para validar su veracidad sin crear cuentas de usuario.

---

## ⚡ Principios de Diseño

1. **Simplicidad Absoluta:** Diseñado para utilizarse en menos de 1 minuto.
2. **Mobile-First & Alto Contraste:** Interfaz clara, táctil, accesible y con semáforos de color visuales.
3. **Carga Ligera:** Optimizado para redes 3G y bajo consumo de datos móviles mediante carga dinámica (_Lazy Loading_).
4. **Expiración Automática (12h):** Evita la acumulación de datos obsoletos en el mapa.
5. **Sin Ficción de Registro:** Acceso público inmediato, sin logins ni contraseñas.

---

## 🛠️ Stack Tecnológico

- **Frontend / Framework:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- **Componentes / Iconos:** Lucide React.
- **Mapas / WebGIS:** Leaflet.js, React-Leaflet, OpenStreetMap.
- **Backend:** Next.js Server Actions.
- **Base de Datos:** Supabase (PostgreSQL + extensión PostGIS habilitada).
- **Seguridad:** Row Level Security (RLS) & Funciones Almacenadas RPC.
- **Despliegue:** Vercel.

---

## 📂 Estructura del Proyecto

````text
crisismap-colombia/
├── app/
│   ├── actions.ts          # Server Actions (Create report, Upvote, Fetch active)
│   ├── layout.tsx           # Layout global Next.js
│   └── page.tsx             # Pantalla principal (Header + Mapa + NeedsList + Form)
├── components/
│   ├── CrisisMap.tsx        # Mapa interactivo Leaflet (Client Component)
│   ├── NeedsList.tsx        # Panel deslizante de necesidades críticas (Drawer)
│   └── ReportForm.tsx       # Formulario táctil + selector manual de posición
├── lib/
│   └── supabaseClient.ts    # Cliente Supabase e interfaces TypeScript
├── public/
│   ├── manifest.json        # Manifiesto PWA para instalación móvil
│   └── icons/               # Iconos de la PWA
├── schema.sql               # Script SQL para base de datos y políticas RLS
├── tailwind.config.ts       # Configuración de Tailwind CSS
└── package.json


## 🛠️ Primeros pasos

Primero, inicia el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
````

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

Puedes empezar a editar la página modificando `app/page.tsx`. La página se actualiza automáticamente a medida que editas el archivo.

Este proyecto utiliza [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) para optimizar y cargar automáticamente [Geist](https://vercel.com/font), una nueva familia tipográfica de Vercel.
=======
# crisismap-colombia
App de reporte de emergencias para Colombia
>>>>>>> f6fd47e30318d5acb1dcee91733b147c36e9b0e7
