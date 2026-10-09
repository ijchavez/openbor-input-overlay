# OpenBOR Input Overlay — Roadmap

OpenBOR Input Overlay es un proyecto público independiente de Inpulsar Community Edition y de Inpulsar Signature. Su release estable conocida es v1.2.5. El código está públicamente disponible, pero la adopción de una licencia open source explícita y válida aún requiere auditoría y decisión. Hasta entonces, la disponibilidad del código no debe presentarse como permiso ya concedido para modificarlo o redistribuirlo.

## Dirección de mantenimiento

- Conservar las releases históricas y sus referencias.
- Considerar mantenimiento correctivo limitado para defectos justificados, seguridad o compatibilidad, según capacidad y prioridad.
- Evaluar una release de corrección, eventualmente v1.2.6, sólo si existe una razón concreta y se valida su contenido. No se establece cadencia de releases.
- Mantener esta línea independiente. Las capacidades nuevas de Community o Signature no se incorporan automáticamente ni se prometen como portables.
- Evitar downports automáticos y una segunda implementación activa del producto INPULSAR.

## E3 — Open source y mantenimiento — PLANNED

1. Auditar avisos de licencia existentes, derechos de autores y contribuyentes, y obligaciones de dependencias.
2. Separar la futura licencia del código de las licencias y permisos de logos, fuentes, imágenes, skins y demás assets.
3. Elegir y añadir una licencia explícita válida sólo tras esa auditoría y una decisión expresa. La meta es permitir estudiar, modificar y redistribuir el código conforme a sus términos.
4. Actualizar `README.md`, `README.en.md` y `README.pt-BR.md` para explicar con precisión licencia, contribuciones y alcance del mantenimiento.
5. Definir reglas de contribución, revisión y aceptación de correcciones, sin comprometer nuevas features ni plazos.

Este bloque es un plan. No declara completada la auditoría, elegida la licencia ni publicada una nueva release.

## Relación con el ecosistema

`ijchavez/openbor-input-overlay-private` es la fuente privada compartida de Inpulsar Community Edition (freeware, desarrollo activo) e Inpulsar Signature (premium, roadmap Early Access). `ijchavez/inpulsar` presenta esas ediciones y debe identificar las descargas históricas de OpenBOR Input Overlay v1.2.5 hasta disponer de una release Community real. Neon Pulsar Labs actúa como publisher institucional.

Cada repositorio mantiene su propio roadmap, branch, revisión y release. Este roadmap no traslada al proyecto público el backlog técnico ni los compromisos de distribución de las ediciones privadas.

## Flujo Git

Antes de una corrección o actualización documental, verificar `origin`, `master` remoto, branch, HEAD y working tree. Trabajar en una branch dedicada desde la base verificada, preparar sólo los archivos del alcance y revisar el diff. Commit, push, apertura de PR y merge corresponden al usuario. Tras el merge, sincronizar el checkout sin descartar cambios locales.
