# OpenBOR Input Overlay — Roadmap

OpenBOR Input Overlay es un proyecto público independiente de Inpulsar Community Edition y de Inpulsar Signature. Su release pública histórica conocida sigue siendo v1.2.5. El código original se publica bajo MIT; `LICENSE` y `RIGHTS.md` delimitan los permisos sobre código, assets y marcas. Las licencias de terceros siguen vigentes. La verificación posterior de empaquetados de prueba no establece la conformidad de los ejecutables históricos publicados.

## Estado posterior a E3 — Limited Corrective Maintenance

- Conservar las releases históricas y sus referencias.
- Evaluar únicamente defectos justificados, problemas de seguridad y compatibilidad, según disponibilidad y prioridad.
- No hay compromiso de nuevas funcionalidades, soporte permanente, SLA, fechas de revisión, v1.2.6 ni otras releases o calendario de publicaciones.
- Mantener esta línea independiente de Inpulsar Community Edition e Inpulsar Signature, sin comprometer downports de sus capacidades.

## E3 — Open source y mantenimiento — COMPLETE

1. El código y la documentación originales se publicaron bajo [MIT](LICENSE), con copyright de Gerardo Chavez. Neon Pulsar Labs figura como nombre de publicación, no como titular separado; [RIGHTS.md](RIGHTS.md) distingue los permisos específicos de gráficos y marcas, junto con el [aviso del logo](renderer/assets/brand/NOTICE.md).
2. Se reunieron los [avisos y materiales de terceros](legal/THIRD-PARTY-NOTICES.md), las [fuentes nativas](legal/native-source/) y el [procedimiento de reconstrucción y reenlace LGPL](legal/RELINKING.md). El [registro de verificación](legal/VERIFICATION.md) documenta el reenlace demostrado de una copia modificada de `libuiohook` y la generación y verificación de un portable y un installer de prueba con sus materiales legales.
3. El [About](renderer/about.html) incorporó la identidad NPL y el selector ES / EN / PT-BR. Los README en [español](README.md), [inglés](README.en.md) y [portugués de Brasil](README.pt-BR.md) quedaron alineados con las licencias y el mantenimiento limitado.
4. Se establecieron las políticas de [contribución](CONTRIBUTING.md), [reporte de seguridad](SECURITY.md) y [soporte](SUPPORT.md), sin prometer aceptación de propuestas ni plazos.

E3.1d validó empaquetados de prueba posteriores; los ejecutables históricos v1.2.5 ya publicados no fueron sustituidos ni corregidos retroactivamente. No se publicó una nueva release como parte de E3. Esa validación no demuestra por sí sola la conformidad de la distribución histórica; el [registro de verificación](legal/VERIFICATION.md) delimita su alcance.

## Relación con el ecosistema

`ijchavez/openbor-input-overlay-private` es la fuente privada compartida de Inpulsar Community Edition (freeware, desarrollo activo) e Inpulsar Signature (premium, roadmap Early Access). `ijchavez/inpulsar` presenta esas ediciones y debe identificar las descargas históricas de OpenBOR Input Overlay v1.2.5 hasta disponer de una release Community real. Neon Pulsar Labs es el nombre de fantasía y publisher utilizado por Gerardo Chavez; no es una persona jurídica independiente.

Cada repositorio mantiene su propio roadmap, branch, revisión y release. Este roadmap no traslada al proyecto público el backlog técnico ni los compromisos de distribución de las ediciones privadas.

## Flujo Git

Antes de una corrección o actualización documental, verificar `origin`, `master` remoto, branch, HEAD y working tree. Trabajar en una branch dedicada desde la base verificada, preparar sólo los archivos del alcance y revisar el diff. Commit, push, apertura de PR y merge corresponden al usuario. Tras el merge, sincronizar el checkout sin descartar cambios locales.
