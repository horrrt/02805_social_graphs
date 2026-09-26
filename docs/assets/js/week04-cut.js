// The deep-dive section keeps the first round of questions in closed <details>.
// A chart drawn while its section is closed has no width, so opening one fires
// a resize for every chart on the page; an old link (#place-regions, say) opens
// the section that holds its target.
function reveal() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;
  let opened = false;
  for (let el = target.parentElement; el; el = el.parentElement) {
    if (el.tagName === "DETAILS" && !el.open) {
      el.open = true;
      opened = true;
    }
  }
  if (opened) requestAnimationFrame(() => target.scrollIntoView());
}

document.querySelectorAll("details").forEach((el) => {
  el.addEventListener("toggle", () => {
    if (el.open) window.dispatchEvent(new Event("resize"));
  });
});
window.addEventListener("hashchange", reveal);
reveal();
