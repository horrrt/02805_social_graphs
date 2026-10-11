# Gap requests

A batch edits only the files its `owns` list in [plan.json](../plan.json) names. When it needs a change in a
file it does not own (a tool flag, a kit component, a slot in a section file, a test), it files a request here
instead of making the edit.

## How to file one

- One file per batch: `review/react-migration/requests/<batch>.md`, for example `requests/W4-F2.md`. Add later
  requests from the same batch to the same file, each under its own heading.
- Each request gives the file to change, the exact patch (a unified diff, or the full new text of a small file)
  and the reason: what fails without it and which spec step needs it.
- If the batch cannot wait, it adds a shim inside its own folder whose first line is `// shim: <batch>`, and lists
  the shim in its final report. Never edit the other file to get past the gap.
- Commit the request with the rest of the batch.

## How requests are applied

The orchestrator reads every request between waves, applies the patches on the integration branch (or on main
for Stage 1 tools) and reruns the checks the changed file affects. Shims are removed once their request lands,
at the latest by the page's close batch.

A request that changes a tool in `scripts/parity/` must keep every check it already makes; tools never get
weaker to let a batch pass.
