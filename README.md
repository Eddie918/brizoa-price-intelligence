# Brizoa · Price Intelligence for Smarter Purchases

Plataforma privada de inteligencia de precios que convierte el historial de productos en recomendaciones de compra explicables.

**Demo:** https://brizoa.saul-ariasst.chatgpt.site

## Diferencial

- No presenta un precio aislado: muestra su posición frente al historial comparable.
- Separa evidencia, recomendación y urgencia personal para evitar falsas certezas.
- Permite definir objetivos, pausar alertas, archivar o eliminar productos y exportar el radar.
- Expone cuándo un dato es reciente, insuficiente o necesita verificación.

## Incluido
- App responsive, comparación histórica explicable, búsqueda, objetivos y archivo/reactivación.
- GET/POST `/api/watchlist`, PATCH `/api/watchlist/:id`.
- D1 con migraciones Drizzle; controles de propietario y validación estricta.
- Identidad del perímetro autenticado del hosting. No exponer el Worker sin ese perímetro.
- 22 pruebas del motor, parser y normalización de proveedor; compilación y type-check validados.
- Logo SVG nativo positivo/negativo; licencia tipográfica en `LICENSE-fonts.txt`.
- Autocompletado y limpieza de título desde URL, imagen, disponibilidad y precio actual mediante un actor externo de Apify.
- Conexión automática controlada de fichas pendientes, actualización manual con límite de 24 horas y errores visibles del proveedor.
- Títulos comerciales compactados automáticamente para conservar marca, producto y modelo sin textos promocionales extensos.
- Exportación del radar a CSV, manifiesto instalable y diseño responsive.
- Tema oscuro persistente, eliminación segura con cascada, resumen de cartera y nivel de evidencia explicable.

## Amazon México (integración opcional de bajo costo)

Brizoa puede consultar el actor `junglee/amazon-crawler` de Apify. Configura el token únicamente en el servidor:

```text
APIFY_TOKEN=...
```

Al agregar o actualizar una ficha, Brizoa solicita título, imagen, disponibilidad y precio para `www.amazon.com.mx`. Existe caché de 24 horas y no se activan vendedores, variantes ni resolución de CAPTCHA para cuidar la cuota gratuita. Si la variable no existe, guarda una ficha manual segura y nunca expone credenciales al navegador.

## Límites
Los ejemplos usan datos congelados al 19 de septiembre de 2026. Para productos reales, cada consulta confirmada se guarda como observación y el historial se construye hacia adelante. Brizoa no está afiliada ni respaldada por Amazon. Sin correo, push, pagos ni ML.

Antes de activar datos comerciales: verificar permisos, cobertura MX, conservación histórica y autorización para seguimiento/alertas. PA-API 5 fue sustituida por Creators API; cambiar API no concede automáticamente permiso para este caso de uso. Nombre y símbolo pendientes de disponibilidad comercial.

## Desarrollo
Node 22+, dependencias y lockfile existentes. `bash scripts/install-pnpm.sh`, `npm run dev`, `npm run build`. Type check: `node node_modules/typescript/bin/tsc --noEmit`. Pruebas: `node --experimental-strip-types --test tests/recommendation.test.mjs`.

Las migraciones publicadas son inmutables; agregar nuevas cuando cambie el esquema. No hacer DDL en inicialización de peticiones. Los artefactos `dist`, bases locales, sesiones de QA y credenciales no se versionan.

WebMCP: filtro opcional implementado con detección de soporte. El contexto de navegador de QA no expuso modelContext; validación específica no disponible. El filtro visible sí se comprobó.

## Contacto

- GitHub: https://github.com/Eddie918
- Email: saul.ariasst@gmail.com
- LinkedIn: https://www.linkedin.com/in/saularias
