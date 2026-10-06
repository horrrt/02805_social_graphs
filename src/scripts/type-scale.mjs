// The type scale for chart code. Charts take their font sizes and families
// from the tokens in type.css, the same ones the page text uses, so a label
// set at "small" is 12.5px on every chart. Read at call time: the tokens are
// CSS custom properties on :root.

const root = () => getComputedStyle(document.documentElement);

/** Font size in px for a role: caption, small, body, strong, lead, h4, h3, h2, display, numeral, jumbo. */
export function fs(role) {
  const value = parseFloat(root().getPropertyValue(`--fs-${role}`));
  if (!Number.isFinite(value)) throw new Error(`unknown type role "${role}"`);
  return value;
}

/** Font family stack: sans, display or mono. */
export function family(name = "sans") {
  return root().getPropertyValue(`--font-${name}`).trim();
}

/** A canvas 2D font string, e.g. font("small", 600) -> "600 12.5px -apple-system, …". */
export function font(role, weight = 400, name = "sans") {
  return `${weight} ${fs(role)}px ${family(name)}`;
}

/**
 * The same three functions over values already read from :root, keyed by
 * property name: fromValues({ "--fs-small": "12.5px", "--font-sans": " Inter" }).
 * Pure, for useTypeScale (src/lib), which reads every --fs-* and --font-* once
 * and reads them again when the page restyles.
 */
export function fromValues(values) {
  const get = (name) => String(values[name] ?? "");
  const fs = (role) => {
    const value = parseFloat(get(`--fs-${role}`));
    if (!Number.isFinite(value)) throw new Error(`unknown type role "${role}"`);
    return value;
  };
  const family = (name = "sans") => get(`--font-${name}`).trim();
  const font = (role, weight = 400, name = "sans") => `${weight} ${fs(role)}px ${family(name)}`;
  return { fs, family, font };
}
