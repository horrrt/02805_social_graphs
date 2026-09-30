// Week 5 boot: only the two owned sections (search + autocomplete).

import { bootSearch } from "./week05-search.js?v=2";
import { bootAutocomplete } from "./week05-autocomplete.js?v=2";

async function main() {
  try {
    await Promise.all([bootSearch(), bootAutocomplete()]);
  } catch (err) {
    console.error("week05 boot failed", err);
    const status = document.querySelector("#w5-boot-status");
    if (status) {
      status.textContent = "Could not load the week 5 interactive data.";
      status.hidden = false;
    }
  }
}

main();
