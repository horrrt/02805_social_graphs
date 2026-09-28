# Text transfer report

Written by `tools/port_text.py`, one section per board.

## RTop

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### top
- **hero#0**
  - before: Where the hiring is , which occupations travel together, which firms staff the seats, what changes without the biggest firms, and what the filings show beyond the networks, all from the same Department of Labor disclosures. Years are the US government's fiscal years, October to September: 2025 runs from October 2024 to September 2025.
  - after: Where the hiring is , which occupations travel together, which firms staff the seats, what changes without the biggest firms, and what the filings show beyond the networks, all from the same Department of Labor disclosures. Years are US fiscal years.

**Terms added:** 
- `w4-term-top-fiscal-year`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** none

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** none

**Style lint (3.7) on the page text:** no new hits

## ROpening

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### opening>opener
- **opener#1**
  - before: An H-1B filing is an employer’s request to hire a non-US worker in a specialty occupation.
  - after: An H-1B filing is an employer’s request to hire a non-US worker in a specialty occupation.

### opening>w4-card
- **para#0**
  - before: It names the job, the worksite, the wage, and the company asking for permission to employ them. The Department of Labor records the filing even when the worker never arrives, changes employer, or is ultimately not hired.
  - after: It names the job, the worksite, the wage and the company asking to employ the worker. The Department of Labor records the filing even when the worker never arrives, changes employer or is not hired.
- **para#1**
  - before: Why start with companies? A job title tells us what work is requested; a company tells us which jobs, places, and clients are connected by the same hiring system. That makes the employer the thread linking the three networks in this story. The network is about shared filings, not friendships between workers or companies.
  - after: Why start with companies? The employer is the thread linking the three networks in this story.
- **notice#0**
  - before: Read the scope carefully These are visa-sponsored filings, not all hiring in America. They leave out workers without H-1B sponsorship, employers that never file, rejected or withdrawn applications, and the wider conditions that shape who gets hired.
  - after: Read the scope carefully These are visa-sponsored filings, not all hiring in America.
- **para#2**
  - before: Unless stated otherwise, the figures below use certified H-1B filings in 2025. One filing is a request, not a guaranteed job.
  - after: Unless stated otherwise, the figures below use certified H-1B filings in 2025. One filing is a request, not a guaranteed job.
- **drawers#0 (added)**
  - before: (none)
  - after: Background A job title tells us what work is requested; a company tells us which jobs, places, and clients are connected by the same hiring system. The links mean shared filings. They say nothing about friendships between workers or companies. The filings leave out workers without H-1B sponsorship, employers that never file, rejected or withdrawn applications, and the wider conditions that shape who gets hired.

**Terms added:** 
- `w4-term-opening-specialty`
- `w4-term-opening-certified`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** none

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** none

**Style lint (3.7) on the page text:** no new hits

