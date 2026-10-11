// Runs the essentials checks against the data-story version of the page as well.
process.env.W6E_PAGE = "out/weeks/week06/essentials/story/index.html";
await import("./week06-essentials.test.mjs");
