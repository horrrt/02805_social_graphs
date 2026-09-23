# Week 4 · Who hires America's foreign workers?

The plan for the Week 4 post (communities and backbones), proposed 23 September 2026. The post goes in
[docs/weeks/week04/index.html](docs/weeks/week04/index.html); every number comes from a script in
`analysis/`.

## The story

The US Department of Labor publishes every H-1B and green-card (PERM) filing: which company hires, for
which job, where, and, for outsourcing, which client the worker actually sits at. The post follows one
hire outwards: the place, then the job, then the company behind it. Each step is a different network and
carries a different part of Week 4.

| Section | Owner | Network | Week 4 method | Script |
| --- | --- | --- | --- | --- |
| Opening | Niklas | | | |
| 1 · Where does the hiring happen? | Àngela | Companies × cities, projected onto metro areas | Backbones, communities against Census regions | `analysis/week04_where.py` |
| 2 · Which jobs go together? | Niklas | Companies × occupations, projected onto occupations | Backbones, overlapping communities | `analysis/week04_jobs.py` |
| 3 · Who really employs them? | Gyula | Outsourcing firm → client company | Communities, weights | `analysis/week04_staffing.py` |
| Closing | Niklas | | | |

### Opening · Niklas

- What is an H-1B filing?
- Why companies instead of the philosophers?
- What does this data leave out?

### 1 · Where does the hiring happen? · Àngela

- Which cities hire the most?
- Once the small links go, what's left of the map?
- Is it one national job market or several regional ones?
- Do the same employers tie distant cities together?

### 2 · Which jobs go together? · Niklas

- Which jobs are hired together?
- Which jobs belong to two clusters at once?
- Do the clusters follow the official job groups?

### 3 · Who really employs them? · Gyula

- How many workers sit at a client instead of their own employer?
- Do clients group by industry or by the firm that staffs them?
- Who relies on a single vendor?
- Does it hold from year to year?

### Closing · Niklas

- What do place, job and company add up to?
- One takeaway, one limit, the AI-use note.

## Start here

```bash
python -m pip install -r requirements-lock.txt     # adds python-calamine, the Excel reader
python analysis/week04_data.py --years 2025        # one year first: about 560 MB
python analysis/week04_data.py                     # all five years: 2.6 GB, about 6 minutes
CONTACT_EMAIL=you@student.dtu.dk python analysis/week04_data.py --refs --no-tables
python analysis/week04_where.py                    # or week04_jobs.py, week04_staffing.py
```

`week04_data.py` downloads the DOL workbooks to `build/raw/week04/`, keeps only the allowed columns and
writes one gzipped CSV per table and year to `build/week04/`. Your script reads them with
`load("lca_fy2025")`. If you already have the workbooks, point at them with `--local DIR [DIR ...]`.
The `--refs` run fetches the Census metro file and the BLS occupation groups; BLS refuses requests whose
User-Agent has no contact address, hence `CONTACT_EMAIL`. `build/` is gitignored.

A US fiscal year runs from 1 October to 30 September: FY2025 is October 2024 to September 2025.
**DOL publishes H-1B applications one file per quarter**; the loader joins a year's four files, and
every row keeps its `SOURCE_FILE`. FY2026 is the latest release (7 August 2026) and stops at June 2026.

| Year | `lca_fy…` (H-1B applications) | Certified H-1B | Name a client | `worksites_fy…` | `perm_fy…` (green card) |
| --- | --- | --- | --- | --- | --- |
| FY2022 | 626,084 | 597,093 | 130,226 | 936,558 | 104,600 |
| FY2023 | 543,580 | 518,012 | 115,577 | 803,849 | 116,306 |
| FY2024 | 561,037 | 534,037 | 113,771 | 841,561 | 114,499 |
| FY2025 | 594,821 | 567,907 | 109,374 | 897,289 | 147,056 |
| FY2026 (Oct to Jun) | 437,496 | 417,721 | 75,369 | 444,064 | 112,550 |

Layout differences the loader already handles:

- **No employer tax number before FY2024.** `EMPLOYER_FEIN` is missing from the H-1B files for FY2022
  and FY2023, and `EMP_FEIN` from green-card files for FY2022 and FY2023. Match employers by name for
  those years.
- **The green-card form changed in FY2024.** FY2022 to FY2024 use the old form; the loader renames its
  columns to the new form's names, and FY2024 joins both files.
- **Repeated cases.** A few cases appear in two quarterly files; the loader keeps the latest row. The
  FY2023 "Q2" file already contains Q1, so 101,027 Q1 rows were duplicates.

## Data rules

- **Never commit a raw workbook or anything under `build/`.** The files hold names, emails and phone
  numbers of employer contacts and lawyers, and some worksite addresses are workers' homes. The loader
  refuses those columns; do not add them back.
- **Identify employers by `EMPLOYER_FEIN`** (the tax number, on every row). Only section 3 needs to clean
  names, because clients have no tax number.
- **Certified H-1B only** unless a section says otherwise: `CASE_STATUS` starts with "Certified" and
  `VISA_CLASS` is "H-1B".
- **Say it once per section:** this is visa-sponsored hiring, not all hiring, and outsourcing firms
  dominate the placements. In FY2025 the largest by filings that place workers at a client were Tata
  Consultancy Services (7,221), Cognizant (5,044), Infosys (3,762), HCL America (2,525) and Compunnel
  (2,237). By requested positions the largest is Grandison Management (57,800), which asks for 40
  physical or occupational therapists on every filing: weight by filings, not positions.

## What every section delivers

1. An edge list from its script.
2. Its main number against a shuffled baseline (a network that keeps everyone's number of links, or
   shuffled labels for NMI).
3. 100 Louvain runs instead of one, and the same analysis on another year (FY2022 to FY2025 are
   complete years; FY2026 is nine months).
4. One figure and one finding that could have come out the other way.
5. About 250 words, and a JSON file (`analysis/week04_<section>.json`) with every number it quotes.

## Shared jobs

| Job | Owner |
| --- | --- |
| Put the page live: lobby card, `docs/assets/js/weeks.js`, the site test, remove `noindex` | Àngela |
| Opening and closing sections, AI-use note | Niklas |
| Teams post, feedback on another group, final read against the brief | Gyula |

## Timeline

| When | What |
| --- | --- |
| Wed 23 Sep | Everyone runs `week04_data.py --years 2025` and their section's script |
| Fri 25 Sep, 18:00 | Progress note: first number, any blocker |
| Sun 27 Sep, 18:00 | Figure, finding and text ready |
| Sun 27 Sep, evening | Review together |
| Mon 28 Sep, 16:00 | Page live |
| Mon 28 Sep, evening | Link in the Teams channel, feedback on another group |
| Wed 30 Sep, 08:10 | Test 1, building 208, room 054 |

The 🧠 exercises (4.1, 4.2, 4.3, 4.7, 4.8, 4.10) are Test 1 material: everyone does all of them on paper.

## Sources

All checked on 23 September 2026.

| Source | Use | Access |
| --- | --- | --- |
| [DOL OFLC performance data](https://www.dol.gov/agencies/eta/foreign-labor/performance): LCA disclosure FY2024 and FY2025, LCA worksites FY2025, PERM FY2025 | All three sections | Public domain. dol.gov serves a plain client and blocks a spoofed browser User-Agent |
| [LCA record layout FY2025](https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/LCA_Record_Layout_FY2025_Q4.pdf) | What each column means | Public |
| [Census CBSA delineation, July 2023](https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html) | County → metro area (section 1) | Public; header on row 3 |
| [Census regions and divisions](https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf) | Labels for NMI (section 1) | Public |
| [BLS 2018 SOC structure](https://www.bls.gov/soc/2018/soc_structure_2018.xlsx) | Occupation groups (section 2) | Public; User-Agent must name a contact |
| [USCIS H-1B Employer Data Hub](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub) | Approvals per employer, optional attributes | Public |

Traps found so far:

- 19.3% of certified H-1B filings in FY2025 name a client (109,374 of 567,907).
- In a first look at July to September 2025 only, 8.6% of client names were placeholders such as
  "Home Address", "Beneficiary's Residence", "Remote" or "TBD Open".
- Corporate families survive simple name cleaning ("Bank of America" and "Bank of America N A").
- In that same quarter the staffing network was a forest of stars (median degree 1), and one Louvain run
  gave 46 communities at modularity 0.735, which a shuffled network may match. Section 3 must show the
  comparison, on the full year.
- Clients carry no industry code; in that quarter only 17.2% matched a filing employer's NAICS by name.
