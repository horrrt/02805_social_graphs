// Page script for /styleguide/, moved out of the page's inline <script type="module">.
// The three dropdowns do to this page what the post's style bar does to
// the post: set a data attribute on the body. No script draws anything.
const params = new URLSearchParams(window.location.search);
const body = document.body;
for (const select of document.querySelectorAll("#style-bar select")) {
  const key = select.dataset.dimension;
  const asked = params.get(key);
  if (asked && [...select.options].some((o) => o.value === asked)) select.value = asked;
  body.dataset[key] = select.value;
  select.addEventListener("change", () => {
    body.dataset[key] = select.value;
    const url = new URL(window.location.href);
    url.searchParams.set(key, select.value);
    window.history.replaceState(null, "", url.pathname + url.search);
  });
}
const trigger = document.getElementById("style-trigger");
const bar = document.getElementById("style-bar");
trigger.addEventListener("click", (event) => {
  event.stopPropagation();
  bar.hidden = !bar.hidden;
  trigger.setAttribute("aria-expanded", String(!bar.hidden));
});
bar.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", () => {
  bar.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
});
