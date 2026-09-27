// Conventional Commits for this repository (https://www.conventionalcommits.org).
// The rules people and assistants follow are in .github/copilot-instructions.md;
// .github/workflows/commit-format.yml checks every pull request against this file.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // A scope names the part of the repository; a new one is a warning, not an error.
    "scope-enum": [1, "always", [
      "week01", "week02", "week03", "week04", "week05", "week06", "week07", "week08",
      "site", "analysis", "names", "data", "tests", "ci", "deps", "docs",
    ]],
    // Subjects often start with a name or acronym (H-1B, USCIS, TCS): no case rule.
    "subject-case": [0],
    "header-max-length": [2, "always", 72],
    // Trailers such as Co-Authored-By can run long.
    "body-max-line-length": [1, "always", 100],
    "footer-max-line-length": [1, "always", 100],
  },
};
