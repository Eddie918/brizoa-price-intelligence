# Brizoa · Price Intelligence

Radar de precios con decisiones explicables: posición histórica, cobertura de datos y objetivos de compra.

## Demo de portafolio

Destino de publicación: https://Eddie918.github.io/brizoa-price-intelligence/

Demo estático con tema oscuro, gráficas por periodo, búsqueda, objetivos, alertas locales, archivo y exportación. No consulta Amazon ni necesita credenciales. Los cambios se guardan únicamente en el navegador.

Los tres productos de ejemplo tienen series sintéticas identificadas. Agregar una URL crea una ficha manual sin inventar precio ni historial. La importación JSON permite explorar registros propios o autorizados; su procedencia queda indicada, sin verificación independiente.

## Historial: alcance y límites

- Apify obtiene una fotografía actual; no recupera el pasado.
- El backend guarda observaciones confirmadas desde el inicio del seguimiento. Aún no hay recolector periódico autónomo.
- Se exigen 30 días previos comparables para emitir una lectura histórica.
- No se mezclan ofertas ni monedas. Un costo incompleto o desactualizado bloquea recomendaciones favorables.
- No se implementó Keepa ni se promete acceso gratuito a su API.

## Importación JSON

Hasta 2 MB y 5000 observaciones. El archivo contiene `asin`, `title`, `source` y `observations`. Cada observación incluye `at` (fecha ISO con zona horaria), `totalMinor` (centavos positivos), `currency: "MXN"`, `offerKey` (variante/vendedor/condición/envío), `inStock` y `complete` (booleanos).

Usa `complete: true` solo si conoces el costo total. No inventes registros para rellenar días vacíos. Se rechazan fechas futuras, duplicados e importes inválidos. Reemplazar un historial existente requiere confirmación. La fuente declarada por el usuario no certifica autenticidad.

## Desarrollo

Node 22.13+ y pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
node --experimental-strip-types --test tests/*.test.mjs
pnpm exec tsc --noEmit
pnpm exec vite --config vite.demo.config.ts
pnpm exec vite build --config vite.demo.config.ts
```

El demo se genera en `dist-demo/`. El workflow Portfolio Pages prueba, compila y publica ese directorio. En GitHub: Settings → Pages → Build and deployment → Source: GitHub Actions. El backend existente se despliega por separado y no se publica en Pages.

## Seguridad

Nunca introducir tokens en el demo. `APIFY_TOKEN` pertenece exclusivamente al servidor. `.env.example` no contiene valores y los archivos de entorno están ignorados. El backend requiere un perímetro autenticado: no exponer directamente su Worker sin adaptar la autenticación.

No se incluyen bases personales ni secretos en Pages. Véase [SECURITY.md](SECURITY.md). Se conservan las licencias obligatorias y la configuración técnica necesaria del backend.

## Autor y contacto

Saúl Arias · [GitHub](https://github.com/Eddie918) · [LinkedIn](https://www.linkedin.com/in/saularias) · saul.ariasst@gmail.com

Proyecto personal, no afiliado ni respaldado por Amazon. Licencia MIT.
