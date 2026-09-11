// ---------------------------------------------------------------------------
//  nova-demo · servidor de la práctica de EKS
//
//  Sirve dos cosas distintas en la misma ruta "/":
//    · Un navegador  (Accept: text/html)  recibe la página documental.
//    · curl y demás  (Accept: */*)        reciben el JSON de siempre.
//
//  Eso mantiene funcionando TODOS los comandos del curso sin cambiarlos:
//    curl http://$ALB                          -> JSON
//    while true; do curl -s http://$ALB ...     -> JSON, una línea por segundo
//
//  Rutas:
//    /         página o JSON, según quién pregunte
//    /api      JSON siempre, sin importar el Accept (lo usa la página)
//    /healthz  200 "ok"  <- las sondas del pod y del ALB dependen de esto
// ---------------------------------------------------------------------------

const express = require("express");
const app = express();

const VERSION = process.env.APP_VERSION || "v6";   // <- lo único que cambia entre demos
const COMMIT  = process.env.GIT_SHA || "local";
const REGION  = process.env.AWS_REGION || "us-east-2";
const POD     = process.env.HOSTNAME || "sin-pod";
const NODE    = process.env.NODE_NAME || "";
const ARRANQUE = new Date();

// El kubelet y el ALB pegan acá. Si falla, el pod no recibe tráfico.
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

function estado() {
  return {
    app: "nova-demo",
    version: VERSION,
    commit: COMMIT,
    region: REGION,
    pod: POD,
    node: NODE || undefined,
    uptime_s: Math.round((Date.now() - ARRANQUE.getTime()) / 1000),
  };
}

app.get("/api", (_req, res) => res.json(estado()));

app.get("/", (req, res) => {
  const quiereHtml = /text\/html/.test(req.headers.accept || "");
  if (!quiereHtml) return res.json(estado());
  res.type("html").send(pagina(estado()));
});

app.listen(3000, () => console.log("escuchando en :3000"));

// ---------------------------------------------------------------------------

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function pagina(d) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>nova-demo · Clúster EKS con pipeline</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
:root{
  --ink:#0A1113; --ink-2:#111E21; --ink-3:#17282C;
  --paper:#F3F7F6; --white:#FFFFFF;
  --teal:#0B6E64; --teal-deep:#075048; --mint:#46C8B4; --mint-soft:#D9EDE9;
  --line:#D5E1DF; --line-dark:#24393D;
  --muted:#55696C; --muted-dark:#95ABAD;
  --amber:#8F4E08; --amber-soft:#F8EBDA;
  --brick:#9C3320; --brick-soft:#F8E3DE;
  --live:#3DD68C;
  --f-d:"Archivo","Helvetica Neue",Arial,sans-serif;
  --f-b:"Source Serif 4",Georgia,serif;
  --f-m:"JetBrains Mono","SFMono-Regular",Consolas,monospace;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--f-b);font-size:17px;line-height:1.62;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding-inline:24px}
a{color:var(--teal-deep)}

/* ---------- HERO ---------- */
.hero{background:var(--ink);color:var(--white);padding-block:64px 72px;position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;inset:auto -10% -60% 55%;height:420px;background:radial-gradient(closest-side,rgba(70,200,180,.16),transparent 70%);pointer-events:none}
.hero .wrap{position:relative;z-index:1}
.kicker{font-family:var(--f-d);font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--mint);margin:0 0 18px}
h1{font-family:var(--f-d);font-weight:800;font-size:clamp(2.3rem,5.6vw,4rem);line-height:1.02;letter-spacing:-.03em;margin:0 0 20px;max-width:16ch;text-wrap:balance}
.lede{font-size:1.16rem;color:#B4C7C7;max-width:58ch;margin:0 0 40px}

.hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:44px;align-items:start}
@media (max-width:880px){.hero-grid{grid-template-columns:minmax(0,1fr);gap:36px}}

.telemetria{background:var(--ink-2);border:1px solid var(--line-dark);border-radius:12px;padding:22px 24px 20px}
.tel-head{display:flex;align-items:center;gap:9px;margin-bottom:18px}
.punto{width:8px;height:8px;border-radius:50%;background:var(--live);box-shadow:0 0 0 0 rgba(61,214,140,.55);animation:latido 2.4s infinite}
@keyframes latido{0%{box-shadow:0 0 0 0 rgba(61,214,140,.5)}70%{box-shadow:0 0 0 9px rgba(61,214,140,0)}100%{box-shadow:0 0 0 0 rgba(61,214,140,0)}}
@media (prefers-reduced-motion:reduce){.punto{animation:none}}
.tel-head span{font-family:var(--f-d);font-size:10.5px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--mint)}
.tel-fila{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid var(--line-dark);font-size:13.5px}
.tel-fila:last-of-type{border-bottom:none}
.tel-k{font-family:var(--f-d);color:var(--muted-dark);font-weight:500}
.tel-v{font-family:var(--f-m);color:#DCEBE9;font-size:12.5px;text-align:right;word-break:break-all}
.tel-v.big{color:var(--mint);font-weight:600;font-size:15px}
.tel-nota{margin:16px 0 0;font-size:12.5px;color:var(--muted-dark);line-height:1.5}

.cifras{display:flex;flex-wrap:wrap;gap:34px;margin-top:44px;padding-top:30px;border-top:1px solid var(--line-dark)}
.cifra b{display:block;font-family:var(--f-d);font-size:2rem;font-weight:700;color:var(--mint);line-height:1;margin-bottom:5px;font-variant-numeric:tabular-nums}
.cifra span{font-family:var(--f-d);font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted-dark)}

/* ---------- SECCIONES ---------- */
section{padding-block:72px}
section.alt{background:var(--white);border-block:1px solid var(--line)}
.eyebrow{font-family:var(--f-d);font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--teal);margin:0 0 12px}
h2{font-family:var(--f-d);font-weight:700;font-size:clamp(1.6rem,3.4vw,2.2rem);letter-spacing:-.024em;line-height:1.12;margin:0 0 14px;text-wrap:balance}
.sub{color:var(--muted);max-width:62ch;margin:0 0 34px;font-size:1.04rem}

figure{margin:0 0 8px}
.diagrama{background:var(--ink);border-radius:12px;padding:26px 20px;overflow-x:auto}
.diagrama svg{display:block;min-width:660px;width:100%;height:auto}
.dx-b{fill:#16272B;stroke:#2C4448}
.dx-a{fill:#0F312D;stroke:var(--mint)}
.dx-l{fill:none;stroke:#3C585C;stroke-width:1.5}
.dx-ar{fill:#3C585C}
.dx-t{font-family:"Archivo",sans-serif;font-weight:600;fill:#E2EEEC}
.dx-m{font-family:"JetBrains Mono",monospace;fill:#93AAAB}
.dx-acc{font-family:"JetBrains Mono",monospace;fill:var(--mint)}
figcaption{font-family:var(--f-d);font-size:12.5px;color:var(--muted);margin-top:14px;max-width:66ch}

/* ---------- SESIONES ---------- */
.sesiones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
@media (max-width:900px){.sesiones{grid-template-columns:minmax(0,1fr)}}
.ses{background:var(--white);border:1px solid var(--line);border-radius:12px;padding:26px 24px 24px;display:flex;flex-direction:column}
section.alt .ses{background:var(--paper)}
.ses-dia{font-family:var(--f-m);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:12px}
.ses h3{font-family:var(--f-d);font-weight:700;font-size:1.16rem;letter-spacing:-.015em;margin:0 0 10px;line-height:1.25}
.ses p{color:var(--muted);font-size:.96rem;margin:0 0 18px}
.ses ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
.ses li{display:grid;grid-template-columns:16px 1fr;gap:9px;font-size:.93rem;line-height:1.45}
.ses li::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--mint);margin-top:8px;justify-self:center}
.ses-pie{margin-top:auto;padding-top:18px;border-top:1px solid var(--line);font-family:var(--f-m);font-size:11.5px;color:var(--teal-deep)}

/* ---------- COMPONENTES ---------- */
.comp{display:grid;grid-template-columns:repeat(auto-fit,minmax(232px,1fr));gap:16px}
.c{border:1px solid var(--line);border-radius:10px;padding:18px 20px;background:var(--white)}
section.alt .c{background:var(--paper)}
.c b{display:block;font-family:var(--f-d);font-size:1rem;margin-bottom:5px}
.c span{font-size:.9rem;color:var(--muted);line-height:1.5;display:block}
.c code{font-family:var(--f-m);font-size:.78rem;color:var(--teal-deep);display:block;margin-top:9px;word-break:break-all}

/* ---------- TABLA ---------- */
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--white)}
section.alt .tw{background:var(--paper)}
table{border-collapse:collapse;width:100%;font-size:.92rem;min-width:640px}
th,td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:top}
thead th{font-family:var(--f-d);font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--muted);font-weight:600;background:var(--mint-soft)}
tbody tr:last-child td{border-bottom:none}
td code{font-family:var(--f-m);font-size:.82em;color:var(--brick)}
td.ok code{color:var(--teal-deep)}

/* ---------- COSTOS ---------- */
.costos{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,340px);gap:34px;align-items:start}
@media (max-width:880px){.costos{grid-template-columns:minmax(0,1fr)}}
.barra{display:flex;align-items:baseline;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid var(--line)}
.barra:last-child{border-bottom:none}
.barra i{font-style:normal;font-family:var(--f-d);font-size:.95rem}
.barra em{font-style:normal;font-family:var(--f-m);font-size:.9rem;color:var(--teal-deep);font-variant-numeric:tabular-nums}
.total{background:var(--ink);color:var(--white);border-radius:12px;padding:26px 24px}
.total b{display:block;font-family:var(--f-d);font-size:2.5rem;font-weight:700;color:var(--mint);line-height:1;margin-bottom:8px}
.total span{font-family:var(--f-d);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted-dark);display:block;margin-bottom:16px}
.total p{margin:0;font-size:.92rem;color:#B4C7C7;line-height:1.55}

/* ---------- PIE ---------- */
footer{background:var(--ink);color:var(--muted-dark);padding-block:44px 52px;font-size:.9rem}
footer .wrap{display:flex;flex-wrap:wrap;gap:26px 44px;justify-content:space-between;align-items:flex-start}
footer b{display:block;font-family:var(--f-d);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--mint);margin-bottom:7px;font-weight:600}
footer code{font-family:var(--f-m);font-size:.85em;color:#CBDCDA}
</style>
</head>
<body>

<div class="hero">
  <div class="wrap">
    <p class="kicker">Práctica de infraestructura · NOVA Technology</p>
    <div class="hero-grid">
      <div>
        <h1>Un clúster de AWS que se despliega solo</h1>
        <p class="lede">De un contenedor a un pipeline que publica en producción sin que nadie toque el clúster. Seis horas, tres sesiones, y un sistema real corriendo en Amazon EKS — esta misma página la está sirviendo.</p>
        <div class="cifras">
          <div class="cifra"><b>11</b><span>fases</span></div>
          <div class="cifra"><b>3</b><span>sesiones</span></div>
          <div class="cifra"><b>2</b><span>nodos EC2</span></div>
          <div class="cifra"><b>0</b><span>llaves guardadas</span></div>
        </div>
      </div>

      <div class="telemetria">
        <div class="tel-head"><span class="punto"></span><span>Respuesta en vivo</span></div>
        <div class="tel-fila"><span class="tel-k">Versión</span><span class="tel-v big" id="v">${esc(d.version)}</span></div>
        <div class="tel-fila"><span class="tel-k">Pod que respondió</span><span class="tel-v" id="p">${esc(d.pod)}</span></div>
        <div class="tel-fila"><span class="tel-k">Commit</span><span class="tel-v" id="c">${esc(d.commit)}</span></div>
        <div class="tel-fila"><span class="tel-k">Región</span><span class="tel-v">${esc(d.region)}</span></div>
        <div class="tel-fila"><span class="tel-k">Pods vistos</span><span class="tel-v" id="n">1</span></div>
        <p class="tel-nota">Estos datos se actualizan cada tres segundos. El nombre del pod cambia porque el balanceador reparte cada petición entre las réplicas — no hace falta recargar para verlo.</p>
      </div>
    </div>
  </div>
</div>

<section>
  <div class="wrap">
    <p class="eyebrow">La arquitectura</p>
    <h2>El camino completo, del commit al usuario</h2>
    <p class="sub">Nadie ejecuta comandos contra el clúster. Un <code>git push</code> pone en marcha una cadena que termina en los pods que sirven esta página.</p>

    <figure>
      <div class="diagrama">
        <svg viewBox="0 0 900 260" role="img" aria-label="Flujo completo: git push dispara GitHub Actions, que asume un rol por OIDC, sube la imagen a ECR, actualiza el Deployment en EKS, y el ALB entrega el tráfico a los pods">
          <defs>
            <marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path class="dx-ar" d="M0 0 L10 5 L0 10 z"></path>
            </marker>
          </defs>

          <rect class="dx-b" x="14" y="92" width="126" height="58" rx="8"></rect>
          <text class="dx-t" x="77" y="116" text-anchor="middle" font-size="13">git push</text>
          <text class="dx-m" x="77" y="134" text-anchor="middle" font-size="10">rama main</text>

          <rect class="dx-b" x="176" y="76" width="152" height="90" rx="8"></rect>
          <text class="dx-t" x="252" y="102" text-anchor="middle" font-size="13">GitHub Actions</text>
          <text class="dx-m" x="252" y="121" text-anchor="middle" font-size="10">docker build</text>
          <text class="dx-m" x="252" y="136" text-anchor="middle" font-size="10">assume-role OIDC</text>
          <text class="dx-m" x="252" y="151" text-anchor="middle" font-size="10">kubectl set image</text>

          <rect class="dx-a" x="368" y="34" width="144" height="52" rx="8"></rect>
          <text class="dx-t" x="440" y="55" text-anchor="middle" font-size="13">Amazon ECR</text>
          <text class="dx-acc" x="440" y="72" text-anchor="middle" font-size="10">app:&lt;sha&gt;</text>

          <rect class="dx-a" x="368" y="104" width="144" height="52" rx="8"></rect>
          <text class="dx-t" x="440" y="125" text-anchor="middle" font-size="13">EKS API</text>
          <text class="dx-m" x="440" y="142" text-anchor="middle" font-size="10">access entry</text>

          <rect class="dx-b" x="556" y="26" width="330" height="200" rx="10" stroke-dasharray="5 5" fill="none"></rect>
          <text class="dx-m" x="721" y="47" text-anchor="middle" font-size="10.5" letter-spacing="1.6">VPC · CLÚSTER</text>

          <rect class="dx-b" x="580" y="62" width="118" height="46" rx="7"></rect>
          <text class="dx-t" x="639" y="90" text-anchor="middle" font-size="12">pod web-1</text>
          <rect class="dx-b" x="580" y="122" width="118" height="46" rx="7"></rect>
          <text class="dx-t" x="639" y="150" text-anchor="middle" font-size="12">pod web-2</text>

          <rect class="dx-a" x="734" y="92" width="112" height="46" rx="7"></rect>
          <text class="dx-t" x="790" y="112" text-anchor="middle" font-size="12">ALB</text>
          <text class="dx-m" x="790" y="128" text-anchor="middle" font-size="10">ingress</text>

          <path class="dx-l" d="M140 121 L172 121" marker-end="url(#fl)"></path>
          <path class="dx-l" d="M328 106 L364 64" marker-end="url(#fl)"></path>
          <path class="dx-l" d="M328 134 L364 130" marker-end="url(#fl)"></path>
          <path class="dx-l" d="M512 60 L544 60 L544 85 L576 85" marker-end="url(#fl)"></path>
          <path class="dx-l" d="M512 130 L544 130 L544 145 L576 145" marker-end="url(#fl)"></path>
          <path class="dx-l" d="M698 85 L730 108" marker-end="url(#fl)"></path>
          <path class="dx-l" d="M698 145 L730 122" marker-end="url(#fl)"></path>
          <path class="dx-l" d="M790 138 L790 186" marker-end="url(#fl)"></path>
          <text class="dx-t" x="790" y="206" text-anchor="middle" font-size="12">usuarios</text>
          <text class="dx-acc" x="252" y="192" text-anchor="middle" font-size="10.5">token efímero · cero llaves guardadas</text>
        </svg>
      </div>
      <figcaption>Las credenciales que usa el pipeline viven quince minutos y se piden de nuevo en cada corrida. En ningún archivo del repositorio hay una clave de AWS.</figcaption>
    </figure>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <p class="eyebrow">El recorrido</p>
    <h2>Tres sesiones, tres problemas distintos</h2>
    <p class="sub">Cada día resolvió una carencia concreta del anterior. Nada se construyó porque tocaba: se construyó porque faltaba.</p>

    <div class="sesiones">
      <div class="ses">
        <div class="ses-dia">Lunes · fases 00–04</div>
        <h3>El clúster y la primera aplicación</h3>
        <p>Si el contenedor se cae a las tres de la mañana, ¿quién lo levanta?</p>
        <ul>
          <li>Clúster EKS con Kubernetes 1.34, creado desde un archivo de treinta líneas</li>
          <li>VPC propia con subredes públicas y privadas, y NAT para la salida</li>
          <li>Repositorio ECR con escaneo de vulnerabilidades al subir</li>
          <li>Deployment de dos réplicas con sondas de readiness y liveness</li>
          <li>Autorreparación verificada: se borró un pod y volvió solo</li>
        </ul>
        <div class="ses-pie">Estado deseado, no órdenes</div>
      </div>

      <div class="ses">
        <div class="ses-dia">Miércoles · fases 05–07</div>
        <h3>Exponerlo y cambiarlo sin cortar</h3>
        <p>La aplicación funcionaba y nadie de afuera podía usarla.</p>
        <ul>
          <li>AWS Load Balancer Controller instalado con Helm y permisos por IRSA</li>
          <li>Un Ingress de quince líneas creó un Application Load Balancer real</li>
          <li>Rolling update de v1 a v2 con tráfico entrando: cero peticiones perdidas</li>
          <li>Despliegue de una imagen inexistente: el servicio quedó atascado, no caído</li>
          <li>Reversión con <code>rollout undo</code> y lectura del historial de revisiones</li>
        </ul>
        <div class="ses-pie">maxUnavailable: 0</div>
      </div>

      <div class="ses">
        <div class="ses-dia">Viernes · fases 08–11</div>
        <h3>Que la máquina haga el despliegue</h3>
        <p>Cada publicación seguía siendo cinco comandos escritos a mano.</p>
        <ul>
          <li>GitHub registrado como proveedor de identidad OIDC en AWS</li>
          <li>Rol asumible solo desde este repositorio y esta rama, sin llaves</li>
          <li>Access entry con permisos limitados al namespace de la aplicación</li>
          <li>Pipeline que construye, publica, despliega y <em>verifica</em></li>
          <li>Fallo provocado: el job se puso rojo y revirtió solo</li>
        </ul>
        <div class="ses-pie">rollout status · código de salida 1</div>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Lo que quedó corriendo</p>
    <h2>Componentes desplegados</h2>
    <p class="sub">Todo creado de forma declarativa. Nada configurado a mano en la consola.</p>

    <div class="comp">
      <div class="c"><b>Clúster EKS</b><span>Plano de control administrado, replicado en tres zonas.</span><code>Kubernetes 1.34</code></div>
      <div class="c"><b>Grupo de nodos</b><span>Dos instancias en subredes privadas, sin IP pública.</span><code>2 × t3.medium</code></div>
      <div class="c"><b>Application Load Balancer</b><span>Creado por un controlador que corre dentro del clúster.</span><code>target-type: ip</code></div>
      <div class="c"><b>Repositorio de imágenes</b><span>Etiquetado por SHA de commit: inmutable y rastreable.</span><code>Amazon ECR</code></div>
      <div class="c"><b>Identidad federada</b><span>GitHub asume un rol de AWS con un token de quince minutos.</span><code>OIDC · sts:AssumeRoleWithWebIdentity</code></div>
      <div class="c"><b>Pipeline de despliegue</b><span>Construye, publica, despliega, espera, verifica y revierte.</span><code>GitHub Actions</code></div>
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <p class="eyebrow">Lo que se rompió</p>
    <h2>Los tropiezos, que fueron el mejor material</h2>
    <p class="sub">Ninguno de estos fallos estaba en el guion. Todos aparecieron ejecutando el sistema de verdad, y cada uno enseñó algo que un tutorial sin errores no puede enseñar.</p>

    <div class="tw">
      <table>
        <thead><tr><th style="width:34%">Lo que apareció en pantalla</th><th>Qué era en realidad</th></tr></thead>
        <tbody>
          <tr><td><code>CreateContainerConfigError</code></td><td>Ni la imagen ni el código estaban mal: el <em>contrato</em> entre el Dockerfile y el manifiesto no cerraba. <code>runAsNonRoot</code> exige un UID numérico, y el Dockerfile daba un nombre.</td></tr>
          <tr><td><code>authorization token has expired</code></td><td>El login de ECR dura doce horas. El <code>docker build</code> funcionó perfecto justo antes, así que todo parecía bien hasta el último segundo.</td></tr>
          <tr><td><code>InvalidImageName</code></td><td>Una variable de entorno vacía. Bash la sustituyó por nada, el comando no falló, y el pod murió tres minutos más tarde.</td></tr>
          <tr><td><code>deployments.apps "web" not found</code></td><td>No se había borrado nada: faltaba el namespace en el comando. Kubernetes contestó exactamente la pregunta que se le hizo.</td></tr>
          <tr><td>La app reportaba <code>v1</code> tras desplegar v2</td><td>Una variable del manifiesto le gana al valor por defecto de la imagen. El pod corría código nuevo y reportaba el número viejo.</td></tr>
          <tr><td><code>Not authorized to perform sts:AssumeRoleWithWebIdentity</code></td><td>GitHub cambió el formato del <em>subject</em> del token e incrustó identificadores numéricos. Se descubrió decodificando el JWT dentro del propio pipeline.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">La factura</p>
    <h2>Cuánto cuesta tener esto encendido</h2>
    <p class="sub">Precios on-demand de us-east-2, encendido las veinticuatro horas. En Kubernetes casi toda decisión de arquitectura es, en el fondo, una decisión de facturación.</p>

    <div class="costos">
      <div>
        <div class="barra"><i>Plano de control EKS</i><em>US$ 73 / mes</em></div>
        <div class="barra"><i>2 × t3.medium</i><em>US$ 61 / mes</em></div>
        <div class="barra"><i>NAT Gateway</i><em>US$ 33 / mes</em></div>
        <div class="barra"><i>Application Load Balancer</i><em>US$ 18 / mes</em></div>
        <div class="barra"><i>ECR y almacenamiento</i><em>US$ 4 / mes</em></div>
      </div>
      <div class="total">
        <b>189</b>
        <span>dólares al mes</span>
        <p>Antes de la primera línea de código de la aplicación. Para un cliente que solo necesita correr contenedores, ECS con Fargate cuesta la mitad y no necesita a nadie cuidándolo. Saber cuándo <em>no</em> corresponde usar Kubernetes es parte de saber usarlo.</p>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div><b>Aplicación</b><code>nova-demo · ${esc(d.version)}</code></div>
    <div><b>Commit</b><code>${esc(d.commit)}</code></div>
    <div><b>Servido por</b><code>${esc(d.pod)}</code></div>
    <div><b>Región</b><code>${esc(d.region)}</code></div>
    <div><b>Datos en crudo</b><code>GET /api</code></div>
  </div>
</footer>

<script>
(function () {
  var vistos = {};
  vistos[${JSON.stringify(d.pod)}] = true;
  function pintar(x) {
    document.getElementById("v").textContent = x.version;
    document.getElementById("p").textContent = x.pod;
    document.getElementById("c").textContent = x.commit;
    vistos[x.pod] = true;
    document.getElementById("n").textContent = Object.keys(vistos).length;
  }
  setInterval(function () {
    fetch("/api", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(pintar)
      .catch(function () {});
  }, 3000);
})();
</script>

</body>
</html>`;
}
