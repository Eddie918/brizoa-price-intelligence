# Brizoa

Una app para seguir precios y decidir cuándo comprar. Nació de una pregunta sencilla: ¿el descuento que veo es bueno o solo parece bueno?

[Ver demo](https://Eddie918.github.io/brizoa-price-intelligence/)

## Qué hace

- Muestra el precio frente a su historial y permite explorar distintos periodos.
- Compara comprar hoy con esperar, usando tu presupuesto, objetivo y costo de espera.
- Permite organizar productos, guardar objetivos y exportar el radar.
- Acepta historial propio en JSON.

El demo usa tres productos de ejemplo y guarda los cambios en el navegador. Los datos importados se identifican por su fuente. La integración del backend con Apify obtiene precios actuales; no recupera el pasado.

## Desarrollo

React, TypeScript, Vite y Recharts. El backend usa SQLite/D1 y Drizzle. GitHub Actions ejecuta las pruebas y publica el demo en Pages.

```sh
pnpm install --frozen-lockfile
pnpm exec vite --config vite.demo.config.ts
```

Para comprobar y compilar:

```sh
node --experimental-strip-types --test tests/*.test.mjs
pnpm exec tsc --noEmit
pnpm exec vite build --config vite.demo.config.ts
```

Requiere Node 22.13+ y pnpm 11.25.0. El resultado se genera en `dist-demo/`.

## Cómo se interpreta el precio

La lectura histórica compara ofertas equivalentes y requiere al menos 30 días previos de datos. El simulador es independiente: calcula el ahorro hipotético menos el costo de esperar que indique el usuario. No predice precios.

[Formato de importación](docs/history.md) · [Seguridad](SECURITY.md)

## Autor

[Saúl Arias](https://github.com/Eddie918) · [LinkedIn](https://www.linkedin.com/in/saularias) · saul.ariasst@gmail.com

MIT.
