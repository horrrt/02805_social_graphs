# Four questions about global migration, and the data each one needs

Working notes from the 02805 Social Graphs and Interactions project at DTU, September 2026. We moved the project off the shared Marvel graph and onto global migration, and these are the four questions we want to answer with network measures.

The point of this page is the traps. Each of the four questions has a plausible wrong answer that falls straight out of the standard dataset without complaining. Knowing which dataset answers which question turned out to be most of the work, so we wrote it down.

The full reference, with 82 sources and their limitations, is in [MIGRATION_DATA_CATALOGUE.md](MIGRATION_DATA_CATALOGUE.md). Every source named below links into it.

## What a network of migration even is

Two different graphs get called the migration network, and they answer different questions.

The **country network** has one node per country and an arc from A to B weighted by how many people born in A now live in B. The UN's International Migrant Stock is the canonical version: 232 destinations, 238 origins, measured every five years since 1990. It is a stock, so it counts who is there now, not who moved this year.

The **organisation network** has one node per body that works on migration: UNHCR, the Danish Refugee Council, a national border agency, a Polish cultural institute in London. We harvest ours from Wikipedia and Wikidata, with an arc from A to B when A's article links to B's. An article link is not a relationship, which is a limitation we carry on every claim.

Most of what follows is about the country network, because three of the four questions are about countries.

## Closeness centrality

> How easy is it to get to a country if you want to migrate there?

**The trap.** Closeness on the migrant stock network answers a different question: how connected a country already is to the world's migrant population. That is an outcome of past ease, not current ease, and it is circular. The United States would score as the easiest country on earth to migrate to.

**What the edges have to be.** Edge weight has to be the cost or difficulty of moving A -> B, not the number of people who already did. Closeness then reads as 'how near is this country to everyone who might want to come'.

**What to use**

- [**DEMIG VISA**](MIGRATION_DATA_CATALOGUE.md#demig-visa) — 237 nationalities by 214 destinations, visa required or not, every year from 1973 to 2013. The longest mobility-rights network anyone has assembled.
- [**Henley Passport Index and Global Passport Power Index**](MIGRATION_DATA_CATALOGUE.md#henley-passport-index-and-global-passport-power-index) — The current-day successor, if you can live with the pair matrix being commercial.
- [**Schengen visa statistics by consulate and nationality**](MIGRATION_DATA_CATALOGUE.md#schengen-visa-statistics-by-consulate-and-nationality) — Applications, issuances and refusal rates by consulate and applicant nationality. The refusal rate is the honest edge weight: a binary 'visa required' gives every visa-needing nationality the same score, while the published refusal rates run from a few per cent to over half depending on the nationality and the consulate.
- [**Lowy Institute Global Diplomacy Index**](MIGRATION_DATA_CATALOGUE.md#lowy-institute-global-diplomacy-index) — Where each country keeps consulates. If you have to fly to a third country to lodge an application, that is part of the difficulty and nothing else measures it.
- [**CEPII Gravity and GeoDist databases**](MIGRATION_DATA_CATALOGUE.md#cepii-gravity-and-geodist-databases) — Distance, contiguity, shared language, shared coloniser, as a complete pair matrix. The baseline any difficulty score has to beat.

**Worth having**

- [Global friction surface and travel time to cities](MIGRATION_DATA_CATALOGUE.md#global-friction-surface-and-travel-time-to-cities) — A global 1 km surface of how fast you can move over ground. Least-cost paths across it give real land travel times, which is what ease of access means when there is no flight.
- [Mixed Migration Centre 4Mi](MIGRATION_DATA_CATALOGUE.md#mixed-migration-centre-4mi) — What people actually paid and how long it actually took, reported by people on the route.
- [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock) — The realised flows, for validating a difficulty score rather than building it.

Also relevant: [MIPEX, Migrant Integration Policy Index](MIGRATION_DATA_CATALOGUE.md#mipex-migrant-integration-policy-index), [IMPIC, Immigration Policies in Comparison](MIGRATION_DATA_CATALOGUE.md#impic-immigration-policies-in-comparison), [GLOBALCIT citizenship law datasets](MIGRATION_DATA_CATALOGUE.md#globalcit-citizenship-law-datasets), [OpenFlights and OurAirports route data](MIGRATION_DATA_CATALOGUE.md#openflights-and-ourairports-route-data), [OpenSky Network flight data](MIGRATION_DATA_CATALOGUE.md#opensky-network-flight-data), [Abel and Cohen estimated bilateral migration flows](MIGRATION_DATA_CATALOGUE.md#abel-and-cohen-estimated-bilateral-migration-flows).

**What is missing.** There is no global dataset of visa refusal rates. Schengen publishes them by consulate and nationality and almost nobody else does, so a worldwide difficulty-weighted network has to use the binary visa requirement outside Europe and say so. Work and study permit rules are national and largely unpublished in structured form.

## Betweenness centrality

> Which countries or cities are migration and transportation hubs or bridges?

**The trap.** A migrant stock matrix records where people live, not how they got there. Somebody who went Syria -> Turkey -> Germany appears as a Syria-born resident of Germany, and Turkey is nowhere on that edge. Betweenness on the stock matrix is close to meaningless: the matrix is so dense that shortest paths are almost all length one, and the betweenness you compute is an artefact of which cells DESA left blank.

**What the edges have to be.** You need journeys, not residence. An edge should be a leg of a trip: A -> T -> B, so that T can sit on a path. Transport networks give the legs; route surveys give the itineraries.

**What to use**

- [**Mixed Migration Centre 4Mi**](MIGRATION_DATA_CATALOGUE.md#mixed-migration-centre-4mi) — Interviews with people mid-journey: every transit country, the cost paid, the duration, and whether the intended destination changed on the way. It records the middle of a trip, which almost nothing else does.
- [**IOM Displacement Tracking Matrix**](MIGRATION_DATA_CATALOGUE.md#iom-displacement-tracking-matrix) — Flow monitoring points log origin and intended destination at a waypoint, at city resolution, in the countries with an active operation.
- [**OpenFlights and OurAirports route data**](MIGRATION_DATA_CATALOGUE.md#openflights-and-ourairports-route-data) — Free airport-pair route network with coordinates, and frozen around 2014, so betweenness on it describes 2014.
- [**OpenSky Network flight data**](MIGRATION_DATA_CATALOGUE.md#opensky-network-flight-data) — Every flight from 2019 onward, free for research. Airport-pair counts per day, which is both the transport network and the COVID event study in one file.
- [**GaWC world city network**](MIGRATION_DATA_CATALOGUE.md#gawc-world-city-network) — An inter-city network that already exists. Also a useful foil: Istanbul, Nairobi and Tijuana are migration hubs and corporate backwaters, so a gap between the two rankings is itself the finding.

**Worth having**

- [Eurostat asylum applications and decisions](MIGRATION_DATA_CATALOGUE.md#eurostat-asylum-applications-and-decisions) — Dublin transfer requests are documented secondary movement inside Europe: a rare recorded second leg.
- [City-level foreign-born population](MIGRATION_DATA_CATALOGUE.md#city-level-foreign-born-population) — Node attributes on cities. There is no global city-to-city matrix, so this is the closest thing until you build one from census microdata.
- [IPUMS International](MIGRATION_DATA_CATALOGUE.md#ipums-international) — The only route to a real city-to-city matrix, for the countries whose censuses record city of residence and country of birth together.
- [IMF PortWatch](MIGRATION_DATA_CATALOGUE.md#imf-portwatch) — The maritime version of the same question.

Also relevant: [UNHCR Operational Data Portal](MIGRATION_DATA_CATALOGUE.md#unhcr-operational-data-portal), [Frontex detections of illegal border crossings](MIGRATION_DATA_CATALOGUE.md#frontex-detections-of-illegal-border-crossings), [Global Detention Project database](MIGRATION_DATA_CATALOGUE.md#global-detention-project-database), [UN Comtrade and CEPII BACI bilateral trade](MIGRATION_DATA_CATALOGUE.md#un-comtrade-and-cepii-baci-bilateral-trade), [Global friction surface and travel time to cities](MIGRATION_DATA_CATALOGUE.md#global-friction-surface-and-travel-time-to-cities).

**What is missing.** There is no global city-to-city migration matrix. IPUMS International can build one for the countries whose censuses record city of residence and country of birth, and that is the only route to it. For transit specifically, 4Mi and DTM flow monitoring are the only sources that record the middle of a journey, and both are purposive samples on selected routes.

## Cliques and communities

> Which countries or regions have migration running between all members, above some threshold?

**The trap.** You will find the EU, the Nordic countries, the Gulf, ECOWAS, the anglophone settler states and the former Soviet republics. Every one of those is a legal free movement zone, a colonial residue or a language bloc, so the clique itself is not a finding. The finding is whichever clique survives after conditioning on free movement, shared language, shared coloniser and distance.

**What the edges have to be.** Thresholded mutual migration: keep the pair if the stock in both directions clears a floor, then look for complete subgraphs. The threshold choice is the analysis, so report several.

**What to use**

- [**UN DESA International Migrant Stock**](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock) — Both directions of every pair, so mutual edges above a threshold are computable directly. Ragged, though.
- [**Abel and Cohen estimated bilateral migration flows**](MIGRATION_DATA_CATALOGUE.md#abel-and-cohen-estimated-bilateral-migration-flows) — A complete matrix, which is what a clique search needs. Estimates, so report which of the six methods you used.
- [**Free movement protocols and regional mobility agreements**](MIGRATION_DATA_CATALOGUE.md#free-movement-protocols-and-regional-mobility-agreements) — EU and EEA, the Nordic Passport Union, ECOWAS, the East African Community, CARICOM, MERCOSUR residence, the GCC, the Trans-Tasman arrangement, the Common Travel Area. Assemble it by hand; no single register exists.
- [**CEPII Gravity and GeoDist databases**](MIGRATION_DATA_CATALOGUE.md#cepii-gravity-and-geodist-databases) — Shared coloniser and contiguity explain most of what is left after free movement.
- [**CEPII linguistic proximity (Melitz and Toubal)**](MIGRATION_DATA_CATALOGUE.md#cepii-linguistic-proximity-melitz-and-toubal) — Common native and spoken language probabilities, which is the other half of the explanation.

**Worth having**

- [KNOMAD / World Bank Bilateral Migration Matrix](MIGRATION_DATA_CATALOGUE.md#knomad--world-bank-bilateral-migration-matrix) — The other completed matrix, for checking that the cliques are not an artefact of one completion method.
- [Correlates of War Intergovernmental Organizations dataset](MIGRATION_DATA_CATALOGUE.md#correlates-of-war-intergovernmental-organizations-dataset) — Country by organisation by year, projecting to a co-membership network. The obvious alternative story for any bloc you find.
- [UN Treaty Collection ratification status](MIGRATION_DATA_CATALOGUE.md#un-treaty-collection-ratification-status) — Refugee Convention, its Protocol and the Migrant Workers Convention. Ratification blocs and migration blocs are different shapes, which is worth showing.
- [UN General Assembly voting data](MIGRATION_DATA_CATALOGUE.md#un-general-assembly-voting-data) — Tells you whether a migration clique is also a political bloc, or whether it crosses one.

Also relevant: [UN Comtrade and CEPII BACI bilateral trade](MIGRATION_DATA_CATALOGUE.md#un-comtrade-and-cepii-baci-bilateral-trade), [OECD International Migration Database](MIGRATION_DATA_CATALOGUE.md#oecd-international-migration-database), [Eurostat migration and citizenship statistics](MIGRATION_DATA_CATALOGUE.md#eurostat-migration-and-citizenship-statistics), [KNOMAD bilateral remittance matrix](MIGRATION_DATA_CATALOGUE.md#knomad-bilateral-remittance-matrix).

**What is missing.** The DESA matrix is ragged, and a clique needs every pair present. A country that reports its origins coarsely cannot be in a clique no matter how it behaves, so the ragged matrix will hand you a tidy European answer for a reporting reason. Use a completed matrix (Abel and Cohen, or KNOMAD) for the clique search and DESA only to check it. There is also no single maintained register of free movement agreements, so the control variable has to be assembled by hand.

## Shocks and event studies

> What did COVID, a Strait of Hormuz closure, or a change of US administration do to the network?

**The trap.** Every core migration dataset is annual at best and five-yearly at worst. DESA cannot see COVID: its 2020 and 2024 points straddle the whole thing. Any claim about a shock has to come from a different family of data, and mixing a high-frequency shock measure with an annual outcome will produce a null result that means nothing.

**What the edges have to be.** Whatever the edge is, it has to be observed monthly or faster. The unit of analysis is the pair-month, and the design is a before-and-after on the treated pairs against untreated ones.

**What to use**

- [**Oxford COVID-19 Government Response Tracker**](MIGRATION_DATA_CATALOGUE.md#oxford-covid-19-government-response-tracker) — Daily international travel controls for 180+ countries, January 2020 to December 2022. One ordinal per country, so it cannot say who was banned, only how hard.
- [**IOM COVID-19 travel and mobility restrictions**](MIGRATION_DATA_CATALOGUE.md#iom-covid-19-travel-and-mobility-restrictions) — Which nationalities each country actually barred. This is what makes the COVID border regime a bilateral network instead of a single index, and it is the reason to prefer it over the stringency score.
- [**OpenSky Network flight data**](MIGRATION_DATA_CATALOGUE.md#opensky-network-flight-data) — The collapse and the recovery, edge by edge, at daily resolution. No survey and no register can show that.
- [**US monthly immigrant and nonimmigrant visa issuance statistics**](MIGRATION_DATA_CATALOGUE.md#us-monthly-immigrant-and-nonimmigrant-visa-issuance-statistics) — Monthly, by nationality and by issuing consulate. The sharpest instrument for a travel ban: it dates the effect to the month and separates the banned nationalities from the rest.
- [**Eurostat asylum applications and decisions**](MIGRATION_DATA_CATALOGUE.md#eurostat-asylum-applications-and-decisions) — Monthly applications by origin and destination. The highest-frequency bilateral migration series that exists anywhere.
- [**IMF PortWatch**](MIGRATION_DATA_CATALOGUE.md#imf-portwatch) — Daily transits through the Strait of Hormuz, Bab el-Mandeb, Suez and Panama, from 2019. Free, and built for exactly this kind of event study.

**Worth having**

- [US Refugee Processing Center arrivals (WRAPS)](MIGRATION_DATA_CATALOGUE.md#us-refugee-processing-center-arrivals-wraps) — Monthly US refugee arrivals by nationality. Moves within weeks of a change in the admissions ceiling.
- [US DHS Office of Immigration Statistics yearbook](MIGRATION_DATA_CATALOGUE.md#us-dhs-office-of-immigration-statistics-yearbook) — Monthly CBP encounters, for the US southern border.
- [Google Trends migration search interest](MIGRATION_DATA_CATALOGUE.md#google-trends-migration-search-interest) — Search interest moves weeks before the movement does, which is how the nowcasting literature spots a shock early.
- [ACLED and UCDP conflict event data](MIGRATION_DATA_CATALOGUE.md#acled-and-ucdp-conflict-event-data) — The conflict side of a chokepoint crisis, geolocated and weekly.

Also relevant: [UNHCR Operational Data Portal](MIGRATION_DATA_CATALOGUE.md#unhcr-operational-data-portal), [IDMC Global Internal Displacement Database](MIGRATION_DATA_CATALOGUE.md#idmc-global-internal-displacement-database), [Frontex detections of illegal border crossings](MIGRATION_DATA_CATALOGUE.md#frontex-detections-of-illegal-border-crossings), [UN Comtrade and CEPII BACI bilateral trade](MIGRATION_DATA_CATALOGUE.md#un-comtrade-and-cepii-baci-bilateral-trade), [IOM Missing Migrants Project](MIGRATION_DATA_CATALOGUE.md#iom-missing-migrants-project), [Migration Policy Institute Data Hub](MIGRATION_DATA_CATALOGUE.md#migration-policy-institute-data-hub).

**What is missing.** No maintained global migration policy event database exists after 2013, when DEMIG POLICY stopped. Dating a policy change worldwide means hand-coding from MPI, national gazettes and news. For the Strait of Hormuz the migration effect is indirect: PortWatch shows the trade shock daily, ACLED shows the conflict, and the migration response appears months later in Gulf labour-permit statistics that mostly are not published.

## How to read the catalogue

Every entry says what one row is, because that decides whether a source is a network or a table of country attributes. Sources marked *checked* were pulled and counted here; the rest are written from prior knowledge and should be confirmed against the publisher before a number from them goes anywhere.

The list lives in [`scripts/migration/sources.py`](scripts/migration/sources.py) and both documents are generated from it by [`scripts/migration/render_catalogue.py`](scripts/migration/render_catalogue.py). Edit the Python, not the Markdown.

*Log-Log Legends: Àngela Buxó, Gyula Kürthy, Niklas Johansen.*
