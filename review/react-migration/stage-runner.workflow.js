export const meta = {
  name: 'react-rewrite-stage',
  description: 'Run React-rewrite batches from review/react-migration/plan.json: implement, verify, fix, adversarial review',
  whenToUse: 'Execute one merge stage of the React rewrite; args = {batches: [ids], parallel: bool}',
  phases: [
    { title: 'Implement', detail: 'implementer per batch' },
    { title: 'Verify', detail: 'independent verifier runs the batch checks' },
    { title: 'Review', detail: 'adversarial review of the batch diff' },
  ],
}

const ids = args.batches
const PARALLEL = !!args.parallel

const COMMON = `You are working in a git checkout of the DTU 02805 course site (Next.js 16 static export), on the React rewrite the owner chose.
The authoritative plan is review/react-migration/plan.json (read it with a tool; it is large, so read the fields you need):
- "architecture", "testStrategy", "fixesForFatalFlaws", "knownBugsPreserved", "risks": shared contracts every batch obeys;
- "batches": find the batch by its "id"; its "spec", "owns", "contracts", "verification" and "doneWhen" are your instructions.
review/react-migration/map.json maps how the old scripts behaved on main (DOM contract, state, hazards).
Also follow README.md, AGENTS.md, .github/copilot-instructions.md and .github/instructions/*.md.
Rules:
- Edit only files the batch "owns". If you need a change outside them, follow the gap protocol in the spec/README (a request file under review/react-migration/requests/ once it exists) and say so.
- No single shell command may run longer than ~2 minutes: run long builds/parity in the background with output to a log and poll it.
- Never use the hidden Browser pane. Desktop only.
- Commit your work on the current branch when done, Conventional Commits "type(scope): subject" (scope site, tests, week03, week04, week05, ci, docs ...), message ending with the line "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>". Do not push. Do not merge. Do not touch other branches or worktrees.
- Readers must see the same site. Never weaken a test. Preserve known bugs.
- An earlier attempt at a batch may have been cut off mid-way. Before starting, run git log --oneline origin/main..HEAD and git status: if commits or uncommitted files for your batch already exist, review them against the spec and continue from there instead of redoing them (fix them if they are wrong).`

const RESULT = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    commits: { type: 'array', items: { type: 'string' }, description: 'sha and subject of each commit made' },
    summary: { type: 'string' },
    checksRun: { type: 'array', items: { type: 'string' }, description: 'each verification command and its result' },
    deviations: { type: 'array', items: { type: 'string' }, description: 'anything done differently from the spec, and why' },
    requests: { type: 'array', items: { type: 'string' }, description: 'changes needed outside owned files' },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'commits', 'summary', 'checksRun', 'deviations', 'requests', 'blockers'],
}
const VERDICT = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    failures: { type: 'array', items: { type: 'string' }, description: 'concrete failing checks or unmet doneWhen items, with command output excerpts and file:line' },
    checksRun: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'failures', 'checksRun'],
}
const REVIEW = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          file: { type: 'string' },
          issue: { type: 'string' },
          scenario: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'file', 'issue', 'scenario', 'fix'],
      },
    },
  },
  required: ['findings'],
}

async function runBatch(id) {
  const tag = (s) => `${s}:${id}`
  let impl = await agent(`${COMMON}

Implement batch ${id}. Read its entry in review/react-migration/plan.json and implement it completely, then run its "verification" yourself and fix what fails before committing. Report precisely.`,
    { label: tag('implement'), phase: 'Implement', schema: RESULT, effort: 'high', agentType: 'implementer' })
  if (!impl) return { id, status: 'agent-failed' }
  if (impl.status === 'blocked') return { id, status: 'blocked', impl }

  let verdict = null
  for (let round = 1; round <= 3; round++) {
    verdict = await agent(`${COMMON}

You are the independent verifier for batch ${id}. Do NOT edit files. Read the batch's "verification" and "doneWhen" in review/react-migration/plan.json and run every check yourself on the current HEAD (git log to see the batch's commits: ${JSON.stringify(impl.commits)}). Also run npm run typecheck and npm test (in the background with a log, polling). Report pass only if every check and every doneWhen item holds, with evidence.`,
      { label: tag(`verify${round}`), phase: 'Verify', schema: VERDICT, effort: 'high' })
    if (!verdict) break
    if (verdict.pass) break
    log(`${id}: verify round ${round} failed (${verdict.failures.length})`)
    if (round === 3) break
    const fix = await agent(`${COMMON}

Batch ${id} failed independent verification. Fix every failure below within the batch's owned files (or file a request if a fix is outside them), re-run the checks, and commit.
Failures:
${verdict.failures.map((f) => '- ' + f).join('\n')}`,
      { label: tag(`fix${round}`), phase: 'Implement', schema: RESULT, effort: 'high', agentType: 'implementer' })
    if (fix) impl = { ...impl, commits: [...impl.commits, ...fix.commits], deviations: [...impl.deviations, ...fix.deviations], requests: [...impl.requests, ...fix.requests] }
  }
  if (!verdict || !verdict.pass) return { id, status: 'verify-failed', impl, verdict }

  const review = await agent(`${COMMON}

Adversarially review batch ${id}'s commits (${JSON.stringify(impl.commits)}; use git log/git show) against its spec in review/react-migration/plan.json. Do NOT edit files. Hunt for: behaviour readers would notice versus main (text, ids, URL params, storage, interactions, failure modes, hydration warnings), weakened or vacuous tests, spec items skipped or done differently, files edited outside "owns", gates that cannot fail, commands that would exceed 2 minutes. Run code and tests to confirm each finding. Report only real issues.`,
    { label: tag('review'), phase: 'Review', schema: REVIEW, effort: 'high', agentType: 'reviewer' })
  const serious = (review?.findings || []).filter((f) => f.severity !== 'minor')
  if (serious.length) {
    log(`${id}: review found ${serious.length} serious issue(s); fixing`)
    const fix = await agent(`${COMMON}

An adversarial review of batch ${id} found these issues. Fix each one (or show with evidence that it is not real), re-run the batch verification and npm test, and commit.
${serious.map((f) => `- [${f.severity}] ${f.file}: ${f.issue} | scenario: ${f.scenario} | fix: ${f.fix}`).join('\n')}`,
      { label: tag('review-fix'), phase: 'Implement', schema: RESULT, effort: 'high', agentType: 'implementer' })
    const reverify = await agent(`${COMMON}

Re-verify batch ${id} after review fixes. Do NOT edit files. Run its "verification" from review/react-migration/plan.json, npm run typecheck and npm test, and confirm each of these review findings is fixed:
${serious.map((f) => `- ${f.file}: ${f.issue}`).join('\n')}`,
      { label: tag('reverify'), phase: 'Verify', schema: VERDICT, effort: 'high' })
    return { id, status: reverify?.pass ? 'done' : 'review-fix-failed', impl, fix, review, reverify }
  }
  return { id, status: 'done', impl, review }
}

const results = []
if (PARALLEL) {
  results.push(...(await parallel(ids.map((id) => () => runBatch(id)))))
} else {
  for (const id of ids) {
    const r = await runBatch(id)
    results.push(r)
    log(`${id}: ${r?.status}`)
    if (!r || r.status !== 'done') break
  }
}
return results
