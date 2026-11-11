const VERSION = "gm-pwa-executive-v12-20261111";
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
  ma¶»§q«^