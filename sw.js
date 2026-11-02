const VERSION = "gm-pwa-v4";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const GOAL_STYLE = `
<style id="gm-goal-card-v4">
.commission-highlight.commission-goal-card{
  display:grid !important;
  grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr);
  align-items:center;
  gap:48px;
  min-height:238px;
  padding:34px 46px !important;
  overflow:hidden;
}
.commission-goal-card .commission-goal-copy{
  min-width:0;
  width:100%;
  max-width:590px;
}
.commission-goal-card .commission-goal-copy strong{
  display:block;
  max-width:560px;
  font-size:clamp(22px,2.15vw,30px) !important;
  line-height:1.18 !important;
  letter-spacing:-.025em;
  margin:0 0 16px !important;
}
.commission-goal-card .commission-goal-copy span{
  display:block;
  max-width:590px;
  font-size:16px !important;
  line-height:1.55 !important;
}
.commission-goal-card #commissionMonthlyNet{
  min-width:0;
  width:100%;
  display:flex !important;
  flex-direction:column;
  align-items:flex-end;
  justify-content:center;
  text-align:right;
  white-space:nowrap;
  font-size:clamp(40px,4.45vw,52px) !important;
  font-weight:900 !important;
  line-height:.98 !important;
  letter-spacing:-.035em;
  transform-origin:right center;
  transition:
    text-shadow .28s ease,
    filter .28s ease,
    transform .28s ease;
}
.commission-goal-card #commissionMonthlyNet::before{
  content:"LÍQUIDO ESTIMADO / MÊS";
  display:block;
  margin-bottom:11px;
  font-size:11px;
  font-weight:800;
  line-height:1;
  letter-spacing:.16em;
  color:rgba(255,255,255,.52);
  text-shadow:none !important;
}
.commission-goal-card #commissionMonthlyNet:hover{
  transform:scale(1.02);
  filter:brightness(1.09);
  text-shadow:
    0 0 8px rgba(247,208,123,.58),
    0 0 20px rgba(231,174,67,.32),
    0 0 40px rgba(185,111,27,.18);
}
.commission-goal-card #commissionMonthlyNet:hover::before{
  text-shadow:none !important;
}
@media(max-width:1060px){
  .commission-highlight.commission-goal-card{
    grid-template-columns:minmax(0,1fr) minmax(300px,.72fr);
    gap:30px;
    padding-left:34px !important;
    padding-right:34px !important;
  }
  .commission-goal-card #commissionMonthlyNet{
    font-size:clamp(38px,4.2vw,48px) !important;
  }
}
@media(max-width:900px){
  .commission-highlight.commission-goal-card{
    grid-template-columns:1fr;
    row-gap:26px;
    min-height:0;
    padding:28px 24px !important;
  }
  .commission-goal-card .commission-goal-copy,
  .commission-goal-card .commission-goal-copy strong,
  .commission-goal-card .commission-goal-copy span{
    max-width:none;
  }
  .commission-goal-card #commissionMonthlyNet{
    align-items:flex-start;
    justify-content:flex-start;
    text-align:left;
    white-space:normal;
    font-size:clamp(36px,9.5vw,50px) !important;
    transform-origin:left center;
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
  if (!html.includes('gm-goal-card-v4')) {
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