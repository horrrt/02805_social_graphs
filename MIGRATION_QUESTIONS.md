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

## Twenty more we could ask

Candidates for the weekly posts and for the final project. Each one has a *stake*: the thing that could come out the other way. A question with no possible surprise is a description, and the posts on this course that work all have one.

Four fit week 3. Of those, **Are refugees a different network from migrants?** is the one to build: it runs on the files already in `data/`, and the finding is checked in [`analysis/week03_country_facts.json`](analysis/week03_country_facts.json), written by [`analysis/week03_country_networks.py`](analysis/week03_country_networks.py). The 2024 migrant stock network and the 2024 refugee network share only 4 of their top 15 destinations.

One warning that applies to every betweenness question below. On the raw DESA matrix the top brokers come out as Australia, Norway, the USA, Denmark, Greece and China, and mean path length is 1.74. That ranking is measuring statistical reporting systems: register countries name hundreds of tiny origins and survey countries bucket them into 'other'. Threshold the edges at 100,000 people and the ranking becomes the USA, France, Germany, the UK, Russia and DR Congo, with mean path 2.93. Threshold first, and show the sweep.

| Verdict | Count |
| --- | ---: |
| Week 3 | 4 |
| Companion | 8 |
| Later week | 2 |
| Final project | 6 |

### Shape of the country network

**What is left after gravity?**

Fit distance, population, shared language, shared coloniser and contiguity to the migrant stock matrix, then look at the residual network. Which corridors carry far more people than geography and history predict?

- *What is at stake:* The residual could be structureless, in which case migration is geography and nothing else. If it is not, the residual graph is a map of everything gravity leaves out.
- *Null:* The gravity fit itself is the null. Every claim is about the residual.
- *Data:* [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock), [CEPII Gravity and GeoDist databases](MIGRATION_DATA_CATALOGUE.md#cepii-gravity-and-geodist-databases), [CEPII linguistic proximity (Melitz and Toubal)](MIGRATION_DATA_CATALOGUE.md#cepii-linguistic-proximity-melitz-and-toubal)
- *Verdict:* **Final project.** Too heavy for one week. The strongest spine we have for a final project.
- *Denmark:* Denmark's registered emigration lets you fit the model in both directions for one country and see whether the residual is symmetric.

**Is migration concentrating or spreading?**

Eight time points from 1990 to 2024. Track the Gini of edge weights, the top-10 corridor share and the network entropy.

- *What is at stake:* Globalisation predicts spreading. If the corridors are concentrating instead, the standard story is wrong in a measurable way.
- *Null:* A degree-preserving shuffle at each time point, so the trend is not just the degree sequence changing.
- *Data:* [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock)
- *Verdict:* **Companion.** A section inside another post, not a post. Not a centrality question, so it cannot carry week 3 alone. Good opening section for any of the country-network posts.

**Core-periphery, or communities?**

Does the network have one rich core that exchanges with everyone, or distinct regional blocs? Fit both models and report which wins.

- *What is at stake:* Most people assume blocs because Louvain always returns some. Testing the alternative is the whole point.
- *Null:* Compare the two model fits against each other and against a degree-preserving shuffle.
- *Data:* [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock), [CEPII Gravity and GeoDist databases](MIGRATION_DATA_CATALOGUE.md#cepii-gravity-and-geodist-databases)
- *Verdict:* **Later week.** The measure it needs has not been taught yet. Community detection is week 4. Do not spend it early.

**Who exchanges, and who only sends?**

Per country, the share of corridors carrying real flow in both directions. Then predict it from income and rank the countries that defy the prediction.

- *What is at stake:* If reciprocity is simply income, there is no finding. The countries off the line are the story.
- *Null:* A degree-preserving shuffle gives the reciprocity a country's degree sequence forces on it.
- *Data:* [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock), [World Bank World Development Indicators](MIGRATION_DATA_CATALOGUE.md#world-bank-world-development-indicators)
- *Verdict:* **Companion.** A section inside another post, not a post. DESA reciprocity is measured at 0.60 across 8,795 arcs in the 2024 network; see analysis/week03_country_facts.json.
- *Denmark:* Denmark measures emigration rather than estimating it, so its reciprocity is real where most countries' is an artefact.

### Brokers and transit

**Do flight hubs and migration hubs coincide?**

Betweenness on the airport network against betweenness on the migration network. Istanbul, Addis Ababa and Dubai should be high on both.

- *What is at stake:* Where the two rankings diverge is a place that moves people without keeping them, or keeps them without moving them.
- *Null:* Degree-preserving shuffles of both networks, so neither ranking is just its degree sequence.
- *Data:* [OpenSky Network flight data](MIGRATION_DATA_CATALOGUE.md#opensky-network-flight-data), [OpenFlights and OurAirports route data](MIGRATION_DATA_CATALOGUE.md#openflights-and-ourairports-route-data), [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock)
- *Verdict:* **Companion.** A section inside another post, not a post. Inherits the thresholding problem below, and needs a second network downloaded. Do it after the thresholding is shown to work.

**Which country's removal breaks the network?**

Remove countries in order of degree, of betweenness and of refugee hosting, and watch the giant component shrink under each order.

- *What is at stake:* Whether the three orders agree.
- *Null:* Random removal, as the baseline for every robustness curve.
- *Data:* [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock), [UNHCR Refugee Data Finder](MIGRATION_DATA_CATALOGUE.md#unhcr-refugee-data-finder)
- *Verdict:* **Companion.** A section inside another post, not a post. The group already ran node removal in week 2 and was criticised for it not being in that brief. Repeating it now reads as recycling.

**Where does a stock matrix lie about transit?**

Betweenness from DESA against transit prominence in 4Mi route data. Name the countries the stock matrix cannot see.

- *What is at stake:* The size of the gap between where people are counted and where they pass through.
- *Null:* None needed; this is a comparison of two measurements of the same thing.
- *Data:* [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock), [Mixed Migration Centre 4Mi](MIGRATION_DATA_CATALOGUE.md#mixed-migration-centre-4mi), [IOM Displacement Tracking Matrix](MIGRATION_DATA_CATALOGUE.md#iom-displacement-tracking-matrix)
- *Verdict:* **Final project.** Too heavy for one week. Needs 4Mi, which is a purposive sample on selected routes. Handle the sampling honestly or not at all.

### Mobility as inequality

**How much of your mobility is decided at birth?** ★

Closeness centrality on the visa network, one score per passport, against the GDP per capita of the issuing country.

- *What is at stake:* The strength of the relationship. A single scatter plot makes the point better than any paragraph.
- *Null:* Shuffle the visa requirements while preserving each country's count of requirements, and see how much of the inequality survives.
- *Data:* [DEMIG VISA](MIGRATION_DATA_CATALOGUE.md#demig-visa), [Henley Passport Index and Global Passport Power Index](MIGRATION_DATA_CATALOGUE.md#henley-passport-index-and-global-passport-power-index), [World Bank World Development Indicators](MIGRATION_DATA_CATALOGUE.md#world-bank-world-development-indicators)
- *Verdict:* **Week 3.** Fits paths, centrality, mixing and cliques. Pure closeness, section 3 of the brief. One figure, one download. Works as the closing section of a bigger post.

**Did the world get more open between 1973 and 2013?**

Density of the visa-free network over forty years of DEMIG VISA, split into who gained access and who lost it.

- *What is at stake:* The aggregate probably rose while specific nationalities fell. If so, 'the world is opening' is true and misleading at once.
- *Null:* Compare each nationality's trajectory against the global trend.
- *Data:* [DEMIG VISA](MIGRATION_DATA_CATALOGUE.md#demig-visa)
- *Verdict:* **Companion.** A section inside another post, not a post. A time series rather than a centrality, so it supports a post rather than being one.

**Map the mobility hierarchy.**

Keep only asymmetric pairs, where A's citizens need a visa for B and B's do not need one for A. How close is that directed graph to a perfect hierarchy, and who are the anomalies?

- *What is at stake:* A perfect hierarchy would be a total order. Every violation is a pair of countries with a history.
- *Null:* A random tournament with the same number of arcs.
- *Data:* [DEMIG VISA](MIGRATION_DATA_CATALOGUE.md#demig-visa), [Henley Passport Index and Global Passport Power Index](MIGRATION_DATA_CATALOGUE.md#henley-passport-index-and-global-passport-power-index)
- *Verdict:* **Companion.** A section inside another post, not a post. Elegant, and narrower than it first looks.

**Does openness cause migration, or follow it?**

Lagged relationships in both directions between visa liberalisation and corridor growth.

- *What is at stake:* Very likely neither direction is identified. Saying that well is worth more than a fabricated answer.
- *Null:* Placebo lags: if a future liberalisation predicts past migration, the design is broken.
- *Data:* [DEMIG VISA](MIGRATION_DATA_CATALOGUE.md#demig-visa), [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock)
- *Verdict:* **Final project.** Too heavy for one week. A causal question with observational data. Treat with suspicion.

### Forced versus chosen

**Are refugees a different network from migrants?** ★

UNHCR against DESA over the same countries. Degree distribution, clustering, distance decay, assortativity, and the overlap between the two rankings of destinations.

- *What is at stake:* The hypothesis is that refugees go next door and migrants go far. The overlap between the two top-15 destination lists is 4 out of 15: Germany, France, Iran and Turkey. Eleven countries are top-15 for migrants and not refugees, eleven the other way.
- *Null:* A degree-preserving shuffle of each network, plus the distance distribution each one would have under gravity.
- *Data:* [UNHCR Refugee Data Finder](MIGRATION_DATA_CATALOGUE.md#unhcr-refugee-data-finder), [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock), [CEPII Gravity and GeoDist databases](MIGRATION_DATA_CATALOGUE.md#cepii-gravity-and-geodist-databases)
- *Verdict:* **Week 3.** Fits paths, centrality, mixing and cliques. The recommended week 3 post. Covers brief sections 3 to 7, runs entirely on files already in data/, and the finding is verified in analysis/week03_country_facts.json.

**Who hosts more refugees than their wealth predicts?**

Regress hosting on GDP and population, then rank the residuals.

- *What is at stake:* The answer contradicts most political rhetoric about who carries the burden, which is exactly why it is worth publishing.
- *Null:* The regression is the null; the residual is the result.
- *Data:* [UNHCR Refugee Data Finder](MIGRATION_DATA_CATALOGUE.md#unhcr-refugee-data-finder), [World Bank World Development Indicators](MIGRATION_DATA_CATALOGUE.md#world-bank-world-development-indicators)
- *Verdict:* **Companion.** A section inside another post, not a post. Node attributes rather than network structure, so it belongs inside a post rather than being one.

**Does a new conflict create a new edge, and how fast?**

Conflict onset in ACLED against the appearance of a refugee corridor in UNHCR. Measure the lag.

- *What is at stake:* Whether the lag is weeks or years, and whether it depends on distance.
- *Null:* Country pairs with no conflict onset, over the same window.
- *Data:* [ACLED and UCDP conflict event data](MIGRATION_DATA_CATALOGUE.md#acled-and-ucdp-conflict-event-data), [UNHCR Refugee Data Finder](MIGRATION_DATA_CATALOGUE.md#unhcr-refugee-data-finder), [UNHCR Operational Data Portal](MIGRATION_DATA_CATALOGUE.md#unhcr-operational-data-portal)
- *Verdict:* **Final project.** Too heavy for one week. UNHCR's annual series is too coarse for the lag; the operational portal is the daily version and only covers active emergencies.

**Do displacement corridors close again?**

After a conflict ends, which refugee edges reverse and which become permanent migration?

- *What is at stake:* Whether displacement is a shock the network absorbs or a shock that rewires it.
- *Null:* Corridors of the same size that never carried refugees.
- *Data:* [UNHCR Refugee Data Finder](MIGRATION_DATA_CATALOGUE.md#unhcr-refugee-data-finder), [UN DESA International Migrant Stock](MIGRATION_DATA_CATALOGUE.md#un-desa-international-migrant-stock)
- *Verdict:* **Final project.** Too heavy for one week. Needs the UNHCR time series, not the single year now in data/.

### The organisation network

**Is the migration NGO world global, or a pile of national ones?** ★

Attribute assortativity by country on the organisation link network, tested against a shuffle of the country labels.

- *What is at stake:* If organisations link overwhelmingly within their own country, 'global migration governance' is a claim the network does not support. The handful of bodies that do bridge become the finding.
- *Null:* Shuffle the country labels across nodes rather than shuffling the links. This is the right null for homophily and it is exercise 3.9 in the brief.
- *Data:* [Wikipedia and Wikidata migration organisations (this repo)](MIGRATION_DATA_CATALOGUE.md#wikipedia-and-wikidata-migration-organisations-this-repo)
- *Verdict:* **Week 3.** Fits paths, centrality, mixing and cliques. Best coverage of the brief: assortativity in section 7, cliques in section 8, centrality in sections 3 to 5, and it uses our own harvested dataset. Blocked until the Wikidata classification stage runs over the 20,849 crawled candidates.
- *Denmark:* CVR holds every registered Danish organisation, not only the ones Wikipedia found notable, so the Danish slice can be checked against a complete population.

**Who brokers between aid and enforcement?** ★

Label organisations humanitarian, advocacy, border enforcement or research, then find the nodes with high betweenness between the enforcement cluster and the aid cluster.

- *What is at stake:* Whether the two worlds touch at all, and through whom.
- *Null:* A degree-preserving shuffle, so a broker is not just a hub.
- *Data:* [Wikipedia and Wikidata migration organisations (this repo)](MIGRATION_DATA_CATALOGUE.md#wikipedia-and-wikidata-migration-organisations-this-repo)
- *Verdict:* **Week 3.** Fits paths, centrality, mixing and cliques. Shares a pipeline with the question above and makes a natural second section of the same post.

**When was this field built?**

Founding dates of migration organisations against the crises that preceded them. Do organisations appear after shocks, and how long after?

- *What is at stake:* A visible lag would mean the organisational field is reactive. No lag would mean something else entirely.
- *Null:* Founding dates of organisations in an unrelated domain over the same period.
- *Data:* [Wikipedia and Wikidata migration organisations (this repo)](MIGRATION_DATA_CATALOGUE.md#wikipedia-and-wikidata-migration-organisations-this-repo)
- *Verdict:* **Companion.** A section inside another post, not a post. Wikidata P571 is already harvested for every organisation.

**Attention against money.**

Wikipedia language editions and pageviews per organisation, against the funding it actually receives in OCHA FTS.

- *What is at stake:* The organisations with money and no attention, and with attention and no money, are both stories.
- *Null:* The relationship you would expect if attention simply tracked size.
- *Data:* [Wikipedia and Wikidata migration organisations (this repo)](MIGRATION_DATA_CATALOGUE.md#wikipedia-and-wikidata-migration-organisations-this-repo), [UN OCHA Financial Tracking Service](MIGRATION_DATA_CATALOGUE.md#un-ocha-financial-tracking-service), [Wikimedia Clickstream and Pageviews](MIGRATION_DATA_CATALOGUE.md#wikimedia-clickstream-and-pageviews)
- *Verdict:* **Final project.** Too heavy for one week. Needs FTS organisation names reconciled against Wikidata items, which is the entity-resolution job that makes it a project rather than a week.

### Language, for weeks 5 to 8

**Do border agencies and refugee charities describe the same thing?**

TF-IDF over the Wikipedia article of every organisation, grouped by organisation type. Then the week 8 move: do the communities in the link network also share vocabulary?

- *What is at stake:* If the vocabularies barely overlap, the migration field does not share a language, and that becomes measurable instead of asserted.
- *Null:* Shuffle the type labels across articles and recompute the vocabulary separation.
- *Data:* [Wikipedia and Wikidata migration organisations (this repo)](MIGRATION_DATA_CATALOGUE.md#wikipedia-and-wikidata-migration-organisations-this-repo), [Folketinget Open Data (oda.ft.dk)](MIGRATION_DATA_CATALOGUE.md#folketinget-open-data-odaftdk)
- *Verdict:* **Later week.** The measure it needs has not been taught yet. Weeks 5 to 8. Folketinget gives a Danish-language parliamentary corpus for the same question in a single country.

## How to read the catalogue

Every entry says what one row is, because that decides whether a source is a network or a table of country attributes. Sources marked *checked* were pulled and counted here; the rest are written from prior knowledge and should be confirmed against the publisher before a number from them goes anywhere.

The list lives in [`scripts/migration/sources.py`](scripts/migration/sources.py) and both documents are generated from it by [`scripts/migration/render_catalogue.py`](scripts/migration/render_catalogue.py). Edit the Python, not the Markdown.

*Log-Log Legends: Àngela Buxó, Gyula Kürthy, Niklas Johansen.*
