# Week 4 · Who hires America's foreign workers?

The plan for the Week 4 post (communities and backbones), proposed 23 September 2026. The post goes in
[src/app/(week04)/weeks/week04/page.tsx](../src/app/(week04)/weeks/week04/page.tsx); every number comes from a script in
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
- **Run `python analysis/check_pages.py` after changing any page data.** It checks each week's JSON files
  against the fields and cross-references their page scripts read (Pydantic models, one per file).
- **Corporate parents come from GLEIF.** `python analysis/week04_gleif.py` matches every company spelling
  with 20+ filings to the US entries of GLEIF's register (Golden Copy, 26 Sep 2026, CC0) by exact
  normalized name and follows each to its ultimate parent. Spellings that share a parent and a brand
  with a company the alias table already names are appended there with `--write` (47 rows on 26 Sep:
  Deloitte & Touche, Salesforce.com, Dell Marketing, Moody's units, Infosys Public Services, Ford Motor
  Credit...). Separately branded companies (LinkedIn, Red Hat, Splunk, Twitch) and new families the
  script would have to name itself go to `review` and `new_families` in `analysis/week04_gleif.json`
  for a person to decide. The raw files are in `build/raw/gleif/` (482 MB; fetch with aria2c).
- **Rerun everything in parallel after a name change:** `python analysis/week04_run_all.py` starts every
  week 4 script at once (the staffing figure waits for staffing) and logs to `build/logs/`; about
  7 minutes instead of 21. Then run the site tests, which name every sentence whose number moved.
- **Run `python analysis/week04_names_check.py` after changing either file.** It scores the rules
  against tax numbers and fails if a known pair merges or splits wrongly
  (`analysis/week04_names_check.json`).
- **Sectors come from two tables.** `week04_names.naics2(key)` returns the reviewed sector in the alias
  CSV, else the SEC's: `python analysis/week04_sec.py` matches our companies with 5+ filings to the SEC's
  list of listed companies by exact name key, takes each one's SIC code and converts it to a NAICS
  sector (`analysis/week04_sec_sectors.csv`, 1,640 companies). A name the SEC spells differently stays
  unlabelled.
- **Approvals come from USCIS.** `week04_data.py --refs` also fetches the USCIS H-1B Employer Data Hub
  for FY2022 (complete) and FY2023 (partial) into `build/week04/uscis_fy{year}.parquet`. The hub gives
  only the last four digits of the tax number and abbreviates names ("SVCS"), so
  `week04_staffing.uscis_outcomes()` matches on those four digits plus a fuzzy name score of 85. In
  FY2022, firms that place most of their filings at clients had 2.73% of first-time petitions denied,
  against 1.27% for firms that hire directly.
- **Later years come from the hub's Tableau view.** The hub's CSV files stop at FY2023, but the Tableau
  view behind the hub page covers FY2009 to June 2026. `week04_data.py --hub` exports FY2022 to FY2026
  into `build/week04/uscis_hub_fy{year}.parquet`, with six petition types each approved or denied.
  Initial means new employment plus new concurrent employment; Continuing is the other four (checked
  against the old FY2022 file: Infosys and Cognizant agree to within one petition). The view counts
  about 5% fewer FY2022 petitions than the old file, so `uscis_outcomes(year, "uscis_hub")` builds the
  series from the view alone (`uscis_series` in `week04_staffing.json`). The view's server answers 403
  to Python's default User-Agent, and its year filter is the column header with three trailing spaces:
  without them it silently returns FY2026. FY2026 is nine months, so compare rates, not counts.
- **Lottery registrations come from a FOIA release.** USCIS gave Bloomberg News every H-1B lottery
  registration, selection and petition for the FY2021 to FY2024 lotteries; `week04_data.py --lottery`
  keeps FY2022 to FY2024 in `build/week04/lottery_fy{year}.parquet`, with an explicit allow-list of 34
  columns. Since 29 September 2026 it keeps the petition's cap type (`S3Q1`), whether the worker was
  abroad (`REQUESTED_ACTION`) and the employer's US staff (`NUM_OF_EMP_IN_US`, usable from FY2023), and
  some personal columns on purpose (`LOTTERY_PERSONAL`): the worker's country of birth and nationality,
  birth year, gender, current status, education, field of study, pay, worksite and dates, and the filing
  agent's name. They stay in `build/`; only counts may reach a JSON, a page or a commit. It still leaves
  out the redacted IDs and birth dates, the employer's addresses and the columns that never vary.
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
| Put the page live: lobby card, `src/scripts/weeks.js`, the site test, remove `noindex` | Àngela |
| Opening and closing sections, AI-use note | Niklas |
| Teams post, feedback on another group, final read against the brief | Gyula |

## Country of birth: built, aggregates only

Gyula decided on 26 September 2026 to build the country network (the "Where are they from?" box in the
deep dive's "More networks"); Àngela and Niklas should look it over in the Sunday review.

The DOL loader still refuses citizenship and country of birth. `analysis/week04_countries.py` reads
them on its own, in memory only: `COUNTRY_OF_CITIZENSHIP` from the old-form green-card workbooks
(FY2022 to FY2024; the new form dropped it) and `country_of_birth` from the lottery release. It keeps
counts per (country, employer), drops every count under 10 before anything else uses them, and writes
only aggregates to `analysis/week04_countries.json`. No row about a person reaches the repository. The
lottery tables in `build/` carry the worker's country since 29 September 2026 (see above), but
`week04_countries.py` still reads the release itself. The suppression drops 43% of FY2023's certified green cards, so the network covers the
large country-employer pairs only.

## Entity networks: every worker and company as a dot

`analysis/week04_entities.py` (Gyula, 29 to 30 September 2026) draws every 2025 worker and every filing
company as a dot, coloured by its Louvain community, in the deep-dive box `#entity-communities`. It uses only
the course's tools, the way the Week 4 brief treats the philosophers: Louvain, best Q of 100 seeds, against
20 degree-preserving rewirings, NMI between seeds, and NMI against labels, with each label's shuffled NMI as
its chance level. It also runs the Week 1 to 4 toolkit (degree distributions, random baselines, the
friendship paradox, centralities, assortativity, cores, greedy merging and Infomap, the disparity filter,
k-clique communities).

- A worker is a requested H-1B position in a certified filing or a certified PERM case: 1,011,687 in 2025.
  Workers with the same occupation, metro, wage level and sector form one profile (91,322).
- The network is bipartite, like section 3's staffing network: profiles (or companies) on one side,
  occupations, metros, wage levels and sectors on the other (1,705), each linked with weight = workers. No
  similarity measure: two workers connect only through something they share. A first version linked profiles
  to their k nearest neighbours; Gyula dropped it on 30 September because kNN is not in the course.
- The employer and the placement flag are not in the network; their NMI with the groups is the test.
- Paths, clustering, centrality and the backbone run on the projection onto the attributes (week04_jobs
  builds its occupation network the same way): a bipartite network has no triangles.
- Traps: the 2025 PERM form has no wage level, so PERM workers take the most common H-1B level of the same
  occupation and metro. PERM counties are all blank; they borrow the usual county of the city from the H-1B
  worksites. As in section 3, the weighted rewired networks score a higher modularity than the real one (a
  few heavy links let them split around those links), so the page shows the wiring-only null beside it. NMI
  rises with a label's number of values, so the employer is read against its shuffled NMI. The backbones
  hold over 20,000 maximal cliques, and networkx compares cliques pairwise, so k-clique percolation is
  skipped. DrL on the whole bipartite network took 25 minutes, so the layout runs DrL on the projection and
  puts each profile at the weighted average of its attributes.
- The loader (`week04_data.py`) keeps 20 more LCA columns, 6 more worksite columns and 22 more PERM
  columns since 29 September, none personal; adding them changed no committed number.
- Adding an entity (staffing firms, law firms, O*NET occupations) means one function in its `REGISTRY`.
- Two node-link views sit beside the dots, drawn as the course draws the philosophers (exercise 4.11: the
  disparity backbone with an alpha control, dropped links faint or hidden, nodes sized by strength and
  coloured by Louvain group, the largest member named, the alpha curve): section 3's staffing network (the
  1,000 firms and clients with the most placed filings, coloured by section 3's own partition), and employers
  linked by a shared law firm (1,500 employers, a group's label names its main law firm). Tried and dropped on
  30 September: companies linked by a shared occupation and metro (density 0.49, a hairball at every alpha),
  occupations x metros (a star around Software Developers and New York, Q 0.22), and the two projections of the
  staffing network (density about 0.3, Q under 0.2).

## The deep dive

Everything past the closing sits in one section, `#cut` ("Deep dive"). It opens on a catalogue
(`#cut-catalogue`) with a card for each topic and one for the data, each listing its boxes as links. Five topics follow:
"Where the hiring is" (`#topic-where`), "Jobs and skills" (`#topic-jobs`), "Outsourcing firms and their
clients" (`#topic-outsourcing`), "Paperwork, the lottery and green cards" (`#topic-paperwork`) and "Five
years" (`#topic-years`). Each has a contents list, shows one box at a time and numbers its boxes in
contents order. "Data and methods" (`#evidence`) comes last, with no contents list, and stays the target
of every "Data and methods" link. Only one of the six is open at a time. Section 3's first-round
questions now sit in three boxes: `#who-q2` and `#who-q3` under Outsourcing, `#who-q4` under Five years.

`src/scripts/week04-cut.js` opens the right topic and box for any in-page link. Its `ALIAS` table
keeps the old anchors working: `#cut-place`, `#cut-jobs` and `#cut-who` open their topics,
`#who-first-round` opens `#who-q2`, `#cut-more` lands on the catalogue and `#place-inspector` on
`#place-start`. `tests/week04-prose.test.mjs` pins each box's numbers and fails if a box leaves the deep
dive; `tests/week04-structure.test.mjs` checks the rail, the drawers, the contents links, the box
numbers and the aliases.

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
| [O*NET 31.0 Database](https://www.onetcenter.org/database.html) (`db_31_0_csv/`) | What each occupation involves: importance of 35 skills, 33 knowledge areas and 41 work activities, for the skill similarity of occupations (`analysis/week04_skills.py`, for section 2). 31.0 leaves financial and investment analysts and financial risk specialists unrated, so those two come from [O*NET 25.0](https://www.onetcenter.org/db_releases.html) (Financial Analysts, rated 2016; Risk Management Specialists, rated 2018) through the [2010-to-2019 O*NET-SOC crosswalk](https://www.onetcenter.org/taxonomy/2019/walk.html) | CC BY 4.0: credit "O*NET 31.0 Database, U.S. Department of Labor, Employment and Training Administration" on the page. Checked 27 September 2026 |
| [USCIS H-1B Employer Data Hub](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub) | Approvals and denials per employer, FY2022 and FY2023 (section 3) | Public |
| [USCIS hub, Tableau view](https://bigdataanalyticspub-sb.uscis.dhs.gov/views/H1BEmployerDataHub-Final/H1BPublic) | Approvals and denials per employer and petition type, FY2022 to FY2026 Q3 (section 3) | Public; `.csv` export per year |
| [H-1B lottery registrations, FY2021 to FY2024](https://github.com/BloombergGraphics/2024-h1b-immigration-data) | Registrations, draws, petitions and their LCA case numbers (section 3) | USCIS data obtained by Bloomberg News under FOIA; Apache 2.0. Cite it that way |
| [USCIS H-1B Electronic Registration Process](https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations/h-1b-electronic-registration-process), Historical Data table | Eligible registrations, those for workers registered more than once, and selected registrations for each cap year 2021 to 2026, the March 2020 to March 2025 draws (`analysis/week04_more_page.py`, deep dive) | Public domain; `week04_data.py --refs` saves the page. Selected counts every round of a cap year |
| [SEC company tickers](https://www.sec.gov/files/company_tickers.json) and [submissions API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | SIC industry of listed companies (sectors, section 3) | Public; www.sec.gov needs a contact User-Agent, data.sec.gov does not |
| [BLS OEWS, May 2025, metropolitan areas](https://www.bls.gov/oes/tables.htm) (`oesm25ma.zip`) | Jobs per metro and per occupation: filings per 1,000 jobs (`analysis/week04_oews.py`, for section 1) | Public; bls.gov needs a contact User-Agent (`CONTACT_EMAIL`) |
| [Wikidata](https://www.wikidata.org/) (wbsearchentities, wbgetentities, SPARQL) | Industry (P452, P3224 NAICS, P3242 SIC) of clients the SEC does not list (`analysis/week04_wikidata.py`, section 3) | CC0; cached in `build/raw/week04/wikidata/` |

Added 26 September 2026, section 3 (Gyula): `week04_shift.py` (January to June of FY2024, FY2025 and
FY2026), `week04_ties.py` (strength against degree, bipartite link overlap against filings, wage level
by community, PERM against H-1B per employer), `week04_lawfirms.py` (employer x law firm, projected onto
law firms: disparity filter against a threshold, communities). `week04_oews.py` writes denominators for
section 1 but the page does not quote it yet. For Àngela, if section 1 wants it: divided by BLS jobs,
San Jose files 42.9 per 1,000 jobs against 4.5 nationally, and New York, Atlanta, Chicago, Boston and
Washington leave the top 10 (5 of the top 10 by count stay).

Traps found so far:

- **The FY2026 worksites file misses 22% of placed filings** (15,718 of January to June's placed filings
  have no row there; FY2022 to FY2025 miss none). `week04_staffing.placements()` falls back to the client
  on the filing's main row for those.
- **October 2025 is nearly empty:** 1,306 certified filings against 35,258 in October 2024, during the
  federal shutdown, and November carries a backlog. Compare FY2026 with earlier years on January to June.
- **PERM does not join cleanly to H-1B employers:** only 65% of FY2025 certified PERM filings reach an
  H-1B employer key, and Infosys shows none although the raw file has 53. Amazon and Google really do
  file almost no PERM in FY2025 (thousands in FY2023). The post leaves PERM out.
- **The law-firm projection holds about 138 links between two spellings of one firm** (Ogletree Deakins,
  a "Lowey" Fragomen). `week04_lawfirms.json` lists the top 20 as candidates for the name tables.
- **A few filings a year carry a SOC code whose major group does not exist** (12, 14, 20, 24 or 40:
  2 filings in FY2022, 5 in FY2023, 9 in FY2024, 8 in FY2025, 5 in FY2026). Each is a typo in the first
  two digits, and its title names a real occupation: 12-1252 "Software Developers", 40-9031 "Sales
  Engineers", 20-1021 "Computer Science Teachers, Postsecondary". The last four digits alone do not fix
  them (12-5021 "Data Scientists" is 15-2051). `week04_jobs.recode_soc` gives each the code most filings
  with the same title carry, and drops one no title resolves (none so far). Before the fix, section 2
  counted each as its own occupation: FY2025 had 501 occupations instead of 494.

- 19.5% of certified H-1B filings in FY2025 name a client (104,732 of 537,796), counting only
  "Certified", not "Certified - Withdrawn" (30,111 more that year).
- In a first look at July to September 2025 only, 8.6% of client names were placeholders such as
  "Home Address", "Beneficiary's Residence", "Remote" or "TBD Open".
- Corporate families survive simple name cleaning ("Bank of America" and "Bank of America N A").
- In that same quarter the staffing network was a forest of stars (median degree 1), and one Louvain run
  gave 46 communities at modularity 0.735, which a shuffled network may match. Section 3 must show the
  comparison, on the full year.
- Clients carry no industry code; in that quarter only 17.2% matched a filing employer's NAICS by name.
