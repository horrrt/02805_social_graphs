import { setupChrome, $, load, canvasStage, errorMessage } from "./cabinet.js";
setupChrome();
document.body.classList.add("unlocked");
const names = [
  "HERO PACKS",
  "TRANSIT",
  "TRUMPS",
  "DISTRICTS",
  "WALK / LISTEN",
  "THE CREATURE",
  "NOTEPAD",
  "WORD FINDER",
];
const targets = [
  "weeks/week01/",
  "weeks/week02/",
  "trumps/",
  "os/?app=communities",
  "sound/",
  "creature/",
  "os/?app=notepad",
  "os/?app=search",
];
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
  const cw = Math.min(130, (w - 36) / 8 - 10),
    gap = (w - cw * 8) / 9;
  boxes = [];
  for (let i = 0; i < 8; i++) {
    const x = gap + (cw + gap) * i,
      ch = Math.min(285, h * 0.82),
      y = floor - ch;
    boxes.push({ x, y, w: cw, h: ch });
    c.fillStyle = i < 2 ? "#233728" : "#1b221d";
    c.strokeStyle = i < 2 ? "#c2ff63" : "#566154";
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
    c.fillStyle = i < 2 ? "#c2ff63" : "#72846e";
    c.fillRect(x + 7, y + 10, cw - 14, 24);
    c.fillStyle = "#112018";
    c.font = `bold ${Math.max(6, cw * 0.087)}px monospace`;
    c.textAlign = "center";
    c.fillText(names[i], x + cw / 2, y + 26, cw - 15);
    c.fillStyle = "#0c120e";
    c.fillRect(x + 9, y + 46, cw - 18, ch * 0.36);
    c.strokeStyle = i < 2 ? "#c2ff63" : "#778571";
    c.font = `bold ${cw * 0.4}px monospace`;
    c.fillStyle = i < 2 ? "#c2ff63" : "#687460";
    c.fillText(String(i + 1).padStart(2, "0"), x + cw / 2, y + ch * 0.41);
    c.fillStyle = "#b7c2a8";
    c.beginPath();
    c.arc(x + cw * 0.3, y + ch * 0.58, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = i < 2 ? "#ff937c" : "#6b7263";
    c.beginPath();
    c.arc(x + cw * 0.72, y + ch * 0.59, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = i < 2 ? "#c2ff63" : "#8b9784";
    c.font = `${Math.max(6, cw * 0.075)}px monospace`;
    c.fillText(i < 2 ? "READY TO PLAY" : "PREVIEW", x + cw / 2, y + ch * 0.8);
    if (i > 1) {
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
$("#lobby-canvas").addEventListener("click", (e) => {
  const r = e.currentTarget.getBoundingClientRect(),
    x = e.clientX - r.left,
    y = e.clientY - r.top;
  const i = boxes.findIndex(
    (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  );
  if (i >= 0) location.href = targets[i];
});
$("#lobby-canvas").style.cursor = "pointer";
load()
  .then(() => {
    $("#app-status").hidden = true;
  })
  .catch(errorMessage);
