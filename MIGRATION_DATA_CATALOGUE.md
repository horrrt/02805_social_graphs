# Global migration data: what exists, what is in it, what it will not tell you

82 sources across 17 families, written for the 02805 project. Each entry says what one row is, because that decides whether the source is a network or a table of country attributes. The limitations are the point: most of these datasets are fine and most published uses of them are not.

`checked` marks the few sources this repo actually pulled and counted. Everything else is written from prior knowledge and should be confirmed against the publisher before a number from it goes in a post.

Machine-readable version: [`data/migration_sources.tsv`](data/migration_sources.tsv). Source of truth: [`scripts/migration/sources.py`](scripts/migration/sources.py). Regenerate with `python scripts/migration/render_catalogue.py`.

## Contents

- [Bilateral stocks and flows](#bilateral-stocks-and-flows) (9) — Country-to-country matrices. These are the ones that are already networks.
- [Forced displacement](#forced-displacement) (3) — Refugees, asylum seekers, internally displaced and stateless people.
- [Asylum and border administration](#asylum-and-border-administration) (3) — What states record at the counter: applications, decisions, crossings, removals.
- [Policy, law and rights](#policy-law-and-rights) (5) — Country-level indices. Node attributes, and the usual dependent variables.
- [Mobility rights and visa networks](#mobility-rights-and-visa-networks) (3) — Who may enter whose territory. Dense directed networks, independent of who moves.
- [Explaining the edges](#explaining-the-edges) (5) — Distance, language, colonial history, treaties and free movement. The covariates that turn a migration network into a model, and the only honest way to answer 'compared to what' on a clique.
- [Other global networks](#other-global-networks) (7) — Trade, flights, diplomacy, shipping, attention. The comparison set for any claim that migration structure is special, and the transport layer the hub question actually needs.
- [Irregular migration, deaths and trafficking](#irregular-migration-deaths-and-trafficking) (4) — The part of the phenomenon that no register counts properly.
- [Remittances and labour](#remittances-and-labour) (4) — Money moving against the direction of people.
- [Survey and census microdata](#survey-and-census-microdata) (6) — Individual records. Where mechanism lives, at the cost of harmonisation work.
- [Digital trace and estimated data](#digital-trace-and-estimated-data) (4) — Platform and model output. High frequency, uncertain denominator.
- [High-frequency and event data](#high-frequency-and-event-data) (8) — Daily to monthly series. The only family that can see COVID, a chokepoint closure or a travel ban.
- [City and subnational](#city-and-subnational) (4) — Below the country. Thin, fragmented, and unavoidable if the question says 'cities'.
- [Drivers and denominators](#drivers-and-denominators) (3) — Population, regime, climate, internal migration. What makes people leave and what you divide by.
- [Actors, organisations and events](#actors-organisations-and-events) (9) — Who does migration policy and aid, and what happens. The layer this repo harvests.
- [Historical](#historical) (1) — Long series, for anything that needs more than thirty years.
- [Portals and aggregators](#portals-and-aggregators) (4) — Where to look when nothing above fits.

## The four questions, and what each one needs

The measure does not pick the dataset. The question does, and for all four of these the obvious dataset gives a confident wrong answer. Read the trap before the list.

#### Closeness centrality: How easy is it to get to a country if you want to migrate there?

**What the edges have to be.** Edge weight has to be the cost or difficulty of moving A -> B, not the number of people who already did. Closeness then reads as 'how near is this country to everyone who might want to come'.

**The trap.** Closeness on the migrant stock network answers a different question: how connected a country already is to the world's migrant population. That is an outcome of past ease, not current ease, and it is circular. The United States would score as the easiest country on earth to migrate to.

| Role | Source | What it adds here |
| --- | --- | --- |
| Primary | [DEMIG VISA](#demig-visa) | Directed binary network, near-complete: an arc when a passport holder of A needs a visa for B. Forty years of it, which makes it the only long longitudinal mobility-rights network. |
| Primary | [Henley Passport Index and Global Passport Power Index](#henley-passport-index-and-global-passport-power-index) | Directed network of visa-free access. The contemporary successor to DEMIG VISA, and one of the cleanest inequality measures in the field. |
| Primary | [Schengen visa statistics by consulate and nationality](#schengen-visa-statistics-by-consulate-and-nationality) | Weighted directed: applications and refusals from every nationality to every Schengen state. The refusal rate is the honest answer to 'how easy is it to get there', far better than the binary visa requirement. |
| Primary | [Lowy Institute Global Diplomacy Index](#lowy-institute-global-diplomacy-index) | Directed network of embassies and consulates, at city level. Where a country has a consulate is where its nationals can get a visa, so this is a real component of 'how easy is it to get there'. |
| Primary | [CEPII Gravity and GeoDist databases](#cepii-gravity-and-geodist-databases) | A complete weighted pair matrix of everything except migration. This is the null model for a migration network: distance, adjacency, shared language, shared coloniser, shared currency. |
| Supporting | [MIPEX, Migrant Integration Policy Index](#mipex-migrant-integration-policy-index) | Node attributes. The standard policy covariate. |
| Supporting | [IMPIC, Immigration Policies in Comparison](#impic-immigration-policies-in-comparison) | Node attributes |
| Supporting | [GLOBALCIT citizenship law datasets](#globalcit-citizenship-law-datasets) | Node attributes, plus one genuine network: dual-citizenship toleration and bilateral citizenship agreements. |
| Supporting | [OpenFlights and OurAirports route data](#openflights-and-ourairports-route-data) | Directed city-pair and airport-pair network. The transport layer the betweenness question needs, and the only free one at airport level. |
| Supporting | [OpenSky Network flight data](#opensky-network-flight-data) | Directed airport-pair network with actual flight counts per day. This is the dataset that shows COVID collapsing and recovering, edge by edge, at daily resolution. |
| Supporting | [Global friction surface and travel time to cities](#global-friction-surface-and-travel-time-to-cities) | Not a network, but it builds one: least-cost paths across it give real land travel times between any two places, which is what 'how easy is it to get there' means on foot and by road. |
| Supporting | [Mixed Migration Centre 4Mi](#mixed-migration-centre-4mi) | Multi-step journeys: departure country, every transit country, intended destination. Almost nothing else records the middle of a journey, and betweenness without it is guesswork. |
| Supporting | [UN DESA International Migrant Stock](#un-desa-international-migrant-stock) | Weighted directed: origin -> destination, weight = migrant stock. The canonical global migration network. |
| Supporting | [Abel and Cohen estimated bilateral migration flows](#abel-and-cohen-estimated-bilateral-migration-flows) | Weighted directed flow network, complete and symmetric in coverage. This is usually the better network than the raw DESA stocks. |

**What is missing.** There is no global dataset of visa refusal rates. Schengen publishes them by consulate and nationality and almost nobody else does, so a worldwide difficulty-weighted network has to use the binary visa requirement outside Europe and say so. Work and study permit rules are national and largely unpublished in structured form.

#### Betweenness centrality: Which countries or cities are migration and transportation hubs or bridges?

**What the edges have to be.** You need journeys, not residence. An edge should be a leg of a trip: A -> T -> B, so that T can sit on a path. Transport networks give the legs; route surveys give the itineraries.

**The trap.** A migrant stock matrix records where people live, not how they got there. Somebody who went Syria -> Turkey -> Germany appears as a Syria-born resident of Germany, and Turkey is nowhere on that edge. Betweenness on the stock matrix is close to meaningless: the matrix is so dense that shortest paths are almost all length one, and the betweenness you compute is an artefact of which cells DESA left blank.

| Role | Source | What it adds here |
| --- | --- | --- |
| Primary | [Mixed Migration Centre 4Mi](#mixed-migration-centre-4mi) | Multi-step journeys: departure country, every transit country, intended destination. Almost nothing else records the middle of a journey, and betweenness without it is guesswork. |
| Primary | [IOM Displacement Tracking Matrix](#iom-displacement-tracking-matrix) | Flow monitoring records origin and intended destination at individual-journey level, which yields a real movement network inside crisis corridors. |
| Primary | [OpenFlights and OurAirports route data](#openflights-and-ourairports-route-data) | Directed city-pair and airport-pair network. The transport layer the betweenness question needs, and the only free one at airport level. |
| Primary | [OpenSky Network flight data](#opensky-network-flight-data) | Directed airport-pair network with actual flight counts per day. This is the dataset that shows COVID collapsing and recovering, edge by edge, at daily resolution. |
| Primary | [GaWC world city network](#gawc-world-city-network) | A weighted inter-city network built from where firms put offices. The reference point for any claim that a city is a hub, and it is already a network, which almost no city data is. |
| Supporting | [UNHCR Operational Data Portal](#unhcr-operational-data-portal) | Origin -> neighbouring country arrivals at daily or weekly resolution. The only place a displacement shock is visible while it happens. |
| Supporting | [Eurostat asylum applications and decisions](#eurostat-asylum-applications-and-decisions) | Weighted directed origin -> destination at monthly resolution. The highest-frequency bilateral migration network available anywhere. |
| Supporting | [Frontex detections of illegal border crossings](#frontex-detections-of-illegal-border-crossings) | Route-level, not country pairs. Can be coerced into origin -> route -> entry-country edges but the route is the honest unit. |
| Supporting | [City-level foreign-born population](#city-level-foreign-born-population) | Node attributes on cities. There is no global city-to-city migration matrix, and assembling one from these is the single biggest gap for the hub question. |
| Supporting | [IPUMS International](#ipums-international) | Not a network in itself, but birthplace x residence at individual level rebuilds the bilateral stock matrix with any covariate you want on the edge. |
| Supporting | [Global Detention Project database](#global-detention-project-database) | Not a network. Facility-level attributes with coordinates, plus country legal frameworks. |
| Supporting | [IMF PortWatch](#imf-portwatch) | Port-to-port trade flow estimates, and a direct daily series for the Strait of Hormuz, Bab el-Mandeb, Suez, Panama and the Bosphorus. This is the dataset for a chokepoint event study. |
| Supporting | [UN Comtrade and CEPII BACI bilateral trade](#un-comtrade-and-cepii-baci-bilateral-trade) | Weighted directed trade network, complete and annual. The standard comparison: if migration centrality just reproduces trade centrality, there is nothing migration-specific to report. |
| Supporting | [Global friction surface and travel time to cities](#global-friction-surface-and-travel-time-to-cities) | Not a network, but it builds one: least-cost paths across it give real land travel times between any two places, which is what 'how easy is it to get there' means on foot and by road. |

**What is missing.** There is no global city-to-city migration matrix. IPUMS International can build one for the countries whose censuses record city of residence and country of birth, and that is the only route to it. For transit specifically, 4Mi and DTM flow monitoring are the only sources that record the middle of a journey, and both are purposive samples on selected routes.

#### Cliques and communities: Which countries or regions have migration running between all members, above some threshold?

**What the edges have to be.** Thresholded mutual migration: keep the pair if the stock in both directions clears a floor, then look for complete subgraphs. The threshold choice is the analysis, so report several.

**The trap.** You will find the EU, the Nordic countries, the Gulf, ECOWAS, the anglophone settler states and the former Soviet republics. Every one of those is a legal free movement zone, a colonial residue or a language bloc, so the clique itself is not a finding. The finding is whichever clique survives after conditioning on free movement, shared language, shared coloniser and distance.

| Role | Source | What it adds here |
| --- | --- | --- |
| Primary | [UN DESA International Migrant Stock](#un-desa-international-migrant-stock) | Weighted directed: origin -> destination, weight = migrant stock. The canonical global migration network. |
| Primary | [Abel and Cohen estimated bilateral migration flows](#abel-and-cohen-estimated-bilateral-migration-flows) | Weighted directed flow network, complete and symmetric in coverage. This is usually the better network than the raw DESA stocks. |
| Primary | [Free movement protocols and regional mobility agreements](#free-movement-protocols-and-regional-mobility-agreements) | Country blocs with legal free movement: EU/EEA plus Switzerland, the Nordic Passport Union, ECOWAS, EAC, CARICOM, MERCOSUR residence, GCC, the Trans-Tasman arrangement, the Common Travel Area. These are the cliques you would expect to find, so finding them is not a result. |
| Primary | [CEPII Gravity and GeoDist databases](#cepii-gravity-and-geodist-databases) | A complete weighted pair matrix of everything except migration. This is the null model for a migration network: distance, adjacency, shared language, shared coloniser, shared currency. |
| Primary | [CEPII linguistic proximity (Melitz and Toubal)](#cepii-linguistic-proximity-melitz-and-toubal) | Weighted undirected language-overlap network. Explains a large share of migration ties that distance cannot. |
| Supporting | [KNOMAD / World Bank Bilateral Migration Matrix](#knomad--world-bank-bilateral-migration-matrix) | Weighted directed, complete. Easier to load than DESA because it is already a square matrix with no aggregate rows. |
| Supporting | [Correlates of War Intergovernmental Organizations dataset](#correlates-of-war-intergovernmental-organizations-dataset) | Bipartite country-organisation membership, which projects to a weighted country co-membership network. The obvious explanation to test against any migration clique you find. |
| Supporting | [UN Treaty Collection ratification status](#un-treaty-collection-ratification-status) | Bipartite country-treaty, projecting to a legal-alignment network. |
| Supporting | [UN General Assembly voting data](#un-general-assembly-voting-data) | Country similarity network from vote agreement, plus ideal-point estimates. Tells you whether a migration clique is a political bloc. |
| Supporting | [UN Comtrade and CEPII BACI bilateral trade](#un-comtrade-and-cepii-baci-bilateral-trade) | Weighted directed trade network, complete and annual. The standard comparison: if migration centrality just reproduces trade centrality, there is nothing migration-specific to report. |
| Supporting | [OECD International Migration Database](#oecd-international-migration-database) | Weighted directed, but only into OECD destinations. A star with 38 hubs. |
| Supporting | [Eurostat migration and citizenship statistics](#eurostat-migration-and-citizenship-statistics) | Weighted directed into European destinations. The best-harmonised regional migration network that exists. |
| Supporting | [KNOMAD bilateral remittance matrix](#knomad-bilateral-remittance-matrix) | Weighted directed money network, the mirror image of the migration network. Comparing the two is a ready-made research question. |

**What is missing.** The DESA matrix is ragged, and a clique needs every pair present. A country that reports its origins coarsely cannot be in a clique no matter how it behaves, so the ragged matrix will hand you a tidy European answer for a reporting reason. Use a completed matrix (Abel and Cohen, or KNOMAD) for the clique search and DESA only to check it. There is also no single maintained register of free movement agreements, so the control variable has to be assembled by hand.

#### Shocks and event studies: What did COVID, a Strait of Hormuz closure, or a change of US administration do to the network?

**What the edges have to be.** Whatever the edge is, it has to be observed monthly or faster. The unit of analysis is the pair-month, and the design is a before-and-after on the treated pairs against untreated ones.

**The trap.** Every core migration dataset is annual at best and five-yearly at worst. DESA cannot see COVID: its 2020 and 2024 points straddle the whole thing. Any claim about a shock has to come from a different family of data, and mixing a high-frequency shock measure with an annual outcome will produce a null result that means nothing.

| Role | Source | What it adds here |
| --- | --- | --- |
| Primary | [Oxford COVID-19 Government Response Tracker](#oxford-covid-19-government-response-tracker) | Node attributes at daily resolution. C8 international travel controls is the variable that makes COVID border closure an event study rather than an anecdote. |
| Primary | [IOM COVID-19 travel and mobility restrictions](#iom-covid-19-travel-and-mobility-restrictions) | Directed, and this is the point: IOM recorded which nationalities each country barred, so the COVID border regime is a bilateral network, not a single index. |
| Primary | [OpenSky Network flight data](#opensky-network-flight-data) | Directed airport-pair network with actual flight counts per day. This is the dataset that shows COVID collapsing and recovering, edge by edge, at daily resolution. |
| Primary | [US monthly immigrant and nonimmigrant visa issuance statistics](#us-monthly-immigrant-and-nonimmigrant-visa-issuance-statistics) | Origin nationality -> US, monthly, split by visa class and by the consulate that issued it. The sharpest instrument for measuring what a travel ban or a policy change did, and when. |
| Primary | [Eurostat asylum applications and decisions](#eurostat-asylum-applications-and-decisions) | Weighted directed origin -> destination at monthly resolution. The highest-frequency bilateral migration network available anywhere. |
| Primary | [IMF PortWatch](#imf-portwatch) | Port-to-port trade flow estimates, and a direct daily series for the Strait of Hormuz, Bab el-Mandeb, Suez, Panama and the Bosphorus. This is the dataset for a chokepoint event study. |
| Supporting | [US Refugee Processing Center arrivals (WRAPS)](#us-refugee-processing-center-arrivals-wraps) | Origin -> US state resettlement flows, monthly. Shows the effect of an admissions ceiling change within weeks. |
| Supporting | [US DHS Office of Immigration Statistics yearbook](#us-dhs-office-of-immigration-statistics-yearbook) | Origin -> US edges only. A single-destination star. |
| Supporting | [UNHCR Operational Data Portal](#unhcr-operational-data-portal) | Origin -> neighbouring country arrivals at daily or weekly resolution. The only place a displacement shock is visible while it happens. |
| Supporting | [Google Trends migration search interest](#google-trends-migration-search-interest) | Not a network. A leading indicator: searches for emigration terms move weeks before the movement does, which is how the nowcasting literature detects a shock early. |
| Supporting | [ACLED and UCDP conflict event data](#acled-and-ucdp-conflict-event-data) | Actor-to-actor conflict network, and geolocated events that join to displacement data as the driver side of the story. |
| Supporting | [IDMC Global Internal Displacement Database](#idmc-global-internal-displacement-database) | Node attributes, not a network. Internal by definition, so there is no origin-destination edge to build. Sub-national event locations are available and can be joined to geography. |
| Supporting | [Frontex detections of illegal border crossings](#frontex-detections-of-illegal-border-crossings) | Route-level, not country pairs. Can be coerced into origin -> route -> entry-country edges but the route is the honest unit. |
| Supporting | [UN Comtrade and CEPII BACI bilateral trade](#un-comtrade-and-cepii-baci-bilateral-trade) | Weighted directed trade network, complete and annual. The standard comparison: if migration centrality just reproduces trade centrality, there is nothing migration-specific to report. |
| Supporting | [IOM Missing Migrants Project](#iom-missing-migrants-project) | Not a network. Point events with coordinates and a named route; can be aggregated to origin-route or origin-region edges. |
| Supporting | [Migration Policy Institute Data Hub](#migration-policy-institute-data-hub) | Not a network. Derived tables, pre-cleaned, good for sanity checks. |

**What is missing.** No maintained global migration policy event database exists after 2013, when DEMIG POLICY stopped. Dating a policy change worldwide means hand-coding from MPI, national gazettes and news. For the Strait of Hormuz the migration effect is indirect: PortWatch shows the trade shock daily, ACLED shows the conflict, and the migration response appears months later in Gulf labour-permit statistics that mostly are not published.

## The short answer

If you want one weighted directed country network, take **UN DESA International Migrant Stock** and read its reporting-granularity limitation first. If you want flows rather than stocks, take **Abel and Cohen**. If you want high frequency, take **Eurostat monthly asylum applications** and accept that it is Europe. If you want a network that is not about people moving, take **visa requirements** or the **organisation link network** in this repo.

## Already harvested into this repo

Row counts are from the files on disk, not from the publisher's documentation. Rebuild any of them with `python scripts/migration/run_all.py`.

| File | Rows | Columns | What it is |
| --- | ---: | --- | --- |
| [`data/migration_country_indicators.tsv`](data/migration_country_indicators.tsv) | 249 | `iso3`, `name`, `population_2024`, `net_migration_2024`, `migrant_stock_2024`, `migrant_stock_pct_2024`, `remittances_received_usd_2024`, `remittances_sent_usd_2024`, `remittances_received_pct_gdp_2024`, `gdp_per_capita_usd_2024`, `urban_population_pct_2024`, `unemployment_pct_2024` | World Bank country indicators. See `wb-wdi` below. |
| [`data/migration_displacement.tsv`](data/migration_displacement.tsv) | 6,198 | `origin`, `asylum`, `origin_name`, `asylum_name`, `refugees`, `asylum_seekers`, `returned_refugees`, `idps`, `returned_idps`, `stateless`, `other_of_concern`, `host_community` | UNHCR origin/asylum populations for one year. See `unhcr-rdf` below. |
| [`data/migration_flows.tsv`](data/migration_flows.tsv) | 9,095 | `origin`, `destination`, `origin_name`, `destination_name`, `stock_1990`, `stock_1995`, `stock_2000`, `stock_2005`, `stock_2010`, `stock_2015`, `stock_2020`, `stock_2024`, `female_2024` | UN DESA bilateral migrant stock, 1990 to 2024. See `undesa-ims` below. |
| [`data/migration_sources.tsv`](data/migration_sources.tsv) | 82 | `id`, `name`, `family`, `publisher`, `unit`, `coverage`, `years`, `cadence`, `access`, `fmt`, `api`, `licence`, `network`, `metrics`, `limits`, `url`, `checked` | This catalogue, as a table. |

## Bilateral stocks and flows

Country-to-country matrices. These are the ones that are already networks.

### UN DESA International Migrant Stock

UN Department of Economic and Social Affairs, Population Division. <https://www.un.org/development/desa/pd/content/international-migrant-stock>

| | |
| --- | --- |
| One row is | origin country x destination country x year x sex |
| Coverage | Every country and area with data; 232 destinations, 238 origins |
| Years | 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024 (Rev. 2024) |
| Updated | Roughly every five years; Rev. 2024 published late 2024 |
| Access | Direct XLSX download, no registration |
| Format | XLSX, one sheet per table, ~6 MB |
| API | No |
| Licence | UN terms of use; free with attribution |
| Network shape | Weighted directed: origin -> destination, weight = migrant stock. The canonical global migration network. |

**Metrics**

- migrant stock by origin and destination, both sexes and split
- stock as share of destination population
- median age of the migrant population
- refugees as a share of the international migrant stock

**Limitations**

- Stock, not flow. A stock difference is not a flow: it nets out return migration, onward migration and deaths.
- Definition is country of birth for most countries and country of citizenship for the rest. The two are not the same population.
- Reporting granularity varies by destination, and it varies in a way that correlates with wealth. In Rev. 2024 Table 1 the United States reports 58 named origin countries while Denmark reports 202, because the US source is a survey with an 'other' category and Denmark's is a population register. Any centrality computed on the raw matrix will understate large survey-based destinations.
- Interpolated and modelled where censuses are missing; the workbook does not flag which cells are estimates.
- Country set changes over time (South Sudan, Serbia and Montenegro).

*Checked: fetched 2026-09-16: Table 1 has 28,030 data rows, of which 9,098 are country-to-country pairs after dropping regional and income-group aggregates; 6,787 of those have a non-zero 2024 stock.*

### UN DESA International Migration Flows

UN DESA Population Division. <https://www.un.org/development/desa/pd/content/international-migration-flows>

| | |
| --- | --- |
| One row is | origin country x destination country x year, inflows and outflows |
| Coverage | 45 countries that report flow statistics |
| Years | 1980 to 2020 depending on reporter |
| Updated | Irregular; 2015 revision is the widely used one |
| Access | XLSX download |
| Format | XLSX |
| API | No |
| Licence | UN terms of use |
| Network shape | Weighted directed flows, but only between the reporting subset |

**Metrics**

- inflows by country of citizenship or birth
- outflows
- net flow
- reporting basis per country

**Limitations**

- Only 45 reporters, heavily European. Africa and most of Asia are absent, so a network built from it is a network of rich-country statistical offices.
- Inflow reported by A from B rarely matches outflow reported by B to A. Mirror statistics disagree by factors, not percentages.
- Mixed definitions: citizenship, birth, and duration-of-stay thresholds differ across reporters.

### Abel and Cohen estimated bilateral migration flows

Guy Abel and Joel Cohen (Scientific Data, 2019; updates to 2022). <https://www.nature.com/articles/sdata201882>

| | |
| --- | --- |
| One row is | origin x destination x five-year period |
| Coverage | ~200 countries, full matrix |
| Years | 1990-1995 through 2015-2020 |
| Updated | Updated when a new DESA stock revision lands |
| Access | Open data with the paper; R package migest |
| Format | CSV; R package |
| API | No |
| Licence | CC BY |
| Network shape | Weighted directed flow network, complete and symmetric in coverage. This is usually the better network than the raw DESA stocks. |

**Metrics**

- estimated flow under six different demographic accounting methods
- net migration implied by each method

**Limitations**

- Estimates, not observations. The six methods disagree with each other by a lot, and the choice of method changes which countries look central.
- Inherits every problem in the DESA stock matrix it is derived from.
- Five-year periods only. No annual series, no seasonality.
- Cannot see circular or repeat migration by construction.

### World Bank Global Bilateral Migration Database

World Bank (Ozden, Parsons, Schiff, Walmsley). <https://datacatalog.worldbank.org/search/dataset/0044054>

| | |
| --- | --- |
| One row is | origin x destination x decade x gender |
| Coverage | 226 countries, complete matrix |
| Years | 1960, 1970, 1980, 1990, 2000 |
| Updated | Static; superseded for recent years by the KNOMAD matrix |
| Access | World Bank data catalog download |
| Format | CSV / XLSX |
| API | No |
| Licence | CC BY 4.0 |
| Network shape | Weighted directed, complete. The only full matrix reaching back to 1960. |

**Metrics**

- bilateral migrant stock by decade
- gender split

**Limitations**

- Ends at 2000. Useless for anything contemporary.
- Built by filling census gaps with a gravity model, so a large share of cells are modelled rather than counted.
- Historical country boundaries mapped onto modern ones, which invents continuity across the Soviet and Yugoslav dissolutions.

### KNOMAD / World Bank Bilateral Migration Matrix

KNOMAD, World Bank. <https://www.knomad.org/data/migration/emigration>

| | |
| --- | --- |
| One row is | origin x destination stock, single year |
| Coverage | 214 countries, complete matrix |
| Years | 2010, 2013, 2017, 2018, 2021, 2024 editions |
| Updated | Every few years alongside the Migration and Development Brief |
| Access | XLSX from knomad.org; the direct file URLs move between editions |
| Format | XLSX, square matrix layout |
| API | No |
| Licence | CC BY |
| Network shape | Weighted directed, complete. Easier to load than DESA because it is already a square matrix with no aggregate rows. |

**Metrics**

- bilateral migrant stock
- paired with the bilateral remittance matrix

**Limitations**

- Derived from DESA plus modelling to fill the cells DESA leaves blank. The completeness is partly manufactured.
- Single year per edition, no time series inside one file.
- Publication URLs are unstable; link rot between editions is normal.

*Checked: probed 2026-09-16: guessed direct file URLs return 302 redirects; the landing page is the reliable entry point.*

### OECD International Migration Database

OECD. <https://www.oecd.org/en/data/datasets/oecd-international-migration-database.html>

| | |
| --- | --- |
| One row is | destination x origin x year, inflows, outflows, stocks, acquisitions |
| Coverage | 38 OECD members plus a few partners |
| Years | 1980 onward, varies by series |
| Updated | Annual, with the International Migration Outlook |
| Access | OECD Data Explorer, bulk CSV, SDMX |
| Format | CSV, SDMX-JSON |
| API | Yes, SDMX |
| Licence | OECD terms; free for non-commercial use |
| Network shape | Weighted directed, but only into OECD destinations. A star with 38 hubs. |

**Metrics**

- inflows of foreign population by nationality
- stock of foreign-born and foreign population
- acquisitions of citizenship
- asylum applications
- inflows of foreign workers by permit type

**Limitations**

- Destination side is OECD only. Every south-south corridor is invisible, and those are roughly half of world migration.
- Permit-based counts measure administrative events, not people. One person can generate several permits in a year.
- Series breaks when a country changes its register rules, and the breaks are documented in footnotes rather than in the data.

### OECD Database on Immigrants in OECD Countries (DIOC)

OECD. <https://www.oecd.org/en/data/datasets/database-on-immigrants-in-oecd-countries.html>

| | |
| --- | --- |
| One row is | destination x origin x sex x age x education x labour status |
| Coverage | OECD destinations, ~200 origins |
| Years | 2000/01, 2005/06, 2010/11, 2015/16, 2020/21 rounds |
| Updated | Every five years, census-round based |
| Access | XLSX / CSV download |
| Format | CSV, XLSX |
| API | No |
| Licence | OECD terms |
| Network shape | Weighted directed, and the only one that splits the edge by skill. Lets you build a separate high-skilled migration network. |

**Metrics**

- migrant stock by educational attainment
- emigration rate of the tertiary educated (brain drain rate)
- labour force status
- occupation
- duration of stay
- field of study (DIOC-E extension)

**Limitations**

- Census rounds, so five-year granularity and a two to four year lag before release.
- Education coded from national categories into ISCED, which flattens real differences in what a qualification means.
- Small origin-destination-education cells are suppressed or unreliable; the matrix is sparse where it matters most for small countries.

### Eurostat migration and citizenship statistics

Eurostat. <https://ec.europa.eu/eurostat/web/migration-asylum/migration/database>

| | |
| --- | --- |
| One row is | reporting country x country of citizenship or previous residence x year |
| Coverage | EU27, EFTA, candidate countries |
| Years | 2008 onward under Regulation 862/2007; some series to 1998 |
| Updated | Annual, with monthly asylum series |
| Access | Eurostat database, bulk download, REST API |
| Format | TSV, SDMX, JSON |
| API | Yes, free and documented |
| Licence | Reuse permitted with attribution |
| Network shape | Weighted directed into European destinations. The best-harmonised regional migration network that exists. |

**Metrics**

- immigration and emigration by citizenship, age and sex (migr_imm, migr_emi)
- usually resident population by citizenship and birth country
- acquisitions of citizenship
- residence permits by reason
- asylum applications and decisions, monthly
- returns of third-country nationals

**Limitations**

- Europe only.
- Emigration is undercounted everywhere. People leave without telling the register, so a corridor A->B measured by A's emigration and by B's immigration will not agree, and B is usually closer to right.
- The twelve-month duration rule is applied differently across members despite the regulation.
- Confidentiality flags blank out small cells, which removes exactly the small corridors that would make a network interesting.

### IMEM and QuantMig estimated European flows

Raymer, Wisniowski et al.; QuantMig consortium (Horizon 2020). <https://www.quantmig.eu/data_and_estimates/>

| | |
| --- | --- |
| One row is | origin x destination x year, Bayesian posterior |
| Coverage | 31 European countries |
| Years | IMEM 2002-2008; QuantMig extends to 2019 |
| Updated | Project output, not a maintained series |
| Access | Project sites and supplementary data |
| Format | CSV, R objects |
| API | No |
| Licence | Varies by release, generally open |
| Network shape | Weighted directed with credible intervals on every edge. The only migration network that ships uncertainty per edge. |

**Metrics**

- posterior mean flow
- 95% credible interval
- undercount and definition adjustment factors per reporter

**Limitations**

- Europe only, and a fixed country set.
- Model output. The intervals are wide enough that many rank orderings of countries are not identified.
- Not updated on a schedule; treat as a research dataset, not a series.

## Forced displacement

Refugees, asylum seekers, internally displaced and stateless people.

### UNHCR Refugee Data Finder

UNHCR. <https://www.unhcr.org/refugee-statistics/>

| | |
| --- | --- |
| One row is | country of origin x country of asylum x year x population type |
| Coverage | Global, every country of asylum UNHCR reports on |
| Years | 1951 onward for refugees; most series usable from 1990 |
| Updated | Twice yearly, mid-year and year-end |
| Access | Web app, CSV export, and a public JSON API with no key |
| Format | CSV, JSON |
| API | Yes: api.unhcr.org/population/v1/ |
| Licence | Free with attribution |
| Network shape | Weighted directed: origin -> asylum, weight = refugees or asylum seekers. Sparser and far more skewed than the DESA stock network. |

**Metrics**

- refugees under UNHCR mandate
- asylum seekers (pending cases)
- returned refugees
- internally displaced people
- returned IDPs
- stateless people
- others in need of international protection
- host community
- resettlement arrivals and departures
- RSD decisions and recognition rates
- solutions: naturalisation, return, resettlement

**Limitations**

- UNRWA-registered Palestine refugees sit in a separate series and are excluded from most UNHCR totals. Forgetting this understates the Middle East by several million.
- Country of asylum is where people are counted, not where they want to be. Transit countries look like destinations.
- IDP figures come from national and cluster sources of very mixed quality; a jump in an IDP series is often a change in who was counted.
- Some asylum countries report a single 'various' origin, which collapses real edges into one.
- Definitions changed in 2018 when the 'others of concern' category was restructured; long series cross that break.

*Checked: fetched 2026-09-16: the 2024 year slice gives 6,198 origin/asylum rows with a non-zero population, summing to 30.96 million refugees on cross-border rows.*

### IDMC Global Internal Displacement Database

Internal Displacement Monitoring Centre. <https://www.internal-displacement.org/database/displacement-data/>

| | |
| --- | --- |
| One row is | country x year x cause (conflict, disaster), stocks and new displacements |
| Coverage | Global, ~150 countries with events |
| Years | 2008 onward for disasters; 2009 onward for conflict stocks |
| Updated | Annual Global Report on Internal Displacement, plus an event feed |
| Access | Open download and a REST API |
| Format | CSV, XLSX, JSON |
| API | Yes |
| Licence | CC BY |
| Network shape | Node attributes, not a network. Internal by definition, so there is no origin-destination edge to build. Sub-national event locations are available and can be joined to geography. |

**Metrics**

- internal displacements (new movements) by cause
- total number of IDPs at year end
- disaster hazard type
- event-level records with dates and locations

**Limitations**

- New displacements count movements, not people. One person displaced three times contributes three.
- Disaster and conflict displacement are estimated by different methods and should not be added without saying so.
- Coverage follows where monitoring exists. An absence of data is not an absence of displacement.

### UNRWA registered Palestine refugees

UNRWA. <https://www.unrwa.org/what-we-do/protection>

| | |
| --- | --- |
| One row is | field of operation x year, registered persons |
| Coverage | Five fields: Jordan, Lebanon, Syria, West Bank, Gaza |
| Years | 1950 onward |
| Updated | Annual |
| Access | Statistical bulletins and the UNRWA open data portal |
| Format | PDF, XLSX, some CSV |
| API | Limited |
| Licence | UN terms |
| Network shape | Node attributes only; five fields, no origin-destination structure |

**Metrics**

- registered refugees
- registered persons
- camp populations
- service uptake in health and education

**Limitations**

- Registration, not presence. Registered persons include descendants and people who have since moved or naturalised elsewhere.
- Not comparable with UNHCR figures and not additive with them.
- Five fields only; Palestinians outside them are counted by UNHCR, sometimes, under a different mandate.

## Asylum and border administration

What states record at the counter: applications, decisions, crossings, removals.

### Eurostat asylum applications and decisions

Eurostat. <https://ec.europa.eu/eurostat/web/migration-asylum/asylum/database>

| | |
| --- | --- |
| One row is | reporting country x citizenship x month x sex x age |
| Coverage | EU27, EFTA |
| Years | 2008 onward monthly; annual back to 1998 in older series |
| Updated | Monthly, with about a two-month lag |
| Access | Eurostat database and API |
| Format | TSV, SDMX, JSON |
| API | Yes |
| Licence | Reuse with attribution |
| Network shape | Weighted directed origin -> destination at monthly resolution. The highest-frequency bilateral migration network available anywhere. |

**Metrics**

- first-time and repeat asylum applications (migr_asyappctzm)
- first-instance and final decisions by outcome
- recognition rate by origin and destination
- unaccompanied minors
- Dublin transfers, requests and outgoing
- withdrawn applications

**Limitations**

- Applications are not arrivals. Asylum shopping, secondary movement and Dublin transfers put the same person in several national counts.
- Recognition rates computed as decisions over applications in the same period are wrong; decisions lag applications by months to years.
- Small cells are suppressed.
- Europe only.

### Frontex detections of illegal border crossings

Frontex (European Border and Coast Guard Agency). <https://www.frontex.europa.eu/what-we-do/monitoring-and-risk-analysis/migratory-map/>

| | |
| --- | --- |
| One row is | migratory route x month x reported nationality |
| Coverage | EU external borders |
| Years | 2009 onward monthly |
| Updated | Monthly |
| Access | Frontex migratory map and public CSV releases |
| Format | CSV, XLSX |
| API | No stable public API |
| Licence | Reuse with attribution |
| Network shape | Route-level, not country pairs. Can be coerced into origin -> route -> entry-country edges but the route is the honest unit. |

**Metrics**

- detections by route
- claimed nationality
- share of minors
- sex breakdown
- facilitators detected

**Limitations**

- Detections count events, not people. One person crossing twice is two detections, and Frontex says so.
- Nationality is claimed, not verified, and claiming a high-recognition nationality is rational behaviour.
- Enforcement intensity drives the series as much as movement does. A rise can mean more patrols.
- Routes are an administrative construct that changes definition over time.

### US DHS Office of Immigration Statistics yearbook

US Department of Homeland Security. <https://www.dhs.gov/ohss/topics/immigration>

| | |
| --- | --- |
| One row is | fiscal year x country of birth or nationality x category |
| Coverage | United States |
| Years | 1892 onward for some series; detailed tables from 1996 |
| Updated | Annual, with monthly CBP releases |
| Access | Open download |
| Format | XLSX, CSV, PDF |
| API | No |
| Licence | US public domain |
| Network shape | Origin -> US edges only. A single-destination star. |

**Metrics**

- lawful permanent residents by country of birth and class of admission
- naturalisations
- nonimmigrant admissions by visa class
- refugee admissions and asylum grants
- removals, returns and expedited removals
- CBP encounters by sector, nationality and demographic

**Limitations**

- Fiscal years, not calendar years. Joining to anything else needs care.
- Encounters count events; Title 42 era repeat crossings inflated the series and the break is not marked in the raw tables.
- Class of admission reflects the legal route taken, which is shaped by queue availability rather than intent.

## Policy, law and rights

Country-level indices. Node attributes, and the usual dependent variables.

### MIPEX, Migrant Integration Policy Index

CIDOB and Migration Policy Group. <https://www.mipex.eu/>

| | |
| --- | --- |
| One row is | country x year x policy strand, score 0-100 |
| Coverage | 56 countries: EU, OECD and a few others |
| Years | 2007, 2010, 2014, 2019, 2020 rounds |
| Updated | Every few years; the 2020 round is the current one |
| Access | Open download and an interactive site |
| Format | XLSX, CSV |
| API | No |
| Licence | CC BY |
| Network shape | Node attributes. The standard policy covariate. |

**Metrics**

- overall MIPEX score
- eight strands: labour market mobility, family reunion, education, political participation, permanent residence, access to nationality, anti-discrimination, health
- sub-indicator scores

**Limitations**

- Measures law on the books, not implementation. A generous statute with a two-year appointment backlog scores well.
- Expert coding, so the scale is ordinal dressed up as cardinal. Differences of five points mean little.
- Rich-country bias in the country set.
- Rounds are years apart; it cannot support event-study designs.

### IMPIC, Immigration Policies in Comparison

WZB Berlin (Helbling, Bjerre, Romer, Zobel). <https://www.wzb.eu/en/research/migration-and-diversity/migration-and-diversity/projects/impic>

| | |
| --- | --- |
| One row is | country x year x policy field, restrictiveness score |
| Coverage | 33 OECD countries |
| Years | 1980-2010, with extensions |
| Updated | Static with occasional extension |
| Access | Open download after registration |
| Format | Stata, CSV |
| API | No |
| Licence | Academic use |
| Network shape | Node attributes |

**Metrics**

- restrictiveness of regulations and control mechanisms
- by field: labour, family, asylum, co-ethnic migration
- external vs internal control

**Limitations**

- Ends around 2010 in the core release; the last fifteen years of policy change are the interesting ones and they are not in it.
- OECD only.
- Aggregation weights across sub-indices are a choice, and results move with the choice.

### DEMIG POLICY, DEMIG C2C and DEMIG TOTAL

International Migration Institute, Oxford / Amsterdam. <https://www.migrationinstitute.org/data/demig-data>

| | |
| --- | --- |
| One row is | policy change event; and country-to-country flow series |
| Coverage | 45 countries for policy; 34 reporters for C2C flows |
| Years | 1945-2013 |
| Updated | Static |
| Access | Open download |
| Format | XLSX, CSV |
| API | No |
| Licence | Academic use with citation |
| Network shape | DEMIG C2C is a bilateral flow network 1946-2011. DEMIG POLICY is an event list, not a network. |

**Metrics**

- 6,500 policy changes coded by direction and magnitude
- policy area and target group
- C2C: annual bilateral inflows and outflows
- TOTAL: long-run national flow series

**Limitations**

- Frozen in 2013. Nobody maintains it.
- Policy 'magnitude' is a four-point expert judgement.
- C2C reporters are the usual rich-country set, with the usual emigration undercount.

### GLOBALCIT citizenship law datasets

European University Institute. <https://globalcit.eu/databases/>

| | |
| --- | --- |
| One row is | country x year x mode of acquisition or loss of citizenship |
| Coverage | Near-global, 190+ countries for the core modes |
| Years | Varies; CITLAW indicators from 1960s, current law fully coded |
| Updated | Continuous updating |
| Access | Open download and a browsable database |
| Format | CSV, XLSX |
| API | No |
| Licence | CC BY |
| Network shape | Node attributes, plus one genuine network: dual-citizenship toleration and bilateral citizenship agreements. |

**Metrics**

- modes of acquisition: birthright, descent, naturalisation, marriage, ancestry-based, investment
- modes of loss and deprivation
- residence duration required for naturalisation
- dual citizenship toleration
- electoral rights of non-resident citizens and non-citizen residents

**Limitations**

- Law as written. Administrative discretion is invisible.
- Coding a legal system into indicators loses conditionality; a rule with five exceptions codes the same as one without.
- Some historical series are thin outside Europe.

### IOM Migration Governance Indicators

IOM with the Economist Impact. <https://www.migrationdataportal.org/overviews/mgi>

| | |
| --- | --- |
| One row is | country or city x assessment round, 90+ binary indicators |
| Coverage | ~100 countries assessed so far, plus subnational units |
| Years | 2016 onward, rolling |
| Updated | Rolling; each country assessed once or twice |
| Access | Country profiles on the Migration Data Portal |
| Format | PDF profiles; some structured data |
| API | No |
| Licence | IOM terms |
| Network shape | Node attributes |

**Metrics**

- six dimensions of migration governance
- presence or absence of specific institutions and policies

**Limitations**

- Self-assessment with IOM facilitation, so it measures stated commitment.
- Not a scored index by design; IOM discourages ranking, which limits it as a regression covariate.
- Coverage is where governments agreed to be assessed.

## Mobility rights and visa networks

Who may enter whose territory. Dense directed networks, independent of who moves.

### DEMIG VISA

International Migration Institute. <https://www.migrationinstitute.org/data/demig-data/demig-visa-data>

| | |
| --- | --- |
| One row is | origin nationality x destination country x year, visa required or not |
| Coverage | 237 nationalities x 214 destinations |
| Years | 1973-2013 |
| Updated | Static |
| Access | Open download |
| Format | XLSX |
| API | No |
| Licence | Academic use |
| Network shape | Directed binary network, near-complete: an arc when a passport holder of A needs a visa for B. Forty years of it, which makes it the only long longitudinal mobility-rights network. |

**Metrics**

- visa requirement, binary, per year and per pair

**Limitations**

- Stops in 2013.
- Binary. Visa-on-arrival, eTA and e-visa regimes collapse into the same cell as a full embassy application.
- Says nothing about refusal rates, which is where the real restriction sits for many nationalities.

### Henley Passport Index and Global Passport Power Index

Henley and Partners (IATA data); Arton Capital. <https://www.henleyglobal.com/passport-index>

| | |
| --- | --- |
| One row is | passport x destination, access category |
| Coverage | 199 passports x 227 destinations |
| Years | 2006 onward, updated through the year |
| Updated | Quarterly to monthly |
| Access | Public web rankings; the underlying pairwise matrix is commercial |
| Format | Web, scraping needed for the matrix |
| API | Commercial |
| Licence | Proprietary; rankings are public, the matrix is not |
| Network shape | Directed network of visa-free access. The contemporary successor to DEMIG VISA, and one of the cleanest inequality measures in the field. |

**Metrics**

- visa-free destinations count
- visa-on-arrival
- eTA required
- visa required
- mobility score

**Limitations**

- Licensing. The headline ranking is free, the pair-level matrix is not, and scraping it is against the terms.
- Built from IATA timetable data, which encodes airline-facing rules and occasionally lags real policy.
- Tourist entry only. It says nothing about work or settlement rights, which is what migration actually needs.

### UN Tourism and regional visa openness indices

UN Tourism (UNWTO); African Union and AfDB for the Africa index. <https://www.unwto.org/tourism-visa-openness>

| | |
| --- | --- |
| One row is | destination x origin region, entry requirement |
| Coverage | Global for UNWTO; 54 countries for the Africa Visa Openness Index |
| Years | 2008 onward; Africa index annual since 2016 |
| Updated | Annual |
| Access | Report downloads, some structured annexes |
| Format | PDF, XLSX |
| API | No |
| Licence | Free with attribution |
| Network shape | Directed, but usually published at origin-region rather than origin-country resolution, which coarsens the network badly. |

**Metrics**

- share of world population requiring a visa
- visa-free, visa-on-arrival, e-visa shares
- Africa index: openness score, reciprocity

**Limitations**

- Tourism framing, so short-stay rules only.
- Aggregated to regions in most published tables.
- The pair-level source is the same commercial IATA feed.

## Explaining the edges

Distance, language, colonial history, treaties and free movement. The covariates that turn a migration network into a model, and the only honest way to answer 'compared to what' on a clique.

### CEPII Gravity and GeoDist databases

CEPII. <https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele.asp>

| | |
| --- | --- |
| One row is | country pair x year |
| Coverage | 252 countries, complete pair matrix |
| Years | 1948-2021 for Gravity; GeoDist is time-invariant |
| Updated | Roughly every two years |
| Access | Open download, no registration |
| Format | CSV, Stata, R, parquet |
| API | No |
| Licence | Free for research with citation |
| Network shape | A complete weighted pair matrix of everything except migration. This is the null model for a migration network: distance, adjacency, shared language, shared coloniser, shared currency. |

**Metrics**

- population-weighted and simple bilateral distance
- contiguity
- common official language, common spoken language
- colonial relationship ever, common coloniser, year of independence
- regional trade agreement in force
- common currency
- GDP, population and area for both ends

**Limitations**

- Distance is between population-weighted centroids of the largest cities. For a migration question it is the wrong distance: what matters is route feasibility, not great-circle kilometres.
- 'Common official language' misses lingua francas and misses the difference between an official language and one people speak.
- The colonial variables are binary and recent-biased; they cannot express the intensity or the length of the relationship.
- Ends in 2021 in the current release.

### CEPII linguistic proximity (Melitz and Toubal)

CEPII. <https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele.asp>

| | |
| --- | --- |
| One row is | country pair, language overlap indices |
| Coverage | 195 countries |
| Years | Time-invariant |
| Updated | Static |
| Access | Open download |
| Format | CSV, Stata |
| API | No |
| Licence | Free with citation |
| Network shape | Weighted undirected language-overlap network. Explains a large share of migration ties that distance cannot. |

**Metrics**

- common native language probability
- common spoken language probability
- linguistic proximity from language-tree distance
- common official language

**Limitations**

- Built from country-level language shares, so it assumes random matching between two populations.
- Static. It cannot capture English spreading as a second language.
- Language trees measure genealogy, not mutual intelligibility.

### Correlates of War Intergovernmental Organizations dataset

Correlates of War Project. <https://correlatesofwar.org/data-sets/igos/>

| | |
| --- | --- |
| One row is | country x organisation x year, membership |
| Coverage | Global, ~530 intergovernmental organisations |
| Years | 1815-2014 (v3) |
| Updated | Periodic version releases |
| Access | Open download |
| Format | CSV, Stata |
| API | No |
| Licence | Free with citation |
| Network shape | Bipartite country-organisation membership, which projects to a weighted country co-membership network. The obvious explanation to test against any migration clique you find. |

**Metrics**

- membership status: full, associate, observer
- organisation founding and dissolution years
- co-membership counts per pair

**Limitations**

- Ends in 2014.
- Membership is not integration. Sitting in the same body says nothing about whether the border is open.
- Organisation coverage is skewed toward formal treaty bodies.

### Free movement protocols and regional mobility agreements

IOM, ILO, African Union, WTO RTA database. <https://rtais.wto.org/>

| | |
| --- | --- |
| One row is | agreement x member states x entry-into-force date |
| Coverage | Global, assembled from several partial inventories |
| Years | 1950s onward |
| Updated | Irregular; no single maintained register |
| Access | Report annexes, the WTO RTA Information System, ILO inventories |
| Format | PDF annexes, some XLSX; assembly required |
| API | WTO RTA-IS has a search interface, not a bulk API |
| Licence | Mixed, mostly free with attribution |
| Network shape | Country blocs with legal free movement: EU/EEA plus Switzerland, the Nordic Passport Union, ECOWAS, EAC, CARICOM, MERCOSUR residence, GCC, the Trans-Tasman arrangement, the Common Travel Area. These are the cliques you would expect to find, so finding them is not a result. |

**Metrics**

- right of entry, residence and work, separately
- entry into force and any suspension
- labour mobility provisions inside trade agreements

**Limitations**

- No single authoritative dataset exists. It has to be assembled by hand, and different inventories disagree on what counts as free movement.
- Legal right and practical exercise diverge sharply. ECOWAS grants free movement on paper and border practice does not follow.
- Suspensions (Schengen internal border controls since 2015) are recorded nowhere consistently.

### UN Treaty Collection ratification status

United Nations Office of Legal Affairs. <https://treaties.un.org/>

| | |
| --- | --- |
| One row is | country x treaty x action x date |
| Coverage | Global |
| Years | 1945 onward |
| Updated | Continuous |
| Access | Open web database; scraping needed for bulk |
| Format | Web, HTML tables |
| API | No official API |
| Licence | UN terms |
| Network shape | Bipartite country-treaty, projecting to a legal-alignment network. |

**Metrics**

- 1951 Refugee Convention and 1967 Protocol, with reservations
- 1954 and 1961 statelessness conventions
- 1990 Migrant Workers Convention (ICRMW)
- Palermo Protocols on trafficking and smuggling
- signature, ratification and reservation dates

**Limitations**

- Reservations matter enormously and are free text, so they resist coding. Several states ratified the Refugee Convention with a geographic limitation that changes what it means.
- Ratification is not compliance.
- No bulk download; the tables have to be scraped.

## Other global networks

Trade, flights, diplomacy, shipping, attention. The comparison set for any claim that migration structure is special, and the transport layer the hub question actually needs.

### OpenFlights and OurAirports route data

OpenFlights project; OurAirports. <https://openflights.org/data.html>

| | |
| --- | --- |
| One row is | airline x source airport x destination airport |
| Coverage | ~67,000 routes, ~3,300 airlines, ~10,000 airports |
| Years | Snapshot, last major refresh around 2014 |
| Updated | OpenFlights is effectively frozen; OurAirports is community-updated |
| Access | Open download from GitHub |
| Format | CSV with coordinates |
| API | No |
| Licence | Open Database License |
| Network shape | Directed city-pair and airport-pair network. The transport layer the betweenness question needs, and the only free one at airport level. |

**Metrics**

- route existence by airline
- airport coordinates, IATA and ICAO codes
- number of stops
- equipment type

**Limitations**

- Stale. The 2014 snapshot predates Gulf carrier expansion, COVID network cuts and every low-cost route since. Betweenness computed on it describes 2014.
- Route existence, not capacity. A daily A380 and a weekly turboprop are the same edge.
- Airport-level, so a multi-airport city needs manual aggregation before it answers a question about cities.

### OpenSky Network flight data

OpenSky Network. <https://opensky-network.org/datasets/>

| | |
| --- | --- |
| One row is | individual flight: aircraft, origin and destination airport, times |
| Coverage | Global where ADS-B receivers exist; dense in Europe and North America |
| Years | 2016 onward; the COVID-19 dataset covers 2019 onward continuously |
| Updated | Live, with monthly historical dumps |
| Access | Free for research after registration; the COVID dataset is open on Zenodo |
| Format | CSV, Parquet, Trino/Impala query access |
| API | Yes, REST and a Python client |
| Licence | CC BY for the published datasets |
| Network shape | Directed airport-pair network with actual flight counts per day. This is the dataset that shows COVID collapsing and recovering, edge by edge, at daily resolution. |

**Metrics**

- flights per airport pair per day
- aircraft type and operator
- departure and arrival times
- full trajectories for a subset

**Limitations**

- Coverage follows volunteer receivers. Africa, central Asia and oceanic sectors are thin, which is exactly where some interesting routes are.
- Origin and destination airports are inferred from trajectories, not filed plans, so short and low-altitude flights are missed.
- Flights are not passengers. Cargo and repositioning flights are in there.
- Large. The COVID dataset alone runs to tens of gigabytes.

### UN Comtrade and CEPII BACI bilateral trade

UN Statistics Division; CEPII. <https://comtradeplus.un.org/>

| | |
| --- | --- |
| One row is | exporter x importer x product x year, value and quantity |
| Coverage | Global, ~200 reporters |
| Years | Comtrade from 1962; BACI from 1995 |
| Updated | Annual, with monthly Comtrade series |
| Access | Comtrade free tier with rate limits and a paid bulk tier; BACI free after registration |
| Format | CSV, JSON; BACI is a single large CSV per year |
| API | Yes for Comtrade |
| Licence | UN terms; BACI free for research |
| Network shape | Weighted directed trade network, complete and annual. The standard comparison: if migration centrality just reproduces trade centrality, there is nothing migration-specific to report. |

**Metrics**

- export and import value by HS product code
- quantities
- BACI reconciles mirror discrepancies into one value

**Limitations**

- Comtrade mirror statistics disagree; exporter-reported and importer-reported values for the same flow differ by a lot. BACI exists to patch this and its patching is a model.
- Free API rate limits make a full matrix pull slow.
- Entrepôt trade (Netherlands, Singapore, Hong Kong) inflates their betweenness for reasons that have nothing to do with migration.

### IMF PortWatch

IMF and Oxford University, from AIS satellite data. <https://portwatch.imf.org/>

| | |
| --- | --- |
| One row is | port x day, and chokepoint x day, vessel transits |
| Coverage | ~1,400 ports, 25 maritime chokepoints |
| Years | January 2019 onward, daily |
| Updated | Daily, with about a two-day lag |
| Access | Open portal with downloads and an ArcGIS feature service |
| Format | CSV, GeoJSON |
| API | Yes |
| Licence | Free with attribution |
| Network shape | Port-to-port trade flow estimates, and a direct daily series for the Strait of Hormuz, Bab el-Mandeb, Suez, Panama and the Bosphorus. This is the dataset for a chokepoint event study. |

**Metrics**

- daily vessel transits by chokepoint and cargo type
- port calls and estimated trade volume by port
- disruption simulation results

**Limitations**

- Ships, not people. It answers what a chokepoint closure did to trade and says nothing directly about migration.
- Volumes are estimated from AIS vessel characteristics, not manifests.
- AIS can be switched off, and is, on sanctioned routes.

### Lowy Institute Global Diplomacy Index

Lowy Institute. <https://globaldiplomacyindex.lowyinstitute.org/>

| | |
| --- | --- |
| One row is | sending country x host city, diplomatic post |
| Coverage | ~110 countries, ~11,000 posts |
| Years | 2016, 2017, 2019, 2021, 2024 editions |
| Updated | Every two to three years |
| Access | Open interactive site; bulk data needs scraping |
| Format | Web, JSON behind the visualisation |
| API | No official API |
| Licence | Free with attribution |
| Network shape | Directed network of embassies and consulates, at city level. Where a country has a consulate is where its nationals can get a visa, so this is a real component of 'how easy is it to get there'. |

**Metrics**

- embassies, consulates general, permanent missions, other posts
- host city
- network size ranking

**Limitations**

- 110 countries, so most of the sending side of the world is missing.
- A post existing is not a post issuing visas; many consulates do no consular work.
- Editions are years apart, so closures during a crisis are invisible.

### UN General Assembly voting data

Erik Voeten, Harvard Dataverse. <https://dataverse.harvard.edu/dataverse/Voeten>

| | |
| --- | --- |
| One row is | country x resolution x vote |
| Coverage | Global, all member states |
| Years | 1946 onward |
| Updated | Annual updates |
| Access | Open download |
| Format | CSV, Stata, R |
| API | No |
| Licence | CC0 |
| Network shape | Country similarity network from vote agreement, plus ideal-point estimates. Tells you whether a migration clique is a political bloc. |

**Metrics**

- vote choice per resolution
- ideal point estimates with uncertainty
- agreement scores between country pairs
- issue codes including human rights

**Limitations**

- UNGA votes are cheap talk. Agreement there does not imply cooperation on anything costly.
- Most resolutions pass by consensus and carry no information.
- Ideal points are a one-dimensional summary of a multidimensional thing.

### Wikimedia Clickstream and Pageviews

Wikimedia Foundation. <https://dumps.wikimedia.org/other/clickstream/>

| | |
| --- | --- |
| One row is | referrer article -> target article, monthly click count; and article x day views |
| Coverage | Major language editions |
| Years | 2015 onward, monthly dumps |
| Updated | Monthly |
| Access | Open dumps, no registration |
| Format | TSV.gz dumps; REST API for pageviews |
| API | Yes for pageviews |
| Licence | CC0 |
| Network shape | A weighted version of the article-link network in this repo: how many readers actually walked each edge. Turns a link graph into a traffic graph, which changes every centrality on it. |

**Metrics**

- clicks per article pair per month
- link type: link, external, other
- daily pageviews per article by access method and agent

**Limitations**

- Counts under ten are dropped from the clickstream for privacy, which removes most edges in a small domain like ours.
- Reader attention, not importance. A news cycle moves it.
- Bot filtering is imperfect despite the agent field.
- One language edition at a time; the English one carries an anglophone readership.

## Irregular migration, deaths and trafficking

The part of the phenomenon that no register counts properly.

### IOM Missing Migrants Project

IOM Global Migration Data Analysis Centre. <https://missingmigrants.iom.int/downloads>

| | |
| --- | --- |
| One row is | incident: date, location, route, dead, missing, survivors, nationalities |
| Coverage | Global, all migration routes |
| Years | 2014 onward |
| Updated | Continuous, updated weekly |
| Access | Open download, no registration |
| Format | CSV with coordinates |
| API | Partial |
| Licence | CC BY |
| Network shape | Not a network. Point events with coordinates and a named route; can be aggregated to origin-route or origin-region edges. |

**Metrics**

- dead and missing per incident
- cause of death
- route
- coordinates
- reported nationalities of the deceased
- number of survivors

**Limitations**

- Undercount by construction, and the publisher says so. Deaths in deserts and in unmonitored sea areas are found only when someone reports them.
- Media-sourced, so coverage tracks journalistic attention. The Mediterranean looks deadlier partly because it is watched.
- Nationality is unknown for most records.
- An incident is not a person; group incidents with an unknown count are recorded with estimates.

### Counter Trafficking Data Collaborative

IOM, Polaris, Liberty Shared and partners. <https://www.ctdatacollaborative.org/>

| | |
| --- | --- |
| One row is | individual victim case, de-identified |
| Coverage | Global, ~190 countries of origin represented |
| Years | 2002 onward |
| Updated | Periodic releases |
| Access | Open global synthetic and k-anonymised datasets |
| Format | CSV |
| API | No |
| Licence | CC BY-NC |
| Network shape | Origin country -> exploitation country edges at case level. One of very few victim-level datasets that yields a real network. |

**Metrics**

- country of origin, exploitation and citizenship
- type of exploitation: sexual, forced labour, forced marriage
- means of control
- recruiter relationship
- age band and gender
- sector of exploitation

**Limitations**

- Cases known to service providers. This is a sample of the identified, which is a biased sample of the exploited.
- Heavy privacy protection: k-anonymisation and synthetic variants blur exactly the small cells you would want.
- Case counts reflect counter-trafficking capacity in a country, not trafficking prevalence.

### UNODC Global Report on Trafficking in Persons

UN Office on Drugs and Crime. <https://www.unodc.org/unodc/data-and-analysis/glotip.html>

| | |
| --- | --- |
| One row is | country x year, detected victims and convictions; plus origin-destination flows at subregional level |
| Coverage | ~150 countries reporting |
| Years | 2003 onward, biennial reports |
| Updated | Every two years |
| Access | Report plus a data portal |
| Format | PDF, XLSX, some CSV |
| API | No |
| Licence | UN terms |
| Network shape | Subregion -> subregion trafficking flows. Coarse, but the only official global one. |

**Metrics**

- detected victims by age, sex and form of exploitation
- convictions and prosecutions
- cross-border vs domestic share
- origin-destination flows at subregional resolution

**Limitations**

- Detection, not prevalence, and detection is a function of enforcement.
- Subregional flows only; no country pairs.
- Reporting country coverage changes between editions, which breaks comparability of totals.

### Global Detention Project database

Global Detention Project. <https://www.globaldetentionproject.org/>

| | |
| --- | --- |
| One row is | detention facility; and country immigration-detention profile |
| Coverage | ~100 countries profiled |
| Years | 2006 onward, rolling updates |
| Updated | Rolling |
| Access | Open web database and downloads |
| Format | Web, CSV extracts |
| API | Limited |
| Licence | CC BY-NC |
| Network shape | Not a network. Facility-level attributes with coordinates, plus country legal frameworks. |

**Metrics**

- number and type of detention facilities
- detention capacity and population where known
- legal grounds and maximum duration
- detention of minors
- operators including private contractors

**Limitations**

- Coverage depends on state transparency; the least transparent systems have the thinnest profiles.
- Capacity and occupancy figures are often years old.
- Facility lists are incomplete where detention happens in police stations and unofficial sites.

## Remittances and labour

Money moving against the direction of people.

### KNOMAD bilateral remittance matrix

World Bank / KNOMAD. <https://www.knomad.org/data/remittances>

| | |
| --- | --- |
| One row is | sending country x receiving country x year, USD |
| Coverage | ~214 countries, complete matrix |
| Years | 2010 onward, selected years |
| Updated | Alongside the Migration and Development Brief |
| Access | XLSX download |
| Format | XLSX square matrix |
| API | No |
| Licence | CC BY |
| Network shape | Weighted directed money network, the mirror image of the migration network. Comparing the two is a ready-made research question. |

**Metrics**

- estimated bilateral remittance flow in USD

**Limitations**

- Estimated, not measured. Allocation uses the bilateral migrant stock and income differences, so the remittance network is partly a transformation of the migration network. Correlating them is close to circular.
- Informal channels, hawala and cash carried by hand are outside it.
- National totals are balance-of-payments figures with known definitional problems around compensation of employees.

### Remittance Prices Worldwide

World Bank. <https://remittanceprices.worldbank.org/>

| | |
| --- | --- |
| One row is | corridor x provider x quarter, cost of sending a fixed amount |
| Coverage | 48 sending and 105 receiving countries, 367 corridors |
| Years | 2008 onward, quarterly |
| Updated | Quarterly |
| Access | Open download |
| Format | XLSX, CSV |
| API | No |
| Licence | CC BY |
| Network shape | Weighted directed corridor network where the weight is a price, not a volume. Useful as an edge cost. |

**Metrics**

- total cost as percentage of the amount sent
- fee and exchange-rate margin split
- by provider type: bank, MTO, mobile operator
- speed of transfer
- SDG 10.c.1 indicator

**Limitations**

- Corridor set is chosen for policy salience, not coverage. Many corridors with large volumes are missing.
- Mystery-shopper prices, collected on one day per quarter.
- Advertised prices, which are not what everyone pays.

### World Bank World Development Indicators

World Bank. <https://data.worldbank.org/>

| | |
| --- | --- |
| One row is | country x year x indicator |
| Coverage | Global, 217 economies plus aggregates |
| Years | 1960 onward, varies by indicator |
| Updated | Continuous, with annual major updates |
| Access | Open API with no key |
| Format | JSON, XML, CSV bulk |
| API | Yes: api.worldbank.org/v2/ |
| Licence | CC BY 4.0 |
| Network shape | Node attributes. The default covariate set for country-level models. |

**Metrics**

- net migration SM.POP.NETM
- international migrant stock SM.POP.TOTL and share SM.POP.TOTL.ZS
- personal remittances received BX.TRF.PWKR.CD.DT and paid BM.TRF.PWKR.CD.DT
- remittances as share of GDP BX.TRF.PWKR.DT.GD.ZS
- GDP per capita, population, urban share, unemployment

**Limitations**

- Net migration is a five-year residual estimate, not a measurement, and it absorbs every error in the population accounts.
- The refugee series SM.POP.REFG has been archived; use UNHCR instead.
- Aggregate rows (WLD, EUU, income groups) share the same endpoint as countries and will silently pollute a country-level join.
- Latest year coverage thins out for poorer countries, so a 'latest available' join creates a rich-country sample without warning.

*Checked: fetched 2026-09-16: 2024 values returned for 243-260 countries across population, net migration, migrant stock, remittances and GDP per capita; SM.POP.REFG returns 'indicator not found'.*

### ILOSTAT labour migration statistics

International Labour Organization. <https://ilostat.ilo.org/topics/labour-migration/>

| | |
| --- | --- |
| One row is | country x year x sex x status, migrant worker counts and shares |
| Coverage | ~130 countries with labour force surveys |
| Years | Mostly 2010 onward |
| Updated | Annual, with periodic global estimates |
| Access | Open bulk download and an API |
| Format | CSV, SDMX |
| API | Yes |
| Licence | CC BY |
| Network shape | Node attributes |

**Metrics**

- international migrant workers by sex and sector
- share of migrants in the labour force
- informality rate among migrant workers
- unemployment rate of migrants vs nationals
- domestic workers who are migrants

**Limitations**

- Labour force surveys miss people in collective housing, undocumented workers and very recent arrivals. Those are large migrant groups.
- Gulf states, which host the largest migrant labour shares, have thin or absent survey series.
- Global estimates are modelled from a partial country set.

## Survey and census microdata

Individual records. Where mechanism lives, at the cost of harmonisation work.

### IPUMS International

Minnesota Population Center. <https://international.ipums.org/international/>

| | |
| --- | --- |
| One row is | individual census record, harmonised |
| Coverage | 100+ countries, 500+ censuses, over a billion records |
| Years | 1960 onward, some earlier |
| Updated | New samples added continuously |
| Access | Free registration and a project description; extracts by request |
| Format | Custom extract: CSV, Stata, SPSS, fixed-width |
| API | Yes, extract API |
| Licence | Free for research; redistribution prohibited |
| Network shape | Not a network in itself, but birthplace x residence at individual level rebuilds the bilateral stock matrix with any covariate you want on the edge. |

**Metrics**

- country of birth
- year of immigration
- citizenship
- internal migration: previous residence one and five years ago
- education, occupation, income, household structure, language

**Limitations**

- Registration and an approved research purpose. Not a drop-in download.
- Harmonisation loses country-specific detail; the harmonised birthplace variable groups small origins into regional categories.
- Census rounds are ten years apart in most countries.
- Some countries release only small samples, and a few release nothing recent.
- Undocumented populations are under-enumerated in every census.

### IPUMS USA, CPS and ACS

Minnesota Population Center. <https://usa.ipums.org/usa/>

| | |
| --- | --- |
| One row is | individual record, US |
| Coverage | United States |
| Years | 1850 onward for censuses; ACS from 2000; CPS from 1962 |
| Updated | Annual |
| Access | Free registration, extract system |
| Format | CSV, Stata, SPSS |
| API | Yes |
| Licence | Free for research |
| Network shape | Origin -> US edges with full individual covariates |

**Metrics**

- birthplace at detailed country level
- year of immigration
- citizenship status
- ancestry
- language spoken at home
- wages, occupation, industry, education
- state and PUMA of residence

**Limitations**

- One destination.
- ACS is a 1% sample; small origin groups have wide standard errors and the design effect is easy to forget.
- Legal status is not asked. Imputation of undocumented status is an assumption-heavy literature.

### European Social Survey

ESS ERIC. <https://www.europeansocialsurvey.org/>

| | |
| --- | --- |
| One row is | individual respondent, repeated cross-section |
| Coverage | ~30 European countries |
| Years | 2002 onward, biennial rounds |
| Updated | Every two years |
| Access | Free download after registration |
| Format | CSV, Stata, SPSS |
| API | No |
| Licence | Free for non-commercial use |
| Network shape | Node attributes aggregated to country, or individual-level analysis |

**Metrics**

- allow more or fewer immigrants of same race, different race, poorer countries outside Europe
- immigration good or bad for the economy, cultural life, place to live
- respondent's own and parents' country of birth
- contact with people of a different race
- trust, political orientation, religiosity

**Limitations**

- Europe only.
- The three headline immigration items are the same wording since 2002, which is a strength for trends and a weakness for anything recent.
- Response rates have fallen and vary sharply across countries.
- Migrants themselves are undersampled; surveys in the national language exclude recent arrivals.

### Gallup World Poll migration module

Gallup. <https://www.gallup.com/analytics/318875/global-research.aspx>

| | |
| --- | --- |
| One row is | individual respondent, ~1000 per country per year |
| Coverage | ~150 countries |
| Years | 2005 onward, annual |
| Updated | Annual |
| Access | Commercial licence; derived indices published free |
| Format | Proprietary; institutional subscription |
| API | Commercial |
| Licence | Proprietary |
| Network shape | Desire-to-move gives an intended origin -> destination network, which is rare and valuable: intentions before selection. |

**Metrics**

- desire to migrate permanently
- planning to move in the next 12 months
- preferred destination country
- Potential Net Migration Index
- life evaluation, employment, social capital

**Limitations**

- Expensive. The microdata is behind an institutional subscription.
- Intentions are not behaviour. The gap between wanting to move and moving is roughly an order of magnitude.
- 1000 respondents per country makes destination-level breakdowns thin.
- Sampling in conflict-affected countries is partial or suspended.

### MAFE, Migrations between Africa and Europe

INED and partners. <https://mafeproject.site.ined.fr/en/>

| | |
| --- | --- |
| One row is | individual life history, origin and destination samples |
| Coverage | Senegal, DR Congo, Ghana; France, Italy, Spain, UK, Belgium, Netherlands |
| Years | Fieldwork 2008-2010, retrospective histories back decades |
| Updated | Static |
| Access | Free after registration |
| Format | Stata, CSV |
| API | No |
| Licence | Academic use |
| Network shape | Individual migration trajectories, plus transnational family networks. Gives multi-step migration paths, which almost nothing else does. |

**Metrics**

- year-by-year residence, activity, housing and family histories
- return and circular migration
- remittances and investments back home
- documentation status over time
- network contacts at destination before departure

**Limitations**

- Three origin countries. Not generalisable.
- Fieldwork is now fifteen years old.
- Retrospective recall over decades, with the usual telescoping errors.
- Sampling migrants at destination and non-migrants at origin makes the weighting delicate.

### DHS and LSMS household surveys

USAID / ICF; World Bank. <https://dhsprogram.com/>

| | |
| --- | --- |
| One row is | household and individual records |
| Coverage | 90+ low and middle income countries |
| Years | 1984 onward (DHS); 1985 onward (LSMS) |
| Updated | Country rounds every few years |
| Access | Free after a registered project request |
| Format | Stata, SPSS, CSV |
| API | DHS has an API for indicators |
| Licence | Free for research |
| Network shape | Household rosters with absent members give an origin-household -> destination network, including internal migration. |

**Metrics**

- absent household members and where they went
- remittances received by the household
- migration history of the respondent
- internal vs international split
- health, fertility and consumption outcomes

**Limitations**

- Whole-household migration is invisible: if everyone left, nobody is home to be surveyed. This biases the sample toward split households.
- Migration modules are not standard across rounds or countries.
- Destination is often recorded only as 'abroad'.

## Digital trace and estimated data

Platform and model output. High frequency, uncertain denominator.

### Meta Social Connectedness Index

Meta / Humanitarian Data Exchange. <https://data.humdata.org/dataset/social-connectedness-index>

| | |
| --- | --- |
| One row is | region pair, relative friendship link intensity |
| Coverage | Global at country level; subnational for many countries |
| Years | Snapshots from 2018 onward |
| Updated | Occasional refreshes |
| Access | Open download via HDX |
| Format | TSV |
| API | No |
| Licence | Free with attribution, some use restrictions |
| Network shape | Weighted undirected social network between places. Correlates strongly with migration corridors and is available where migration data is not. |

**Metrics**

- scaled probability that two users in regions i and j are friends

**Limitations**

- Facebook users, not people. Penetration varies by country, age and gender, and the index is scaled in a way that hides the denominator.
- Friendship is not migration. Diaspora, tourism, colonial history and language all load onto it.
- Undirected, so it cannot tell origin from destination.
- Snapshot timing is not always documented.

### LinkedIn Data for Development migration indicators

World Bank and LinkedIn. <https://datacatalog.worldbank.org/search/dataset/0038044>

| | |
| --- | --- |
| One row is | origin country x destination country x industry x skill, relative flow |
| Coverage | ~100 countries with sufficient LinkedIn penetration |
| Years | 2015 onward, quarterly |
| Updated | Quarterly |
| Access | Open via the World Bank Data Catalog |
| Format | CSV |
| API | No |
| Licence | CC BY |
| Network shape | Weighted directed network of professional relocation, by skill and industry. The only near-real-time high-skill migration network. |

**Metrics**

- migration rate per 10,000 members
- by industry and by skill group
- talent migration direction

**Limitations**

- LinkedIn members: white-collar, urban, English-literate. It measures a narrow slice and calls it talent.
- Penetration differs by an order of magnitude across countries, so cross-country levels are not comparable, only within-country trends.
- Location changes are self-reported and can lag or be aspirational.
- No coverage of China and several large markets.

### Geotagged social media migration estimates

Academic (Zagheni, Weber, State and others). <https://www.demographic-research.org/>

| | |
| --- | --- |
| One row is | user trajectory aggregated to country pairs and months |
| Coverage | Varies by study; global in principle |
| Years | 2011 onward, study-specific windows |
| Updated | Not maintained; replication datasets only |
| Access | Replication packages; raw platform data increasingly closed |
| Format | CSV |
| API | Platform APIs largely closed since 2023 |
| Licence | Varies |
| Network shape | Directed monthly migration network at high frequency |

**Metrics**

- estimated migration rate
- seasonality
- post-shock displacement response within weeks

**Limitations**

- The platform APIs that made this work possible are now closed or priced out of reach. New collection is mostly not feasible.
- Geotagging is a small and unrepresentative share of users.
- Distinguishing migration from tourism and business travel needs an arbitrary dwell-time threshold.
- Bias correction requires an external ground truth, which returns you to DESA.

### GDELT Global Knowledge Graph

GDELT Project. <https://www.gdeltproject.org/>

| | |
| --- | --- |
| One row is | news event and article, every 15 minutes |
| Coverage | Global, 100+ languages |
| Years | 1979 onward for events; GKG from 2013 |
| Updated | Every 15 minutes |
| Access | Open; BigQuery public dataset and raw file downloads |
| Format | CSV, BigQuery |
| API | Yes |
| Licence | Free with attribution |
| Network shape | Actor-to-actor event network, and a country co-mention network. Migration-related events can be filtered by CAMEO code and theme (REFUGEES, MIGRATION, BORDER). |

**Metrics**

- event actors, type, tone and Goldstein score
- themes including refugee and migration codes
- geographic mentions
- article volume and tone by country

**Limitations**

- Media attention, not events. Volume tracks newsroom capacity.
- Automated actor and event coding is noisy; published error rates for CAMEO coding are high enough to matter.
- Deduplication of the same story across outlets is imperfect, so volume spikes can be one story reprinted.
- English-language sources dominate despite the multilingual claim.

## High-frequency and event data

Daily to monthly series. The only family that can see COVID, a chokepoint closure or a travel ban.

### Oxford COVID-19 Government Response Tracker

Blavatnik School of Government, University of Oxford. <https://github.com/OxCGRT/covid-policy-dataset>

| | |
| --- | --- |
| One row is | country (and US state, some subnational) x day x policy indicator |
| Coverage | 180+ countries |
| Years | 1 January 2020 to 31 December 2022 |
| Updated | Closed series, complete |
| Access | Open on GitHub |
| Format | CSV |
| API | Yes |
| Licence | CC BY |
| Network shape | Node attributes at daily resolution. C8 international travel controls is the variable that makes COVID border closure an event study rather than an anecdote. |

**Metrics**

- C8 international travel controls, 0 to 4
- C7 internal movement restrictions
- stringency index, containment and health index
- school and workplace closure, stay-at-home orders

**Limitations**

- C8 is a country-level ordinal, so it cannot say which origins were banned. A ban on three countries and a total closure can score the same.
- Policy on paper, again. Enforcement varied.
- Ends at the close of 2022.

### IOM COVID-19 travel and mobility restrictions

IOM Displacement Tracking Matrix. <https://dtm.iom.int/>

| | |
| --- | --- |
| One row is | country x point in time x restriction type; and point of entry status |
| Coverage | Global, ~240 countries and territories, ~7,000 points of entry |
| Years | March 2020 to 2022 |
| Updated | Closed; was updated twice weekly |
| Access | Open via dtm.iom.int and HDX |
| Format | CSV, XLSX |
| API | Partial |
| Licence | Free with attribution |
| Network shape | Directed, and this is the point: IOM recorded which nationalities each country barred, so the COVID border regime is a bilateral network, not a single index. |

**Metrics**

- points of entry fully or partially closed, by air, land and sea
- nationality-specific entry bans
- exceptions for residents, medical and essential travel
- quarantine and testing requirements

**Limitations**

- Collected from official announcements, so it records the rule on the day it was announced, not the day it took effect.
- Point-in-time snapshots rather than a clean daily panel; reconstructing a continuous series needs interpolation.
- Stops in 2022.

### UNHCR Operational Data Portal

UNHCR. <https://data.unhcr.org/>

| | |
| --- | --- |
| One row is | situation x country x date, arrivals and border crossings |
| Coverage | Active emergencies: Ukraine, Sudan, Afghanistan, Venezuela, Syria and others |
| Years | Situation-specific, mostly 2015 onward |
| Updated | Daily to weekly during an emergency |
| Access | Open portal with downloads and an API |
| Format | CSV, JSON |
| API | Yes |
| Licence | Free with attribution |
| Network shape | Origin -> neighbouring country arrivals at daily or weekly resolution. The only place a displacement shock is visible while it happens. |

**Metrics**

- border crossings per day by crossing point
- refugees recorded in each neighbouring country
- onward movement to third countries
- returns to the country of origin

**Limitations**

- Only where there is an active response. A shock without an emergency declaration leaves no trace here.
- Border crossing counts are movements, not people, and include back-and-forth travel, which was large in Ukraine.
- Series definitions change as a response matures, and old figures get revised without a changelog.
- Portals are archived and sometimes taken down when a situation closes.

### US monthly immigrant and nonimmigrant visa issuance statistics

US Department of State, Bureau of Consular Affairs. <https://travel.state.gov/content/travel/en/legal/visa-law0/visa-statistics.html>

| | |
| --- | --- |
| One row is | month x visa class x nationality x issuing post |
| Coverage | United States, all consular posts worldwide |
| Years | 2017 onward monthly; annual back further |
| Updated | Monthly, with about a two-month lag |
| Access | Open download |
| Format | PDF and XLSX tables, monthly files |
| API | No |
| Licence | US public domain |
| Network shape | Origin nationality -> US, monthly, split by visa class and by the consulate that issued it. The sharpest instrument for measuring what a travel ban or a policy change did, and when. |

**Metrics**

- visas issued by class: H-1B, F-1, B1/B2, immigrant preference categories, diversity visa
- by nationality and by post
- refusals under specific grounds in the annual tables

**Limitations**

- Issuance, not arrival or stay. Many issued visas are never used.
- Published as monthly PDFs and workbooks with inconsistent layouts, so building a panel is a parsing job.
- Consular capacity confounds everything. A post that closed issues zero visas whatever the policy says.
- One destination.

### US Refugee Processing Center arrivals (WRAPS)

US Department of State Refugee Processing Center. <https://www.wrapsnet.org/admissions-and-arrivals/>

| | |
| --- | --- |
| One row is | month x nationality x religion x US state of resettlement |
| Coverage | United States |
| Years | 2002 onward monthly |
| Updated | Monthly |
| Access | Open download from the interactive reporting site |
| Format | XLSX, CSV |
| API | No |
| Licence | US public domain |
| Network shape | Origin -> US state resettlement flows, monthly. Shows the effect of an admissions ceiling change within weeks. |

**Metrics**

- refugee arrivals by nationality and month
- state and city of initial resettlement
- religion
- resettlement agency
- annual presidential determination ceiling

**Limitations**

- Resettlement is a programme, not migration. The numbers move because the ceiling moved, which is the point but also the limit.
- Initial placement only; secondary migration within the US is invisible and is large.
- The site's export formats change between administrations.

### Schengen visa statistics by consulate and nationality

European Commission, DG Migration and Home Affairs. <https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en>

| | |
| --- | --- |
| One row is | Schengen state x consulate x applicant nationality x year |
| Coverage | All Schengen consulates worldwide |
| Years | 2010 onward |
| Updated | Annual |
| Access | Open download |
| Format | XLSX |
| API | No |
| Licence | Reuse with attribution |
| Network shape | Weighted directed: applications and refusals from every nationality to every Schengen state. The refusal rate is the honest answer to 'how easy is it to get there', far better than the binary visa requirement. |

**Metrics**

- short-stay visa applications, issued, refused
- refusal rate by nationality and by consulate
- multiple-entry visa share
- airport transit visas

**Limitations**

- Short-stay visas only. Work and study permits are national and are published separately or not at all.
- Annual, so it cannot resolve a policy change within a year.
- Applications are filtered by expectation. A nationality with a 60% refusal rate also has people who never applied, so the rate understates the barrier.
- Consulate workload and appointment scarcity are invisible and are often the real constraint.

### Mixed Migration Centre 4Mi

Mixed Migration Centre, Danish Refugee Council. <https://mixedmigration.org/4mi/>

| | |
| --- | --- |
| One row is | individual interview with a person on the move, at a route point |
| Coverage | West, North and East Africa, Asia, Latin America, Europe |
| Years | 2014 onward, continuous |
| Updated | Continuous, with monthly and quarterly snapshots |
| Access | Open dashboards and downloadable datasets |
| Format | CSV, XLSX |
| API | Partial |
| Licence | Free with attribution |
| Network shape | Multi-step journeys: departure country, every transit country, intended destination. Almost nothing else records the middle of a journey, and betweenness without it is guesswork. |

**Metrics**

- route taken, waypoint by waypoint
- cost paid and to whom
- duration
- smuggler use
- protection incidents on route
- reason for leaving and for choosing the destination
- change of intended destination during the journey

**Limitations**

- Purposive sampling at accessible route points. It is not representative of people on the move and the publisher says so plainly.
- Interviewees who died or were detained are not interviewed, so the sample is conditioned on survival and mobility.
- Geographic coverage follows funded programmes.
- Self-reported costs and durations.

### Google Trends migration search interest

Google. <https://trends.google.com/trends/>

| | |
| --- | --- |
| One row is | region x week x search term, relative interest 0-100 |
| Coverage | Global, at country and subnational level |
| Years | 2004 onward |
| Updated | Daily to weekly |
| Access | Free web interface; unofficial Python clients |
| Format | CSV export |
| API | No official API |
| Licence | Google terms; no redistribution of raw series |
| Network shape | Not a network. A leading indicator: searches for emigration terms move weeks before the movement does, which is how the nowcasting literature detects a shock early. |

**Metrics**

- relative search interest for terms such as 'jobs in Germany', 'asylum application', 'visa sponsorship'
- related queries and rising queries
- subnational breakdown within a country

**Limitations**

- Indexed to 100 within the query window, so two pulls are not comparable and the absolute level is unknowable.
- Sampled, so repeated identical queries return slightly different series.
- Language choice determines the result, which makes cross-country comparison a translation problem.
- Search interest is not intent and intent is not migration.

## City and subnational

Below the country. Thin, fragmented, and unavoidable if the question says 'cities'.

### GaWC world city network

Globalization and World Cities Research Network, Loughborough. <https://www.lboro.ac.uk/gawc/>

| | |
| --- | --- |
| One row is | city pair, connectivity derived from advanced-producer-service firm offices |
| Coverage | ~700 cities worldwide |
| Years | 2000, 2004, 2008, 2010, 2012, 2016, 2020 rounds |
| Updated | Every few years |
| Access | Open data bulletins |
| Format | XLSX, CSV |
| API | No |
| Licence | Free with citation |
| Network shape | A weighted inter-city network built from where firms put offices. The reference point for any claim that a city is a hub, and it is already a network, which almost no city data is. |

**Metrics**

- global network connectivity score
- alpha, beta, gamma city classification
- city-pair connectivity by sector

**Limitations**

- Measures corporate service networks. A city can be a migration hub and a corporate backwater, and Istanbul, Nairobi and Tijuana are exactly that case.
- Firm office lists are the raw input, so it tracks accountancy and law, not people.
- Rounds are years apart.

### City-level foreign-born population

Eurostat Urban Audit; OECD Metropolitan Areas; national statistics offices. <https://ec.europa.eu/eurostat/web/cities/database>

| | |
| --- | --- |
| One row is | city or metropolitan area x year, population by birthplace or citizenship |
| Coverage | Europe and OECD in depth; the rest of the world patchy |
| Years | 2000 onward for Urban Audit; varies elsewhere |
| Updated | Annual where it exists |
| Access | Eurostat database and OECD Data Explorer |
| Format | TSV, CSV, SDMX |
| API | Yes for both |
| Licence | Reuse with attribution |
| Network shape | Node attributes on cities. There is no global city-to-city migration matrix, and assembling one from these is the single biggest gap for the hub question. |

**Metrics**

- foreign-born and foreign-national population by city
- share of total city population
- by broad region of origin where published
- metropolitan area definitions that are comparable across countries

**Limitations**

- No origin detail in most city tables, so you get a node attribute and not an edge.
- City boundaries differ between sources; Urban Audit cities, functional urban areas and administrative cities are three different things.
- Outside Europe and the OECD this is a collection of incompatible national sources.
- IPUMS International is the fallback and gives city-level birthplace at individual level, at the cost of ten-year census rounds.

### Global friction surface and travel time to cities

Malaria Atlas Project (Weiss et al.). <https://malariaatlas.org/>

| | |
| --- | --- |
| One row is | 1 km raster cell, minutes of travel per metre and time to nearest city |
| Coverage | Global land surface |
| Years | 2015 and 2019 surfaces |
| Updated | Occasional |
| Access | Open download; available through Google Earth Engine |
| Format | GeoTIFF |
| API | Earth Engine |
| Licence | CC BY |
| Network shape | Not a network, but it builds one: least-cost paths across it give real land travel times between any two places, which is what 'how easy is it to get there' means on foot and by road. |

**Metrics**

- motorised travel speed per cell from roads, rivers, railways, land cover and slope
- accumulated travel time to the nearest city of 50,000+

**Limitations**

- It assumes you may travel. Borders, checkpoints, minefields and the sea are not modelled as barriers to a migrant.
- Road network quality comes from OpenStreetMap, which is uneven.
- Static surfaces, so a closed border or a destroyed bridge is invisible.

### IMAGE internal migration around the globe

University of Queensland (Bell, Charles-Edwards, Stillwell and others). <https://imageproject.com.au/>

| | |
| --- | --- |
| One row is | subnational region pair x period, internal migration |
| Coverage | ~130 countries with comparable internal migration measures |
| Years | Census rounds, roughly 1990 onward |
| Updated | Static research output |
| Access | Project repository and published supplementary data |
| Format | CSV, spatial files |
| API | No |
| Licence | Academic use with citation |
| Network shape | Subnational origin-destination networks inside countries. Internal migration is several times larger than international migration, and leaving it out makes every hub claim partial. |

**Metrics**

- crude migration intensity
- migration effectiveness
- aggregate net migration rate
- distance decay parameters
- origin-destination matrices at the finest available geography

**Limitations**

- Comparability is the whole research problem: countries use different region sizes and different time intervals, and the measures correct for this imperfectly.
- Census-based, so five to ten year intervals.
- Not maintained as a live series.

## Drivers and denominators

Population, regime, climate, internal migration. What makes people leave and what you divide by.

### UN World Population Prospects

UN DESA Population Division. <https://population.un.org/wpp/>

| | |
| --- | --- |
| One row is | country x year x age x sex, estimates and projections |
| Coverage | 237 countries and areas |
| Years | 1950-2100 (2024 revision) |
| Updated | Every two years |
| Access | Open download and an API |
| Format | CSV, XLSX |
| API | Yes |
| Licence | Free with attribution |
| Network shape | Node attributes, and the denominator for every rate you will compute. |

**Metrics**

- total population, age structure, median age
- net migration rate by country and year
- fertility, mortality, dependency ratios
- projections under several migration assumptions

**Limitations**

- Net migration in WPP is the residual that balances the population accounts. It absorbs census error and should never be treated as a migration measurement.
- Projections embed a migration assumption, so using them to study migration is circular.
- Revisions change history: the same year gets different values across revisions.

### V-Dem Varieties of Democracy

V-Dem Institute, University of Gothenburg. <https://v-dem.net/data/the-v-dem-dataset/>

| | |
| --- | --- |
| One row is | country x year, ~500 indicators |
| Coverage | 202 countries |
| Years | 1789 onward |
| Updated | Annual, each March |
| Access | Open download; R package |
| Format | CSV, R, Stata |
| API | No |
| Licence | Free for research |
| Network shape | Node attributes. The regime-type covariate, and the push-factor measure that ACLED cannot give you. |

**Metrics**

- liberal, electoral, participatory and deliberative democracy indices
- civil liberties, freedom of movement, freedom of expression
- political violence and repression
- exclusion by social group

**Limitations**

- Expert-coded with measurement-model uncertainty. Use the confidence intervals; most users do not.
- Country-year, so it cannot time a shock.
- Aggregate indices hide which component moved.

### ND-GAIN Country Index

Notre Dame Global Adaptation Initiative. <https://gain.nd.edu/our-work/country-index/>

| | |
| --- | --- |
| One row is | country x year, vulnerability and readiness scores |
| Coverage | 192 countries |
| Years | 1995 onward |
| Updated | Annual |
| Access | Open download |
| Format | CSV |
| API | No |
| Licence | Free with attribution |
| Network shape | Node attributes. The climate push factor, for the part of the migration story that EM-DAT's ten-death threshold misses. |

**Metrics**

- vulnerability across food, water, health, ecosystems, habitat, infrastructure
- readiness: economic, governance, social
- exposure, sensitivity and adaptive capacity separately

**Limitations**

- Composite of composites. The weighting is a choice and results move with it.
- Vulnerability and GDP per capita are strongly correlated, so it is partly a restatement of income.
- Country-level, while climate exposure is intensely local.

## Actors, organisations and events

Who does migration policy and aid, and what happens. The layer this repo harvests.

### Wikipedia and Wikidata migration organisations (this repo)

Harvested here from Wikimedia projects. <https://www.wikidata.org/>

| | |
| --- | --- |
| One row is | organisation article, with country, type and founding date |
| Coverage | Global, limited to organisations with an English Wikipedia article |
| Years | Snapshot; founding dates span the whole history of each organisation |
| Updated | Re-runnable at any time via scripts/migration/run_all.py |
| Access | Free APIs, no key, User-Agent header required |
| Format | TSV produced by this repo; JSON from the APIs |
| API | Yes: MediaWiki action API and the Wikidata SPARQL endpoint |
| Licence | CC BY-SA for Wikipedia text, CC0 for Wikidata claims |
| Network shape | Directed article-link network among organisations, plus a typed Wikidata tie network (member of, parent organisation, affiliation). |

**Metrics**

- organisation type: IGO, NGO, charity, government agency, research institute, diaspora association
- country of the organisation and how it was inferred
- inception and dissolution dates
- number of Wikipedia language editions as a reach proxy
- the categories the organisation was found in

**Limitations**

- Wikipedia notability is the selection rule. Anglophone, formal and long-lived organisations are over-represented; grassroots and non-English-speaking ones are missing.
- An article link is not a relationship. It can mean funding, opposition, a shared founder or a passing mention.
- Country attribution falls back to the category name when Wikidata is silent, which is weaker evidence. The rule used is recorded per row.
- Category membership on Wikipedia is inconsistent and editor-dependent, so the recall of any single crawl is unknown.

*Checked: crawl run 2026-09-16 from 25 seed categories to depth 4*

### Yearbook of International Organizations

Union of International Associations. <https://uia.org/yearbook>

| | |
| --- | --- |
| One row is | international organisation profile |
| Coverage | ~75,000 organisations in 300 countries |
| Years | 1908 onward |
| Updated | Annual |
| Access | Subscription database; some institutional access |
| Format | Web database, limited export |
| API | No |
| Licence | Proprietary |
| Network shape | Organisation-to-organisation relations and shared memberships. The most complete organisational network in existence for this domain, and the hardest to get at. |

**Metrics**

- organisation type and aims
- founding date
- members by country
- relations with other organisations
- consultative status with UN bodies

**Limitations**

- Paywalled, with export restrictions that make bulk network construction difficult even with access.
- Self-reported profiles, updated when organisations respond.
- Coverage of national NGOs is thin; the focus is international bodies.

### ACLED and UCDP conflict event data

ACLED; Uppsala Conflict Data Program. <https://acleddata.com/>

| | |
| --- | --- |
| One row is | conflict event with date, actors, location and fatalities |
| Coverage | Global (ACLED); global (UCDP GED) |
| Years | ACLED 1997 onward by region; UCDP GED 1989 onward |
| Updated | ACLED weekly; UCDP annual with a monthly candidate release |
| Access | Free registration for ACLED; open download for UCDP |
| Format | CSV, API |
| API | Yes for both |
| Licence | ACLED: free for non-commercial with attribution. UCDP: CC BY. |
| Network shape | Actor-to-actor conflict network, and geolocated events that join to displacement data as the driver side of the story. |

**Metrics**

- event type, sub-event type, actors and interaction code
- fatalities
- precise coordinates and geoprecision flag
- civilian targeting

**Limitations**

- Media-sourced, so the same attention bias as GDELT, moderated by human coding.
- ACLED and UCDP disagree on totals for the same conflicts because of different inclusion rules. Pick one and say which.
- Fatality figures in contested conflicts are estimates with wide ranges.

### EM-DAT International Disaster Database

CRED, UCLouvain. <https://www.emdat.be/>

| | |
| --- | --- |
| One row is | disaster event: country, type, deaths, affected, damage |
| Coverage | Global |
| Years | 1900 onward, reliable from 1970s |
| Updated | Continuous |
| Access | Free registration for academic use |
| Format | XLSX, CSV |
| API | Limited |
| Licence | Free for non-commercial research |
| Network shape | Not a network. The environmental driver side, joined by country-year. |

**Metrics**

- disaster type and subtype
- deaths, injured, affected, homeless
- economic damage
- start and end dates
- affected subregions

**Limitations**

- Entry threshold of ten deaths or a hundred affected excludes slow-onset events, which are the ones most linked to migration.
- Reporting improves over time, so a rising trend is partly a reporting artefact.
- 'Affected' is defined inconsistently across sources.

### UN OCHA Financial Tracking Service

UN Office for the Coordination of Humanitarian Affairs. <https://fts.unocha.org/>

| | |
| --- | --- |
| One row is | funding flow: donor organisation -> recipient organisation, with destination country, appeal and sector |
| Coverage | Global humanitarian funding |
| Years | 2000 onward |
| Updated | Continuous, reported by donors and agencies |
| Access | Open, with a documented REST API and no key |
| Format | JSON, CSV |
| API | Yes: api.hpc.tools |
| Licence | Free with attribution |
| Network shape | A directed weighted organisation-to-organisation money network, with a country on every edge. This is the real version of what the Wikipedia link network in this repo approximates. |

**Metrics**

- amount committed and paid, in USD
- source and destination organisation, typed as government, UN agency, NGO, pooled fund or private
- destination country and emergency
- sector, including protection and refugee response
- appeal coverage against requirements

**Limitations**

- Voluntary reporting. Coverage of non-Western donors and of local NGOs is poor, so the network looks more Western-centric than it is.
- Earmarked pass-through funding creates chains that double count if you sum edges naively. A UN agency receiving and regranting appears twice.
- Humanitarian only. Development spending on migration is in the OECD DAC system instead.
- Organisation names are not cleanly keyed, so the same NGO appears under several spellings and needs reconciling before it becomes a node.

### IATI Registry

International Aid Transparency Initiative. <https://iatiregistry.org/>

| | |
| --- | --- |
| One row is | aid activity: reporting organisation, participating organisations, recipient country, sector, transactions |
| Coverage | ~1,500 publishers, millions of activities |
| Years | 2011 onward |
| Updated | Continuous |
| Access | Open registry, Datastore API, no key for basic use |
| Format | XML, with CSV and JSON through the Datastore |
| API | Yes |
| Licence | Mostly open, per publisher |
| Network shape | Funder -> implementer -> recipient country, at activity level. Combined with FTS it gives a full organisational funding network including development as well as humanitarian money. |

**Metrics**

- commitments and disbursements by transaction
- participating organisation roles: funding, accountable, extending, implementing
- OECD DAC sector codes, including 72010 emergency relief and the migration-relevant codes
- recipient country and region
- results frameworks where published

**Limitations**

- Data quality varies by publisher from excellent to unusable. Some publish activities with no transactions at all.
- Organisation identifiers are inconsistent despite the standard, so node resolution is most of the work.
- Self-reported and unaudited.
- XML at scale is awkward; the Datastore is the practical entry point.

### OECD DAC Creditor Reporting System

OECD Development Assistance Committee. <https://www.oecd.org/en/data/datasets/creditor-reporting-system.html>

| | |
| --- | --- |
| One row is | donor x recipient x year x sector x project, aid commitments and disbursements |
| Coverage | All DAC donors plus many non-DAC reporters |
| Years | 1973 onward, detailed from 2002 |
| Updated | Annual |
| Access | Open bulk download and SDMX |
| Format | CSV, SDMX |
| API | Yes |
| Licence | OECD terms, free |
| Network shape | Donor country -> recipient country weighted aid network, filterable to migration and refugee sectors. |

**Metrics**

- aid by purpose code, including refugee support
- in-donor refugee costs, reported as aid
- channel of delivery: which NGO or multilateral implemented it
- commitments and gross disbursements

**Limitations**

- In-donor refugee costs are counted as aid to the recipient country, which means a donor can raise its aid figure by hosting refugees at home. Any analysis that sums 'aid for migration' without excluding this is measuring domestic spending.
- Two-year publication lag.
- Purpose codes are assigned by the donor and applied inconsistently.

### UN ECOSOC consultative status database (iCSO)

UN Department of Economic and Social Affairs. <https://esango.un.org/civilsociety/>

| | |
| --- | --- |
| One row is | NGO profile: name, country, status, year granted, areas of work |
| Coverage | ~6,500 NGOs with consultative status |
| Years | 1946 onward |
| Updated | Continuous |
| Access | Open web database; scraping needed for bulk |
| Format | Web, HTML |
| API | No |
| Licence | UN terms |
| Network shape | Bipartite NGO-to-UN-body accreditation, which projects to an NGO co-accreditation network. A cleaner organisational spine than Wikipedia categories, with a country on every node. |

**Metrics**

- consultative status: general, special, roster
- country of headquarters and countries of operation
- areas of work including migration and refugees
- year status granted

**Limitations**

- Status is a UN relationship, not influence. Many accredited NGOs are dormant.
- Self-described areas of work, so the migration filter is unreliable.
- No bulk export; it has to be scraped, and the site is slow.

### US IRS Form 990 filings

US Internal Revenue Service, mirrored on AWS Open Data. <https://registry.opendata.aws/irs990/>

| | |
| --- | --- |
| One row is | nonprofit organisation x tax year, full return including grants made |
| Coverage | United States, ~1.5 million registered nonprofits |
| Years | 2011 onward for machine-readable e-file data |
| Updated | Continuous as returns are filed |
| Access | Open bulk XML on AWS S3; ProPublica Nonprofit Explorer as a front end |
| Format | XML, with derived CSV from Candid and ProPublica |
| API | Yes, ProPublica |
| Licence | US public domain |
| Network shape | Schedule I lists grants made to named recipients, which yields a funder -> grantee network among US nonprofits. Combined with the NTEE code for international relief and refugee assistance, it gives the US slice of the migration NGO funding network. |

**Metrics**

- revenue, expenses, assets, programme service expenses
- grants made, with recipient name, address and purpose
- officer compensation
- NTEE classification including Q33 international relief and P84 ethnic and immigrant services
- foreign activity by region on Schedule F

**Limitations**

- United States only.
- Recipient names are free text with no identifier, so building edges means entity resolution on messy strings.
- Filing lags by up to two years.
- Small organisations file the 990-N postcard with almost no content, which removes exactly the grassroots groups you would want.

## Historical

Long series, for anything that needs more than thirty years.

### Historical census and passenger records

IPUMS, national archives, Ellis Island Foundation. <https://international.ipums.org/international/>

| | |
| --- | --- |
| One row is | individual record or ship manifest line |
| Coverage | Mostly Europe and the Americas |
| Years | 1820s onward |
| Updated | Static digitisation projects |
| Access | Mixed: IPUMS free with registration, genealogy sites commercial |
| Format | CSV, fixed-width, scanned images with transcriptions |
| API | Partial |
| Licence | Mixed |
| Network shape | Origin -> destination at individual level for the age of mass migration, which is the only period with near-complete individual coverage of a migration wave. |

**Metrics**

- port of departure and arrival
- declared last residence
- age, occupation, literacy, money carried
- name of contact at destination, which yields a real social network

**Limitations**

- Transcription errors in names and places are pervasive.
- Coverage is where records survived and were digitised, which is a European and North Atlantic story.
- Return migration is invisible in arrival records; roughly a third of arrivals in some corridors went home.

## Portals and aggregators

Where to look when nothing above fits.

### Migration Data Portal

IOM Global Migration Data Analysis Centre. <https://www.migrationdataportal.org/>

| | |
| --- | --- |
| One row is | curated indicator listing and country profiles |
| Coverage | Global |
| Years | Current |
| Updated | Continuous |
| Access | Open web |
| Format | Web, some downloads |
| API | No |
| Licence | Free with attribution |
| Network shape | Not data itself. The best single index of who publishes what, including the definitions and the caveats. |

**Metrics**

- indicator definitions
- country profiles
- thematic overviews with source lists

**Limitations**

- A directory, not a repository. Everything still has to be fetched from the original publisher.
- Some linked sources are stale.

### Migration Policy Institute Data Hub

Migration Policy Institute. <https://www.migrationpolicy.org/programs/migration-data-hub>

| | |
| --- | --- |
| One row is | curated tables and interactive maps |
| Coverage | United States in depth; global and European summaries |
| Years | Current with historical series |
| Updated | Continuous |
| Access | Open web with XLSX downloads |
| Format | XLSX, web |
| API | No |
| Licence | Free with attribution |
| Network shape | Not a network. Derived tables, pre-cleaned, good for sanity checks. |

**Metrics**

- immigrant population by state and metro area
- unauthorised population estimates
- refugee admissions
- European asylum trends

**Limitations**

- Derived from ACS and official sources, so it inherits their limits and adds MPI's own modelling for unauthorised estimates.
- US-centric.
- Tables, not microdata.

### Humanitarian Data Exchange

UN OCHA Centre for Humanitarian Data. <https://data.humdata.org/>

| | |
| --- | --- |
| One row is | dataset records from hundreds of organisations |
| Coverage | Global, crisis-focused |
| Years | 2014 onward |
| Updated | Continuous |
| Access | Open, with an API and a Python client |
| Format | CSV, XLSX, GeoJSON |
| API | Yes: CKAN API |
| Licence | Varies by dataset, mostly open |
| Network shape | Not a network. The place to find displacement, needs assessment and population movement tracking data for a specific crisis. |

**Metrics**

- IOM Displacement Tracking Matrix country datasets
- population movement and flow monitoring
- humanitarian needs by admin level
- administrative boundaries and population rasters

**Limitations**

- Quality varies enormously between contributors.
- Crisis datasets are snapshots that stop when the response ends.
- Admin boundary and naming mismatches across datasets from the same country are the normal case, not the exception.

### IOM Displacement Tracking Matrix

IOM. <https://dtm.iom.int/>

| | |
| --- | --- |
| One row is | site, area or flow-monitoring point assessment |
| Coverage | ~90 countries in crisis |
| Years | 2004 onward, country-specific windows |
| Updated | Continuous per operation, from daily to quarterly |
| Access | Open via dtm.iom.int and HDX, with an API |
| Format | CSV, XLSX, API |
| API | Yes |
| Licence | Free with attribution |
| Network shape | Flow monitoring records origin and intended destination at individual-journey level, which yields a real movement network inside crisis corridors. |

**Metrics**

- displaced population by site and admin area
- flow monitoring: travellers per day, origin, intended destination, reason for moving, means of transport
- needs and vulnerabilities per site
- returnee tracking

**Limitations**

- Operational data collected for response, not research. Methods change between rounds within the same country.
- Flow monitoring points cover selected routes; coverage is purposive, not a sample.
- Intended destination is stated intent at one moment on a journey.
- Comparability across countries is poor by design.
