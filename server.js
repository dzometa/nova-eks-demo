// DEMO — SESIÓN 2, minuto 70.
// Copiá este archivo sobre server.js para provocar el rolling update.
//   cp demo/server-v2.js server.js
// No lo tipees en vivo: escribir código frente a la clase es donde se pierden
// los minutos y donde aparece el typo que arruina la demostración.

const express = require("express");
const app = express();

const VERSION = process.env.APP_VERSION || "v6";   // <- lo único que cambia
const COMMIT = process.env.GIT_SHA || "local";

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/", (_req, res) => {
  res.json({
    app: "nova-demo",
    version: VERSION,
    commit: COMMIT,
    region: process.env.AWS_REGION || "us-east-2",   // <- campo nuevo, visible
    pod: process.env.HOSTNAME,
  });
});

app.listen(3000, () => console.log("escuchando en :3000"));
