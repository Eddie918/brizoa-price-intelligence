# Historial propio

Importa JSON con asin, title, source y observations (hasta 5000 registros / 2 MB). Cada observación debe incluir at (fecha ISO), totalMinor (centavos), currency (MXN), offerKey (misma variante, vendedor, condición y envío), inStock y complete (booleanos).

Marca complete solo cuando conozcas el costo total. Los datos son aportados por el usuario, no verificados automáticamente. No rellenes días vacíos. Las fechas futuras y registros duplicados se rechazan.

También puedes importar una respuesta JSON de Keepa con un solo producto de México (domainId 11). Se interpreta csv[0], la serie de precios de Amazon, conservando sus cambios fechados y marcas de no disponibilidad. No se convierten cambios de precio en supuestas observaciones diarias. El envío queda sin confirmar, por lo que esta importación no habilita por sí sola recomendaciones de compra.

El archivo de Keepa debe obtenerse por una vía autorizada. El demo no consulta su API ni pide credenciales. Apify solo proporciona la fotografía actual.
