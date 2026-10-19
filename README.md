# Mi Control Financiero — PWA v1

Prototipo inicial para finanzas personales y del negocio SCT por separado.

## Funciones
- Captura por formulario y por texto natural con reglas sencillas.
- Confirmación explícita antes de guardar.
- Ámbitos Personal / Negocio SCT y vista consolidada.
- Categorías, cuentas y transferencias con cuenta de destino.
- Persistencia local mediante IndexedDB.
- Panel de ingresos, gastos y flujo neto.
- Exportación CSV de los movimientos del ámbito seleccionado.
- Manifest y service worker para preparar instalación PWA.

## Cómo probar
1. Extrae el ZIP.
2. Sirve la carpeta desde un servidor local o HTTPS. Por ejemplo, con Python instalado: `python -m http.server 8000`
3. Abre `http://localhost:8000` en el navegador. En Android, despliega la app desde un alojamiento HTTPS para ofrecer instalación.
4. Registra movimientos de prueba, confirma y recarga la página para comprobar que siguen guardados.
5. Exporta CSV antes de borrar datos.

No se recomienda abrir `index.html` como archivo local: el service worker y algunas funciones de PWA requieren HTTP/HTTPS.

## Límites importantes de esta versión
- El analizador de texto es heurístico, no una IA financiera y puede equivocarse. Revisa cada campo.
- No hay conexión bancaria, sincronización entre dispositivos, usuarios, cifrado de base de datos, ni respaldo en nube.
- Los datos viven en el almacenamiento del navegador y pueden perderse si se borra el almacenamiento del sitio o se pierde el dispositivo.
- Las transferencias se muestran como movimiento operativo y no se incluyen en el cálculo de ingresos/gastos.
- No es software contable/fiscal certificado.

## Próxima etapa de producción
- Añadir autenticación y base de datos PostgreSQL con políticas de acceso por usuario/espacio.
- Separar libro personal y libro empresarial; definir si SCT opera como actividad empresarial individual o entidad separada.
- Libro de doble partida, conciliación de saldos iniciales, tarjetas y pagos sin duplicidad.
- Backups cifrados, exportación completa y política de retención.
- Pruebas automatizadas, validación de importes y revisión de seguridad.
