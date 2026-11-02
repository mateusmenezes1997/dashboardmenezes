const VERSION = "gm-pwa-v5";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const GOAL_STYLE = `
<style id="gm-goal-mini-v5">
.commission-goal-mini{
  margin-top:14px !important;
  display:grid !important;
  grid-template-columns:minmax(0,1fr) auto !important;
  align-items:center !important;
  gap:34px !important;
  width:100% !important;
  min-height:0 !important;
  padding:22px 28px !important;
  border:1px solid rgba(221,174,83,.30) !important;
  border-radius:20px !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(111,18,47,.18), transparent 34%),
    linear-gradient(135deg,rgba(35,11,20,.88),rgba(14,10,11,.96)) !important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
  overflow:hidden !important;
}
.commission-goal-mini-copy{
  min-width:0 !important;
  width:100% !important;
  max-width:610px !important;
}
.commission-goal-mini-eyebrow{
  display:block !important;
  margin:0 0 7px !important;
  font-size:10px !important;
  font-weight:800 !important;
  letter-spacing:.15em !important;
  text-transform:uppercase !important;
  color:#d9ae5c !important;
}
.commission-goal-mini-title{
  display:block !important;
  margin:0 0 7px !important;
  font-size:20px !important;
  line-height:1.16 !important;
  letter-spacing:-.02em !important;
  color:#fff !important;
}
.commission-goal-mini-text{
  margin:0 !important;
  max-width:590px !important;
  font-size:14px !important;
  line-height:1.45 !important;
  color:rgba(255,255,255,.62) !important;
}
.commission-goal-mini-text b{
  color:rgba(255,255,255,.82) !important;
  font-weight:700 !important;
}
.commission-goal-mini-value{
  min-width:300px !important;
  padding-left:28px !important;
  border-left:1px solid rgba(221,174,83,.20) !important;
  text-align:right !important;
}
.commission-goal-mini-value small{
  display:block !important;
  margin:0 0 8px !important;
  font-size:10px !important;
  line-height:1 !important;
  font-weight:800 !important;
  letter-spacing:.15em !important;
  text-transform:uppercase !important;
  color:rgba(255,255,255,.47) !important;
}
.commission-goal-mini-value #commissionMonthlyNet{
  display:inline-block !important;
  width:auto !important;
  min-width:0 !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
  background:none !important;
  color:#f2ca75 !important;
  font-size:clamp(32px,3.25vw,44px) !important;
  font-weight:900 !important;
  line-height:1 !important;
  letter-spacing:-.045em !important;
  white-space:nowrap !important;
  text-align:right !important;
  text-shadow:none !important;
  transform-origin:right center !important;
  transition:transform .22s ease,filter .22s ease,text-shadow .22s ease !important;
}
.commission-goal-mini-value #commissionMonthlyNet:hover{
  transform:scale(1.025) !important;
  filter:brightness(1.08) !important;
  text-shadow:
    0 0 8px rgba(247,208,123,.52),
    0 0 22px rgba(220,159,45,.26) !important;
}
@media(max-width:820px){
  .commission-goal-mini{
    grid-template-columns:1fr !important;
    gap:16px !important;
    padding:20px !important;
  }
  .commission-goal-mini-copy{
    max-width:none !important;
  }
  .commission-goal-mini-value{
    min-width:0 !important;
    padding:16px 0 0 !important;
    border-left:0 !important;
    border-top:1px solid rgba(221,174,83,.18) !important;
    text-align:left !important;
  }
  .commission-goal-mini-value #commissionMonthlyNet{
    font-size:clamp(30px,8vw,40px) !important;
    text-align:left !important;
    white-space:normal !important;
    transform-origin:left center !important;
  }
}
</style>`;

function enhanceCommissionGoal(html){
  if (!html.includes('Batendo 5MM no mês')) return html;

  const blockPattern = /<div class="commission-highlight" style="margin-top:4px">\s*<div>\s*<strong>Batendo 5MM no mês, quanto isso representa no bolso\?<\/strong>\s*<span>Com 2% de comissão bruta e os descontos estimados do simulador, a projeção é de <b id="commissionAnnualProjection">[^<]*<\/b> mantendo essa meta todos os meses\.<\/span>\s*<\/div>\s*<div class="big" id="commissionMonthlyNet">[^<]*<\/div>\s*<\/div>/;

  const replacement = `
        <div class="commission-goal-mini">
          <div class="commission-goal-mini-copy">
            <span class="commission-goal-mini-eyebrow">Meta de performance</span>
            <strong class="commission-goal-mini-title">Batendo 5MM no mês</strong>
            <p class="commission-goal-mini-text">Com 2% de comissão bruta e os descontos estimados do simulador. Mantendo essa meta: <b id="commissionAnnualProjection">R$ 963.240,00 líquidos em 12 meses</b>.</p>
          </div>
          <div class="commission-goal-mini-value">
            <small>Líquido estimado / mês</small>
            <b id="commissionMonthlyNet">R$ 80.270,00/mês</b>
          </div>
        </div>`;

  html = html.replace(blockPattern, replacement);
  if (!html.includes('gm-goal-mini-v5')) {
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