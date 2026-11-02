const VERSION = "gm-pwa-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const GOAL_STYLE = `
<style id="gm-goal-card-v2">
.commission-highlight.commission-goal-card{
  position:relative;
  overflow:hidden;
  display:grid !important;
  grid-template-columns:minmax(0,1fr) minmax(360px,.95fr);
  align-items:center;
  gap:42px;
  padding:34px 38px !important;
  margin-top:18px !important;
  min-height:250px;
  border:1px solid rgba(220,178,92,.34) !important;
  border-radius:28px !important;
  background:
    radial-gradient(circle at 8% 12%, rgba(116,17,48,.28), transparent 36%),
    linear-gradient(135deg, rgba(44,8,20,.97), rgba(12,8,9,.98)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.025),
    0 18px 45px rgba(0,0,0,.28);
  transition:transform .28s cubic-bezier(.2,.8,.2,1), border-color .28s ease, box-shadow .28s ease, filter .28s ease;
  isolation:isolate;
}
.commission-highlight.commission-goal-card::before{
  content:"";
  position:absolute;
  inset:-2px;
  border-radius:inherit;
  background:linear-gradient(105deg,transparent 18%,rgba(247,208,123,.12) 43%,rgba(247,208,123,.55) 50%,rgba(247,208,123,.10) 57%,transparent 82%);
  transform:translateX(-120%);
  transition:transform .8s ease;
  z-index:-1;
  pointer-events:none;
}
.commission-highlight.commission-goal-card:hover{
  transform:translateY(-6px) scale(1.018);
  border-color:rgba(247,208,123,.78) !important;
  box-shadow:
    0 0 0 1px rgba(247,208,123,.12),
    0 0 34px rgba(185,120,28,.22),
    0 26px 65px rgba(0,0,0,.42);
  filter:saturate(1.04);
}
.commission-highlight.commission-goal-card:hover::before{transform:translateX(120%)}
.commission-goal-card .commission-goal-copy{
  min-width:0;
  padding-right:34px;
  border-right:1px solid rgba(220,178,92,.20);
}
.commission-goal-card .commission-goal-copy strong{
  display:block;
  max-width:520px;
  font-size:clamp(24px,2.2vw,36px) !important;
  line-height:1.12 !important;
  letter-spacing:-.03em;
  color:#fff8ec !important;
  margin:0 0 16px !important;
}
.commission-goal-card .commission-goal-copy span{
  display:block;
  max-width:560px;
  font-size:16px !important;
  line-height:1.55 !important;
  color:rgba(255,255,255,.67) !important;
}
.commission-goal-card #commissionAnnualProjection{
  display:inline-block;
  margin-top:14px;
  padding:8px 13px;
  border-radius:12px;
  color:#f2cb77 !important;
  background:rgba(193,132,36,.08);
  border:1px solid rgba(230,184,91,.28);
  font-weight:800;
}
.commission-goal-card #commissionMonthlyNet{
  width:100%;
  min-height:130px;
  display:flex !important;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:22px 24px;
  border-radius:24px;
  border:1px solid rgba(224,178,82,.45);
  background:linear-gradient(145deg,rgba(64,17,30,.72),rgba(20,10,12,.86));
  color:#f4cf80 !important;
  font-size:clamp(34px,4.2vw,66px) !important;
  font-weight:900 !important;
  letter-spacing:-.045em;
  line-height:1 !important;
  text-shadow:0 0 24px rgba(231,180,74,.08);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
  transition:transform .28s ease, box-shadow .28s ease, border-color .28s ease;
}
.commission-goal-card:hover #commissionMonthlyNet{
  transform:scale(1.025);
  border-color:rgba(246,206,119,.82);
  box-shadow:0 0 28px rgba(219,164,58,.14),inset 0 1px 0 rgba(255,255,255,.05);
}
@media(max-width:900px){
  .commission-highlight.commission-goal-card{
    grid-template-columns:1fr;
    gap:24px;
    padding:28px 24px !important;
  }
  .commission-goal-card .commission-goal-copy{
    border-right:0;
    border-bottom:1px solid rgba(220,178,92,.18);
    padding:0 0 24px;
  }
  .commission-goal-card #commissionMonthlyNet{
    min-height:100px;
    font-size:clamp(32px,9vw,52px) !important;
  }
}
</style>`;

function enhanceCommissionGoal(html){
  const marker = '<div class="commission-highlight" style="margin-top:4px">';
  if (!html.includes('Batendo 5MM no mês') || !html.includes(marker)) return html;
  html = html.replace(marker, '<div class="commission-highlight commission-goal-card" style="margin-top:4px">');
  html = html.replace(
    '<div>\n            <strong>Batendo 5MM no mês, quanto isso representa no bolso?</strong>',
    '<div class="commission-goal-copy">\n            <strong>Batendo 5MM no mês, quanto isso representa no bolso?</strong>'
  );
  if (!html.includes('gm-goal-card-v2')) {
    html = html.replace('</head>', GOAL_STYLE + '\n</head>');
  }
  return html;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const type = response.headers.get("content-type") || "";
        if (!type.includes("text/html")) return response;
        const html = enhanceCommissionGoal(await response.text());
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (err) {
        return caches.match(event.request);
      }
    })());
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});