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
python analysis/week04_data.py --hub --lottery --no-tables  # USCIS approvals and lottery registrations: about 580 MB
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
| FY2022 | 626,084 | 562,631 | 123,317 | 936,558 | 104,600 |
| FY2023 | 543,580 | 485,508 | 109,686 | 803,849 | 116,306 |
| FY2024 | 561,037 | 502,374 | 106,862 | 841,561 | 114,499 |
| FY2025 | 594,821 | 537,796 | 104,732 | 897,289 | 147,056 |
| FY2026 (Oct to Jun) | 437,496 | 392,175 | 70,872 | 444,064 | 112,550 |

Layout differences the loader already handles:

- **No employer tax number before FY2024.** `EMPLOYER_FEIN` is missing from the H-1B files for FY2022
  and FY2023, and `EMP_FEIN` from green-card files for FY2022 and FY2023. Use the name keys below,
  which work in every year.
- **The green-card form changed in FY2024.** FY2022 to FY2024 use the old form; the loader renames its
  columns to the new form's names, and FY2024 joins both files.
- **Repeated cases.** A few cases appear in two quarterly files; the loader keeps the latest row. The
  FY2023 "Q2" file already contains Q1, so 101,027 Q1 rows were duplicates.

## Data rules

- **Never commit a raw workbook or anything under `build/`.** The files hold names, emails and phone
  numbers of employer contacts and lawyers, and some worksite addresses are workers' homes. The loader
  refuses those columns; do not add them back.
- **Identify companies with `week04_names.Resolver`** (built once as `week04_staffing.resolver()`):
  `resolver().employer(EMPLOYER_NAME, EMPLOYER_FEIN)` for the filing firm, `resolver().client(name)` for
  a client, `resolver().label(key)` to display either. An employer is its tax number (FY2022 and FY2023
  borrow it from the same name in later years); a client takes an employer's tax number when the names
  match exactly. Merges beyond a tax number are written down: company families in
  `analysis/week04_client_aliases.csv`, misspellings in `analysis/week04_name_merges.csv`. The rule for
  "same company" is at the top of the CSV. Add to those files rather than to your own script.
- **Run `python analysis/week04_schemas.py` after changing any page data.** It checks each JSON file
  against the fields and cross-references its page script reads (Pydantic models, one per file).
- **Run `python analysis/week04_names_check.py` after changing either file.** It scores the rules
  against tax numbers and fails if a known pair merges or splits wrongly
  (`analysis/week04_names_check.json`).
- **Sectors come from two tables.** `week04_names.naics2(key)` returns the reviewed sector in the alias
  CSV, else the SEC's: `python analysis/week04_sec.py` matches our companies with 5+ filings to the SEC's
  list of listed companies by exact name key, takes each one's SIC code and converts it to a NAICS
  sector (`analysis/week04_sec_sectors.csv`, 1,640 companies). A name the SEC spells differently stays
  unlabelled.
- **Approvals come from USCIS.** `week04_data.py --refs` also fetches the USCIS H-1B Employer Data Hub
  for FY2022 (complete) and FY2023 (partial) into `build/week04/uscis_fy{year}.csv.gz`. The hub gives
  only the last four digits of the tax number and abbreviates names ("SVCS"), so
  `week04_staffing.uscis_outcomes()` matches on those four digits plus a fuzzy name score of 85. In
  FY2022, firms that place most of their filings at clients had 2.73% of first-time petitions denied,
  against 1.27% for firms that hire directly.
- **Later years come from the hub's Tableau view.** The hub's CSV files stop at FY2023, but the Tableau
  view behind the hub page covers FY2009 to June 2026. `week04_data.py --hub` exports FY2022 to FY2026
  into `build/week04/uscis_hub_fy{year}.csv.gz`, with six petition types each approved or denied.
  Initial means new employment plus new concurrent employment; Continuing is the other four (checked
  against the old FY2022 file: Infosys and Cognizant agree to within one petition). The view counts
  about 5% fewer FY2022 petitions than the old file, so `uscis_outcomes(year, "uscis_hub")` builds the
  series from the view alone (`uscis_series` in `week04_staffing.json`). The view's server answers 403
  to Python's default User-Agent, and its year filter is the column header with three trailing spaces:
  without them it silently returns FY2026. FY2026 is nine months, so compare rates, not counts.
- **Lottery registrations come from a FOIA release.** USCIS gave Bloomberg News every H-1B lottery
  registration, selection and petition for the FY2021 to FY2024 lotteries; `week04_data.py --lottery`
  keeps FY2022 to FY2024 in `build/week04/lottery_fy{year}.csv.gz`, with an explicit allow-list that
  leaves out the worker's country, birth year, gender and education and the agent's name and address.
  A lottery is named by the fiscal year the visa starts, so the FY2024 lottery ran in March 2023 and its
  petitions cite LCAs from FY2023. The petition's `DOL_ETA_CASE_NUMBER` is our `CASE_NUMBER` without
  dashes. `analysis/week04_lottery.py` follows each registration to its client.
- **Certified H-1B only** unless a section says otherwise: `CASE_STATUS` is exactly "Certified" (withdrawn filings are out) and
  `VISA_CLASS` is "H-1B".
- **Say it once per section:** this is visa-sponsored hiring, not all hiring, and outsourcing firms
  dominate the placements. In FY2025 the largest by filings that place workers at a client were Tata
  Consultancy Services (7,188), Cognizant (5,044), Infosys (3,761), HCL (2,530) and Compunnel
  (2,237). By requested positions the largest is Grandison Management (57,800), which asks for 40
  physical or occupational therapists on every filing: weight by filings, not positions.
- **A filing's positions count once per metro.** The worksite file repeats a filing's workers on
  every address it lists, so summing `WORKSITE_WORKERS` counted one 100-position filing with three
  addresses as 300. Cap each (filing, metro) at the filing's `TOTAL_WORKER_POSITIONS`.
- **A firm naming itself as the client placed no one.** Section 3 drops those rows (1,881 in FY2025).

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

## Proposal, not agreed: country of birth

Proposed by Gyula on 26 September 2026; it needs all three of us before anyone builds it. Nothing below
is in the code.

The rule above keeps the worker's citizenship and country of birth out of `build/`. Two public sources
have them: the old green-card form (`COUNTRY_OF_CITIZENSHIP` and `FOREIGN_WORKER_BIRTH_COUNTRY`, FY2022
to FY2024; the new form dropped both) and the lottery release (`country_of_birth` on every registration).
The proposal: a separate script reads the column in memory and writes only counts per (country,
employer), hiding every cell under 10. No row about a person reaches `build/` or the repository, and the
DOL loader keeps refusing the column.

What it would add: a country–employer network, projected onto countries, whose nodes are the same
countries as Week 3's migration network. Counted in memory on 26 September: India is 77% of FY2023
lottery registrations and 81% of FY2024's, so the lottery gives one giant node; certified FY2023 green
cards are more varied (India 52%, China 12%, Mexico 4%, Vietnam 3%, 176 countries).

## Timeline

| When | What |
| --- | --- |
| Wed 23 Sep | Everyone runs `week04_data.py --years 2025` and their section's script |
| Fri 25 Sep, 18:00 | Progress note: first number, any blocker |
| Sun 27 Sep, 18:00 | Figure, finding and text ready |
| Sun 27 Sep, evening | Review together |
| Mon 28 Sep, 16:00 | Page live |
| Mon 28 Sep, evening | Link in the Teams channel, feedback on another group |
| Wed 30 Sep, 08:10 | Test 1, building 303A, Auditorium 42 or 43 (an email says which) |

The 🧠 exercises (4.1, 4.2, 4.3, 4.7, 4.8, 4.10) are Test 1 material: everyone does all of them on paper.

## Sources

All checked on 23 September 2026.

| Source | Use | Access |
| --- | --- | --- |
| [DOL OFLC performance data](https://www.dol.gov/agencies/eta/foreign-labor/performance): LCA disclosure (quarterly), LCA worksites and PERM, FY2022 to FY2026 Q3 | All three sections | Public domain. dol.gov serves a plain client and blocks a spoofed browser User-Agent |
| [LCA record layout FY2025](https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/LCA_Record_Layout_FY2025_Q4.pdf) | What each column means | Public |
| [Census CBSA delineation, July 2023](https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html) | County → metro area (section 1) | Public; header on row 3 |
| [Census 2023 gazetteer](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html): county subdivisions and places | New England towns → county (their filings name a town where other states name a county; Connecticut's counties are 2023 planning regions); each metro's first-named city (section 1) | Public |
| [Census regions and divisions](https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf) | Labels for NMI (section 1) | Public |
| [BLS 2018 SOC structure](https://www.bls.gov/soc/2018/soc_structure_2018.xlsx) | Occupation groups (section 2) | Public; User-Agent must name a contact |
| [USCIS H-1B Employer Data Hub](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub) | Approvals and denials per employer, FY2022 and FY2023 (section 3) | Public |
| [USCIS hub, Tableau view](https://bigdataanalyticspub-sb.uscis.dhs.gov/views/H1BEmployerDataHub-Final/H1BPublic) | Approvals and denials per employer and petition type, FY2022 to FY2026 Q3 (section 3) | Public; `.csv` export per year |
| [H-1B lottery registrations, FY2021 to FY2024](https://github.com/BloombergGraphics/2024-h1b-immigration-data) | Registrations, draws, petitions and their LCA case numbers (section 3) | USCIS data obtained by Bloomberg News under FOIA; Apache 2.0. Cite it that way |
| [SEC company tickers](https://www.sec.gov/files/company_tickers.json) and [submissions API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | SIC industry of listed companies (sectors, section 3) | Public; www.sec.gov needs a contact User-Agent, data.sec.gov does not |

Traps found so far:

- 19.5% of certified H-1B filings in FY2025 name a client (104,732 of 537,796), counting only
  "Certified", not "Certified - Withdrawn" (30,111 more that year).
- In a first look at July to September 2025 only, 8.6% of client names were placeholders such as
  "Home Address", "Beneficiary's Residence", "Remote" or "TBD Open".
- Corporate families survive simple name cleaning ("Bank of America" and "Bank of America N A").
- In that same quarter the staffing network was a forest of stars (median degree 1), and one Louvain run
  gave 46 communities at modularity 0.735, which a shuffled network may match. Section 3 must show the
  comparison, on the full year.
- Clients carry no industry code; in that quarter only 17.2% matched a filing employer's NAICS by name.
