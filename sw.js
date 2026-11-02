const VERSION = "gm-pwa-v3";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const GOAL_STYLE = `
<style id="gm-goal-card-v3">
.commission-highlight.commission-goal-card{
  display:grid !important;
  grid-template-columns:minmax(260px,.78fr) minmax(0,1.72fr);
  align-items:center;
  column-gap:46px;
  padding-left:36px !important;
  padding-right:42px !important;
}
.commission-goal-card .commission-goal-copy{
  min-width:0;
  max-width:390px;
}
.commission-goal-card .commission-goal-copy strong{
  display:block;
  max-width:360px;
  line-height:1.28 !important;
  margin-bottom:12px !important;
}
.commission-goal-card .commission-goal-copy span{
  display:block;
  max-width:360px;
  line-height:1.48 !important;
}
.commission-goal-card #commissionMonthlyNet{
  display:flex !important;
  align-items:center;
  justify-content:center;
  text-align:center;
  white-space:nowrap;
  width:100%;
  font-size:clamp(46px,6.1vw,76px) !important;
  line-height:1 !important;
  letter-spacing:-.035em;
  transition:
    text-shadow .28s ease,
    filter .28s ease,
    transform .28s ease;
}
.commission-goal-card #commissionMonthlyNet:hover{
  transform:scale(1.015);
  filter:brightness(1.08);
  text-shadow:
    0 0 8px rgba(247,208,123,.55),
    0 0 20px rgba(231,174,67,.32),
    0 0 42px rgba(185,111,27,.18);
}
@media(max-width:900px){
  .commission-highlight.commission-goal-card{
    grid-template-columns:1fr;
    row-gap:24px;
    padding-left:24px !important;
    padding-right:24px !important;
  }
  .commission-goal-card .commission-goal-copy,
  .commission-goal-card .commission-goal-copy strong,
  .commission-goal-card .commission-goal-copy span{
    max-width:none;
  }
  .commission-goal-card #commissionMonthlyNet{
    justify-content:flex-start;
    text-align:left;
    white-space:normal;
    font-size:clamp(40px,10vw,58px) !important;
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
  if (!html.includes('gm-goal-card-v3')) {
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