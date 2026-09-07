# Archivos de demostración

Versiones de `server.js` preparadas para los tres momentos en que la aplicación
tiene que cambiar durante el curso. **No tipees código en vivo**: copiá el
archivo, mostrá el `diff` en pantalla, y seguí.

| Momento | Archivo | Comando |
|---|---|---|
| Sesión 2, min 70 — rolling update manual | `server-v2.js` | `cp demo/server-v2.js server.js` |
| Sesión 3, min 70 — despliegue automático | `server-v2.js` con `v3` | editar la constante a `"v3"` |
| Sesión 3, min 85 — el fallo a propósito | `server-healthcheck-roto.js` | `cp demo/server-healthcheck-roto.js server.js` |

Después de cada copia, mostrá qué cambió antes de desplegar:

```bash
git diff --stat
git diff server.js | head -20
```

Para volver al original en cualquier momento:

```bash
git checkout server.js
```

## Antes de la sesión 3

Dejá el repositorio limpio y en `v1`, con el workflow ya commiteado pero
**sin haber corrido nunca**. La primera corrida tiene que pasar frente a ellos:
ver el job arrancar solo después de un `git push` es el momento que justifica
las seis horas.
