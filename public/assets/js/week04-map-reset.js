// A small "Reset view" button in the top right corner of a chart host. It
// stays hidden until the reader selects something (or zooms), and clicking it
// runs the chart's own reset and hides itself again. The button lives inside
// the ECharts container, so call this only after echarts.init: init empties
// the container, and later renders leave foreign children alone.

export function resetButton(host, onReset) {
  host.classList.add("w4-has-reset");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "w4-map-reset";
  btn.hidden = true;
  btn.innerHTML =
    '<svg aria-hidden="true" height="12" viewBox="0 0 24 24" width="12"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"></path></svg>' +
    "Reset view";
  btn.addEventListener("click", (event) => {
    // The page's own click handlers (reveal buttons, the chart) must not see it.
    event.stopPropagation();
    btn.hidden = true;
    onReset();
  });
  host.append(btn);
  return (show) => {
    btn.hidden = !show;
  };
}
