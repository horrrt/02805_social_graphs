// Each page credits the data sources whose licences ask for it: CC BY 4.0
// (UNHCR, World Bank, Eurostat, OxCGRT), CC BY-SA 4.0 (Wikipedia text in
// arcade_graph.json), ODbL (OpenFlights, share-alike on our route counts) and
// NASA Visible Earth (a link back for the globe imagery), and O*NET (CC BY 4.0
// with USDOL/ETA's prescribed wording, on week 4).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const footer = (page) => {
  const html = builtPage(page);
  const start = html.indexOf("<footer");
  assert.ok(start >= 0, `${page} has no footer`);
  return html.slice(start, html.indexOf("</footer>", start)).replace(/\s+/g, " ");
};

const WIKIPEDIA = ["English Wikipedia", 'href="https://creativecommons.org/licenses/by-sa/4.0/"'];

for (const page of ["out/index.html", "out/weeks/week01/index.html", "out/weeks/week02/index.html"]) {
  test(`${page} credits Wikipedia under CC BY-SA 4.0`, () => {
    const text = footer(page);
    for (const credit of WIKIPEDIA) assert.ok(text.includes(credit), `${page} footer should include ${credit}`);
  });
}

test("week 3 credits every source its licence asks for", () => {
  const text = footer("out/weeks/week03/index.html");
  for (const credit of [
    "UNHCR Refugee Population Statistics Database",
    "World Bank, World Development Indicators",
    "Eurostat, asylum applicants by citizenship",
    "Blavatnik School of Government, University of Oxford",
    'href="https://opendatacommons.org/licenses/odbl/1-0/"',
    "offered under the same licence",
    'href="https://visibleearth.nasa.gov/collection/1484/blue-marble"',
    'href="https://creativecommons.org/licenses/by/4.0/"',
  ]) {
    assert.ok(text.includes(credit), `week 3 footer should include ${credit}`);
  }
});

test("week 4 credits O*NET in USDOL/ETA's prescribed wording", () => {
  const text = footer("out/weeks/week04/index.html");
  for (const credit of [
    "This page includes information from the O*NET® 31.0 Database",
    "O*NET® 25.0 Database",
    "by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA)",
    'href="https://creativecommons.org/licenses/by/4.0/"',
    "has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.",
  ]) {
    assert.ok(text.includes(credit), `week 4 footer should include ${credit}`);
  }
});

test("week 4 credits USCIS for the registrations per lottery draw", () => {
  const text = footer("out/weeks/week04/index.html");
  for (const credit of [
    "Registrations per lottery draw: USCIS",
    'href="https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations/h-1b-electronic-registration-process"',
  ]) {
    assert.ok(text.includes(credit), `week 4 footer should include ${credit}`);
  }
});
