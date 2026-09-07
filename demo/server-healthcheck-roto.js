// DEMO — SESIÓN 3, minuto 85. EL FALLO A PROPÓSITO.
// Copiá este archivo sobre server.js, commiteá y empujá.
//   cp demo/server-healthcheck-roto.js server.js
//   git commit -am "demo: romper el healthcheck a proposito" && git push
//
// Qué va a pasar, en este orden — narralo mientras ocurre:
//   1. El pipeline construye y publica la imagen sin problema. La imagen está
//      bien; lo que está mal es la aplicación. CI verde.
//   2. El "kubectl set image" pasa sin error.
//   3. Los pods nuevos arrancan, pero el readinessProbe recibe 500 y nunca
//      pasan a Ready. El Service no les manda tráfico.
//   4. "rollout status" se queda esperando y a los 180 s expira con código 1.
//   5. El job se pone ROJO y el paso "if: failure()" ejecuta el rollout undo.
//   6. En la ventana del curl en bucle: ni una sola respuesta perdida.

const express = require("express");
const app = express();

const VERSION = process.env.APP_VERSION || "v3-roto";
const COMMIT = process.env.GIT_SHA || "local";

// El healthcheck ahora falla. Para Kubernetes, este pod nunca está listo.
app.get("/healthz", (_req, res) => res.status(500).send("no disponible"));

app.get("/", (_req, res) => {
  res.json({
    app: "nova-demo",
    version: VERSION,
    commit: COMMIT,
    pod: process.env.HOSTNAME,
  });
});

app.listen(3000, () => console.log("escuchando en :3000"));
