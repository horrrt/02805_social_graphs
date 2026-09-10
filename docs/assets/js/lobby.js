import { setupChrome, $, load, canvasStage, errorMessage } from "./cabinet.js";
import { WEEKS, shortDate } from "./weeks.js";
setupChrome();
document.body.classList.add("unlocked");
// One cabinet per course week; the schedule manifest decides which are lit.
const slots = WEEKS;
let boxes = [];
canvasStage($("#lobby-canvas"), (c, w, h) => {
  c.clearRect(0, 0, w, h);
  const floor = h * 0.91;
  c.strokeStyle = "#465144";
  c.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    c.beginPath();
    c.moveTo(w / 2, h * 0.3);
    c.lineTo(((i - 4) * w) / 7, h);
    c.stroke();
  }
  for (let y = floor - 20; y < h; y += 19) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  const n = slots.length,
    cw = Math.min(130, (w - 36) / n - 10),
    gap = (w - cw * n) / (n + 1);
  boxes = [];
  for (let i = 0; i < n; i++) {
    const wk = slots[i],
      live = wk.status === "live",
      x = gap + (cw + gap) * i,
      ch = Math.min(285, h * 0.82),
      y = floor - ch;
    boxes.push({ x, y, w: cw, h: ch });
    c.fillStyle = live ? "#233728" : "#1b221d";
    c.strokeStyle = live ? "#c2ff63" : "#566154";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x + 8, y);
    c.lineTo(x + cw - 8, y);
    c.lineTo(x + cw, y + ch * 0.2);
    c.lineTo(x + cw - 7, y + ch * 0.4);
    c.lineTo(x + cw, y + ch * 0.6);
    c.lineTo(x + cw, y + ch);
    c.lineTo(x, y + ch);
    c.lineTo(x, y + ch * 0.6);
    c.lineTo(x + 7, y + ch * 0.4);
    c.lineTo(x, y + ch * 0.2);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = live ? "#c2ff63" : "#72846e";
    c.fillRect(x + 7, y + 10, cw - 14, 24);
    c.fillStyle = "#112018";
    c.font = `bold ${Math.max(6, cw * 0.087)}px monospace`;
    c.textAlign = "center";
    c.fillText(
      live ? wk.cabinet.marquee || wk.cabinet.name.toUpperCase() : wk.short,
      x + cw / 2,
      y + 26,
      cw - 15,
    );
    c.fillStyle = "#0c120e";
    c.fillRect(x + 9, y + 46, cw - 18, ch * 0.36);
    c.strokeStyle = live ? "#c2ff63" : "#778571";
    c.font = `bold ${cw * 0.4}px monospace`;
    c.fillStyle = live ? "#c2ff63" : "#687460";
    c.fillText(String(wk.n).padStart(2, "0"), x + cw / 2, y + ch * 0.41);
    c.fillStyle = "#b7c2a8";
    c.beginPath();
    c.arc(x + cw * 0.3, y + ch * 0.58, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = live ? "#ff937c" : "#6b7263";
    c.beginPath();
    c.arc(x + cw * 0.72, y + ch * 0.59, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = live ? "#c2ff63" : "#8b9784";
    c.font = `${Math.max(6, cw * 0.075)}px monospace`;
    c.fillText(
      live ? "READY TO PLAY" : `COMING ${shortDate(wk.date)}`,
      x + cw / 2,
      y + ch * 0.8,
      cw - 15,
    );
    if (!live) {
      c.fillStyle = "#acb99b16";
      c.beginPath();
      c.moveTo(x - 3, y - 4);
      c.lineTo(x + cw + 2, y - 4);
      c.lineTo(x + cw + 5, y + ch * 0.94);
      c.lineTo(x + cw * 0.6, y + ch * 0.88);
      c.lineTo(x - 4, y + ch * 0.94);
      c.closePath();
      c.fill();
    }
  }
  c.textAlign = "left";
});
const hit = (e) => {
  const r = e.currentTarget.getBoundingClientRect(),
    x = e.clientX - r.left,
    y = e.clientY - r.top;
  const i = boxes.findIndex(
    (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  );
  return i >= 0 ? slots[i] : null;
};
$("#lobby-canvas").addEventListener("click", (e) => {
  const wk = hit(e);
  if (wk?.cabinet) location.href = wk.cabinet.href;
});
$("#lobby-canvas").addEventListener("mousemove", (e) => {
  e.currentTarget.style.cursor = hit(e)?.cabinet ? "pointer" : "default";
});
load()
  .then(() => {
    $("#app-status").hidden = true;
  })
  .catch(errorMessage);
