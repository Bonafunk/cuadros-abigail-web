# Cuadros Abigail — catálogo conectado a Mercado Libre

Catálogo web sencillo: Mercado Libre sigue siendo el sistema principal de publicaciones y cobros. El sitio muestra productos activos, permite ocultar productos seleccionados y envía al comprador a la publicación original de Mercado Libre.

## Arquitectura

- Next.js en Vercel.
- Supabase para guardar el catálogo y la preferencia `is_hidden`.
- Mercado Libre API con OAuth.
- Webhook `POST /api/mercadolibre/webhook` para el tópico `items`.
- Proceso de sincronización inicial y reconciliación periódica para cubrir notificaciones perdidas.

## Decisiones funcionales

- Importar todos los productos activos del vendedor 37962663.
- Mostrar el mismo precio y moneda devueltos por la API.
- No procesar pagos ni pedidos en este sitio.
- El botón de compra abre `permalink` en Mercado Libre.
- `is_hidden` permite ocultar productos sin pausar la publicación en Mercado Libre.
- Publicaciones pausadas/finalizadas se retiran del catálogo público, sin borrar la configuración de ocultamiento.

## Variables necesarias

Copiar `.env.example` a variables de entorno en Vercel. Los secretos solo se guardan en el servidor.

## Configuración pendiente

1. Crear aplicación en Mercado Libre Developers y obtener Client ID/Secret.
2. Configurar OAuth y autorizar la cuenta vendedora.
3. Crear proyecto Supabase y ejecutar `supabase/schema.sql`.
4. Configurar las variables en Vercel.
5. Publicar el endpoint webhook y suscribir el tópico `items`.
6. Implementar el importador inicial, procesamiento asíncrono de eventos y reconciliación de `missed_feeds`.
7. Probar altas, cambios de precio, pausas y reactivaciones antes de publicar el dominio principal.

**No conectar el dominio principal ni anunciar sincronización activa hasta completar los pasos de configuración y pruebas.**
