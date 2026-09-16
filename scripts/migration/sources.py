"""Catalogue of global migration data sources.

One entry per source. `render_catalogue.py` turns this into
MIGRATION_DATA_CATALOGUE.md and data/migration_sources.tsv, so the prose and
the machine-readable index can never drift apart.

Field notes:
  unit        what one row is. This decides whether the source is a network.
  network     the graph it yields, or "node attributes only".
  metrics     the variables worth having, not the full column list.
  limits      what will bite you. Written to be read before the download.
  checked     "fetched <date>" only where this repo actually pulled the source
              and counted rows. Everything else is from prior knowledge and
              should be confirmed against the publisher before being cited.
"""

FAMILIES = [
    ("bilateral", "Bilateral stocks and flows",
     "Country-to-country matrices. These are the ones that are already networks."),
    ("displacement", "Forced displacement",
     "Refugees, asylum seekers, internally displaced and stateless people."),
    ("asylum", "Asylum and border administration",
     "What states record at the counter: applications, decisions, crossings, removals."),
    ("policy", "Policy, law and rights",
     "Country-level indices. Node attributes, and the usual dependent variables."),
    ("mobility", "Mobility rights and visa networks",
     "Who may enter whose territory. Dense directed networks, independent of who moves."),
    ("gravity", "Explaining the edges",
     "Distance, language, colonial history, treaties and free movement. The covariates "
     "that turn a migration network into a model, and the only honest way to answer "
     "'compared to what' on a clique."),
    ("competing", "Other global networks",
     "Trade, flights, diplomacy, shipping, attention. The comparison set for any claim "
     "that migration structure is special, and the transport layer the hub question "
     "actually needs."),
    ("irregular", "Irregular migration, deaths and trafficking",
     "The part of the phenomenon that no register counts properly."),
    ("money", "Remittances and labour",
     "Money moving against the direction of people."),
    ("micro", "Survey and census microdata",
     "Individual records. Where mechanism lives, at the cost of harmonisation work."),
    ("digital", "Digital trace and estimated data",
     "Platform and model output. High frequency, uncertain denominator."),
    ("events", "High-frequency and event data",
     "Daily to monthly series. The only family that can see COVID, a chokepoint "
     "closure or a travel ban."),
    ("cities", "City and subnational",
     "Below the country. Thin, fragmented, and unavoidable if the question says "
     "'cities'."),
    ("context", "Drivers and denominators",
     "Population, regime, climate, internal migration. What makes people leave and "
     "what you divide by."),
    ("actors", "Actors, organisations and events",
     "Who does migration policy and aid, and what happens. The layer this repo harvests."),
    ("denmark", "Denmark",
     "A register country with an open API. Everything the global sources do badly, "
     "Denmark does weekly, by municipality, in both directions."),
    ("history", "Historical",
     "Long series, for anything that needs more than thirty years."),
    ("portal", "Portals and aggregators",
     "Where to look when nothing above fits."),
]

SOURCES = [
    # ------------------------------------------------------------------ bilateral
    dict(
        id="undesa-ims",
        name="UN DESA International Migrant Stock",
        publisher="UN Department of Economic and Social Affairs, Population Division",
        family="bilateral",
        unit="origin country x destination country x year x sex",
        coverage="Every country and area with data; 232 destinations, 238 origins",
        years="1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024 (Rev. 2024)",
        cadence="Roughly every five years; Rev. 2024 published late 2024",
        access="Direct XLSX download, no registration",
        fmt="XLSX, one sheet per table, ~6 MB",
        api="No",
        licence="UN terms of use; free with attribution",
        network="Weighted directed: origin -> destination, weight = migrant stock. "
                "The canonical global migration network.",
        metrics=[
            "migrant stock by origin and destination, both sexes and split",
            "stock as share of destination population",
            "median age of the migrant population",
            "refugees as a share of the international migrant stock",
        ],
        limits=[
            "Stock, not flow. A stock difference is not a flow: it nets out return "
            "migration, onward migration and deaths.",
            "Definition is country of birth for most countries and country of "
            "citizenship for the rest. The two are not the same population.",
            "Reporting granularity varies by destination, and it varies in a way "
            "that correlates with wealth. In Rev. 2024 Table 1 the United States "
            "reports 58 named origin countries while Denmark reports 202, because "
            "the US source is a survey with an 'other' category and Denmark's is a "
            "population register. Any centrality computed on the raw matrix will "
            "understate large survey-based destinations.",
            "Interpolated and modelled where censuses are missing; the workbook does "
            "not flag which cells are estimates.",
            "Country set changes over time (South Sudan, Serbia and Montenegro).",
        ],
        url="https://www.un.org/development/desa/pd/content/international-migrant-stock",
        checked="fetched 2026-09-16: Table 1 has 28,030 data rows, of which 9,098 are "
                "country-to-country pairs after dropping regional and income-group "
                "aggregates; 6,787 of those have a non-zero 2024 stock.",
    ),
    dict(
        id="undesa-flows",
        name="UN DESA International Migration Flows",
        publisher="UN DESA Population Division",
        family="bilateral",
        unit="origin country x destination country x year, inflows and outflows",
        coverage="45 countries that report flow statistics",
        years="1980 to 2020 depending on reporter",
        cadence="Irregular; 2015 revision is the widely used one",
        access="XLSX download",
        fmt="XLSX",
        api="No",
        licence="UN terms of use",
        network="Weighted directed flows, but only between the reporting subset",
        metrics=["inflows by country of citizenship or birth",
                 "outflows", "net flow", "reporting basis per country"],
        limits=[
            "Only 45 reporters, heavily European. Africa and most of Asia are absent, "
            "so a network built from it is a network of rich-country statistical "
            "offices.",
            "Inflow reported by A from B rarely matches outflow reported by B to A. "
            "Mirror statistics disagree by factors, not percentages.",
            "Mixed definitions: citizenship, birth, and duration-of-stay thresholds "
            "differ across reporters.",
        ],
        url="https://www.un.org/development/desa/pd/content/international-migration-flows",
        checked="not fetched",
    ),
    dict(
        id="abel-cohen",
        name="Abel and Cohen estimated bilateral migration flows",
        publisher="Guy Abel and Joel Cohen (Scientific Data, 2019; updates to 2022)",
        family="bilateral",
        unit="origin x destination x five-year period",
        coverage="~200 countries, full matrix",
        years="1990-1995 through 2015-2020",
        cadence="Updated when a new DESA stock revision lands",
        access="Open data with the paper; R package migest",
        fmt="CSV; R package",
        api="No",
        licence="CC BY",
        network="Weighted directed flow network, complete and symmetric in coverage. "
                "This is usually the better network than the raw DESA stocks.",
        metrics=["estimated flow under six different demographic accounting methods",
                 "net migration implied by each method"],
        limits=[
            "Estimates, not observations. The six methods disagree with each other "
            "by a lot, and the choice of method changes which countries look central.",
            "Inherits every problem in the DESA stock matrix it is derived from.",
            "Five-year periods only. No annual series, no seasonality.",
            "Cannot see circular or repeat migration by construction.",
        ],
        url="https://www.nature.com/articles/sdata201882",
        checked="not fetched",
    ),
    dict(
        id="wb-gbmd",
        name="World Bank Global Bilateral Migration Database",
        publisher="World Bank (Ozden, Parsons, Schiff, Walmsley)",
        family="bilateral",
        unit="origin x destination x decade x gender",
        coverage="226 countries, complete matrix",
        years="1960, 1970, 1980, 1990, 2000",
        cadence="Static; superseded for recent years by the KNOMAD matrix",
        access="World Bank data catalog download",
        fmt="CSV / XLSX",
        api="No",
        licence="CC BY 4.0",
        network="Weighted directed, complete. The only full matrix reaching back to 1960.",
        metrics=["bilateral migrant stock by decade", "gender split"],
        limits=[
            "Ends at 2000. Useless for anything contemporary.",
            "Built by filling census gaps with a gravity model, so a large share of "
            "cells are modelled rather than counted.",
            "Historical country boundaries mapped onto modern ones, which invents "
            "continuity across the Soviet and Yugoslav dissolutions.",
        ],
        url="https://datacatalog.worldbank.org/search/dataset/0044054",
        checked="not fetched",
    ),
    dict(
        id="knomad-matrix",
        name="KNOMAD / World Bank Bilateral Migration Matrix",
        publisher="KNOMAD, World Bank",
        family="bilateral",
        unit="origin x destination stock, single year",
        coverage="214 countries, complete matrix",
        years="2010, 2013, 2017, 2018, 2021, 2024 editions",
        cadence="Every few years alongside the Migration and Development Brief",
        access="XLSX from knomad.org; the direct file URLs move between editions",
        fmt="XLSX, square matrix layout",
        api="No",
        licence="CC BY",
        network="Weighted directed, complete. Easier to load than DESA because it is "
                "already a square matrix with no aggregate rows.",
        metrics=["bilateral migrant stock", "paired with the bilateral remittance matrix"],
        limits=[
            "Derived from DESA plus modelling to fill the cells DESA leaves blank. "
            "The completeness is partly manufactured.",
            "Single year per edition, no time series inside one file.",
            "Publication URLs are unstable; link rot between editions is normal.",
        ],
        url="https://www.knomad.org/data/migration/emigration",
        checked="probed 2026-09-16: guessed direct file URLs return 302 redirects; "
                "the landing page is the reliable entry point.",
    ),
    dict(
        id="oecd-imd",
        name="OECD International Migration Database",
        publisher="OECD",
        family="bilateral",
        unit="destination x origin x year, inflows, outflows, stocks, acquisitions",
        coverage="38 OECD members plus a few partners",
        years="1980 onward, varies by series",
        cadence="Annual, with the International Migration Outlook",
        access="OECD Data Explorer, bulk CSV, SDMX",
        fmt="CSV, SDMX-JSON",
        api="Yes, SDMX",
        licence="OECD terms; free for non-commercial use",
        network="Weighted directed, but only into OECD destinations. A star with 38 hubs.",
        metrics=["inflows of foreign population by nationality",
                 "stock of foreign-born and foreign population",
                 "acquisitions of citizenship", "asylum applications",
                 "inflows of foreign workers by permit type"],
        limits=[
            "Destination side is OECD only. Every south-south corridor is invisible, "
            "and those are roughly half of world migration.",
            "Permit-based counts measure administrative events, not people. One person "
            "can generate several permits in a year.",
            "Series breaks when a country changes its register rules, and the breaks "
            "are documented in footnotes rather than in the data.",
        ],
        url="https://www.oecd.org/en/data/datasets/oecd-international-migration-database.html",
        checked="not fetched",
    ),
    dict(
        id="oecd-dioc",
        name="OECD Database on Immigrants in OECD Countries (DIOC)",
        publisher="OECD",
        family="bilateral",
        unit="destination x origin x sex x age x education x labour status",
        coverage="OECD destinations, ~200 origins",
        years="2000/01, 2005/06, 2010/11, 2015/16, 2020/21 rounds",
        cadence="Every five years, census-round based",
        access="XLSX / CSV download",
        fmt="CSV, XLSX",
        api="No",
        licence="OECD terms",
        network="Weighted directed, and the only one that splits the edge by skill. "
                "Lets you build a separate high-skilled migration network.",
        metrics=["migrant stock by educational attainment",
                 "emigration rate of the tertiary educated (brain drain rate)",
                 "labour force status", "occupation", "duration of stay",
                 "field of study (DIOC-E extension)"],
        limits=[
            "Census rounds, so five-year granularity and a two to four year lag "
            "before release.",
            "Education coded from national categories into ISCED, which flattens real "
            "differences in what a qualification means.",
            "Small origin-destination-education cells are suppressed or unreliable; "
            "the matrix is sparse where it matters most for small countries.",
        ],
        url="https://www.oecd.org/en/data/datasets/database-on-immigrants-in-oecd-countries.html",
        checked="not fetched",
    ),
    dict(
        id="eurostat-migr",
        name="Eurostat migration and citizenship statistics",
        publisher="Eurostat",
        family="bilateral",
        unit="reporting country x country of citizenship or previous residence x year",
        coverage="EU27, EFTA, candidate countries",
        years="2008 onward under Regulation 862/2007; some series to 1998",
        cadence="Annual, with monthly asylum series",
        access="Eurostat database, bulk download, REST API",
        fmt="TSV, SDMX, JSON",
        api="Yes, free and documented",
        licence="Reuse permitted with attribution",
        network="Weighted directed into European destinations. The best-harmonised "
                "regional migration network that exists.",
        metrics=["immigration and emigration by citizenship, age and sex (migr_imm, migr_emi)",
                 "usually resident population by citizenship and birth country",
                 "acquisitions of citizenship", "residence permits by reason",
                 "asylum applications and decisions, monthly",
                 "returns of third-country nationals"],
        limits=[
            "Europe only.",
            "Emigration is undercounted everywhere. People leave without telling the "
            "register, so a corridor A->B measured by A's emigration and by B's "
            "immigration will not agree, and B is usually closer to right.",
            "The twelve-month duration rule is applied differently across members "
            "despite the regulation.",
            "Confidentiality flags blank out small cells, which removes exactly the "
            "small corridors that would make a network interesting.",
        ],
        url="https://ec.europa.eu/eurostat/web/migration-asylum/migration/database",
        checked="not fetched",
    ),
    dict(
        id="imem",
        name="IMEM and QuantMig estimated European flows",
        publisher="Raymer, Wisniowski et al.; QuantMig consortium (Horizon 2020)",
        family="bilateral",
        unit="origin x destination x year, Bayesian posterior",
        coverage="31 European countries",
        years="IMEM 2002-2008; QuantMig extends to 2019",
        cadence="Project output, not a maintained series",
        access="Project sites and supplementary data",
        fmt="CSV, R objects",
        api="No",
        licence="Varies by release, generally open",
        network="Weighted directed with credible intervals on every edge. The only "
                "migration network that ships uncertainty per edge.",
        metrics=["posterior mean flow", "95% credible interval",
                 "undercount and definition adjustment factors per reporter"],
        limits=[
            "Europe only, and a fixed country set.",
            "Model output. The intervals are wide enough that many rank orderings of "
            "countries are not identified.",
            "Not updated on a schedule; treat as a research dataset, not a series.",
        ],
        url="https://www.quantmig.eu/data_and_estimates/",
        checked="not fetched",
    ),

    # --------------------------------------------------------------- displacement
    dict(
        id="unhcr-rdf",
        name="UNHCR Refugee Data Finder",
        publisher="UNHCR",
        family="displacement",
        unit="country of origin x country of asylum x year x population type",
        coverage="Global, every country of asylum UNHCR reports on",
        years="1951 onward for refugees; most series usable from 1990",
        cadence="Twice yearly, mid-year and year-end",
        access="Web app, CSV export, and a public JSON API with no key",
        fmt="CSV, JSON",
        api="Yes: api.unhcr.org/population/v1/",
        licence="Free with attribution",
        network="Weighted directed: origin -> asylum, weight = refugees or asylum "
                "seekers. Sparser and far more skewed than the DESA stock network.",
        metrics=["refugees under UNHCR mandate", "asylum seekers (pending cases)",
                 "returned refugees", "internally displaced people",
                 "returned IDPs", "stateless people", "others in need of "
                 "international protection", "host community",
                 "resettlement arrivals and departures", "RSD decisions and "
                 "recognition rates", "solutions: naturalisation, return, resettlement"],
        limits=[
            "UNRWA-registered Palestine refugees sit in a separate series and are "
            "excluded from most UNHCR totals. Forgetting this understates the Middle "
            "East by several million.",
            "Country of asylum is where people are counted, not where they want to be. "
            "Transit countries look like destinations.",
            "IDP figures come from national and cluster sources of very mixed quality; "
            "a jump in an IDP series is often a change in who was counted.",
            "Some asylum countries report a single 'various' origin, which collapses "
            "real edges into one.",
            "Definitions changed in 2018 when the 'others of concern' category was "
            "restructured; long series cross that break.",
        ],
        url="https://www.unhcr.org/refugee-statistics/",
        checked="fetched 2026-09-16: the 2024 year slice gives 6,198 origin/asylum rows "
                "with a non-zero population, summing to 30.96 million refugees on "
                "cross-border rows.",
    ),
    dict(
        id="idmc-gidd",
        name="IDMC Global Internal Displacement Database",
        publisher="Internal Displacement Monitoring Centre",
        family="displacement",
        unit="country x year x cause (conflict, disaster), stocks and new displacements",
        coverage="Global, ~150 countries with events",
        years="2008 onward for disasters; 2009 onward for conflict stocks",
        cadence="Annual Global Report on Internal Displacement, plus an event feed",
        access="Open download and a REST API",
        fmt="CSV, XLSX, JSON",
        api="Yes",
        licence="CC BY",
        network="Node attributes, not a network. Internal by definition, so there is "
                "no origin-destination edge to build. Sub-national event locations are "
                "available and can be joined to geography.",
        metrics=["internal displacements (new movements) by cause",
                 "total number of IDPs at year end",
                 "disaster hazard type", "event-level records with dates and locations"],
        limits=[
            "New displacements count movements, not people. One person displaced three "
            "times contributes three.",
            "Disaster and conflict displacement are estimated by different methods and "
            "should not be added without saying so.",
            "Coverage follows where monitoring exists. An absence of data is not an "
            "absence of displacement.",
        ],
        url="https://www.internal-displacement.org/database/displacement-data/",
        checked="not fetched",
    ),
    dict(
        id="unrwa",
        name="UNRWA registered Palestine refugees",
        publisher="UNRWA",
        family="displacement",
        unit="field of operation x year, registered persons",
        coverage="Five fields: Jordan, Lebanon, Syria, West Bank, Gaza",
        years="1950 onward",
        cadence="Annual",
        access="Statistical bulletins and the UNRWA open data portal",
        fmt="PDF, XLSX, some CSV",
        api="Limited",
        licence="UN terms",
        network="Node attributes only; five fields, no origin-destination structure",
        metrics=["registered refugees", "registered persons",
                 "camp populations", "service uptake in health and education"],
        limits=[
            "Registration, not presence. Registered persons include descendants and "
            "people who have since moved or naturalised elsewhere.",
            "Not comparable with UNHCR figures and not additive with them.",
            "Five fields only; Palestinians outside them are counted by UNHCR, "
            "sometimes, under a different mandate.",
        ],
        url="https://www.unrwa.org/what-we-do/protection",
        checked="not fetched",
    ),

    # -------------------------------------------------------------------- asylum
    dict(
        id="eurostat-asylum",
        name="Eurostat asylum applications and decisions",
        publisher="Eurostat",
        family="asylum",
        unit="reporting country x citizenship x month x sex x age",
        coverage="EU27, EFTA",
        years="2008 onward monthly; annual back to 1998 in older series",
        cadence="Monthly, with about a two-month lag",
        access="Eurostat database and API",
        fmt="TSV, SDMX, JSON",
        api="Yes",
        licence="Reuse with attribution",
        network="Weighted directed origin -> destination at monthly resolution. The "
                "highest-frequency bilateral migration network available anywhere.",
        metrics=["first-time and repeat asylum applications (migr_asyappctzm)",
                 "first-instance and final decisions by outcome",
                 "recognition rate by origin and destination",
                 "unaccompanied minors", "Dublin transfers, requests and outgoing",
                 "withdrawn applications"],
        limits=[
            "Applications are not arrivals. Asylum shopping, secondary movement and "
            "Dublin transfers put the same person in several national counts.",
            "Recognition rates computed as decisions over applications in the same "
            "period are wrong; decisions lag applications by months to years.",
            "Small cells are suppressed.",
            "Europe only.",
        ],
        url="https://ec.europa.eu/eurostat/web/migration-asylum/asylum/database",
        checked="not fetched",
    ),
    dict(
        id="frontex-dibc",
        name="Frontex detections of illegal border crossings",
        publisher="Frontex (European Border and Coast Guard Agency)",
        family="asylum",
        unit="migratory route x month x reported nationality",
        coverage="EU external borders",
        years="2009 onward monthly",
        cadence="Monthly",
        access="Frontex migratory map and public CSV releases",
        fmt="CSV, XLSX",
        api="No stable public API",
        licence="Reuse with attribution",
        network="Route-level, not country pairs. Can be coerced into origin -> route "
                "-> entry-country edges but the route is the honest unit.",
        metrics=["detections by route", "claimed nationality", "share of minors",
                 "sex breakdown", "facilitators detected"],
        limits=[
            "Detections count events, not people. One person crossing twice is two "
            "detections, and Frontex says so.",
            "Nationality is claimed, not verified, and claiming a high-recognition "
            "nationality is rational behaviour.",
            "Enforcement intensity drives the series as much as movement does. A rise "
            "can mean more patrols.",
            "Routes are an administrative construct that changes definition over time.",
        ],
        url="https://www.frontex.europa.eu/what-we-do/monitoring-and-risk-analysis/migratory-map/",
        checked="not fetched",
    ),
    dict(
        id="dhs-ois",
        name="US DHS Office of Immigration Statistics yearbook",
        publisher="US Department of Homeland Security",
        family="asylum",
        unit="fiscal year x country of birth or nationality x category",
        coverage="United States",
        years="1892 onward for some series; detailed tables from 1996",
        cadence="Annual, with monthly CBP releases",
        access="Open download",
        fmt="XLSX, CSV, PDF",
        api="No",
        licence="US public domain",
        network="Origin -> US edges only. A single-destination star.",
        metrics=["lawful permanent residents by country of birth and class of admission",
                 "naturalisations", "nonimmigrant admissions by visa class",
                 "refugee admissions and asylum grants",
                 "removals, returns and expedited removals",
                 "CBP encounters by sector, nationality and demographic"],
        limits=[
            "Fiscal years, not calendar years. Joining to anything else needs care.",
            "Encounters count events; Title 42 era repeat crossings inflated the series "
            "and the break is not marked in the raw tables.",
            "Class of admission reflects the legal route taken, which is shaped by "
            "queue availability rather than intent.",
        ],
        url="https://www.dhs.gov/ohss/topics/immigration",
        checked="not fetched",
    ),

    # -------------------------------------------------------------------- policy
    dict(
        id="mipex",
        name="MIPEX, Migrant Integration Policy Index",
        publisher="CIDOB and Migration Policy Group",
        family="policy",
        unit="country x year x policy strand, score 0-100",
        coverage="56 countries: EU, OECD and a few others",
        years="2007, 2010, 2014, 2019, 2020 rounds",
        cadence="Every few years; the 2020 round is the current one",
        access="Open download and an interactive site",
        fmt="XLSX, CSV",
        api="No",
        licence="CC BY",
        network="Node attributes. The standard policy covariate.",
        metrics=["overall MIPEX score",
                 "eight strands: labour market mobility, family reunion, education, "
                 "political participation, permanent residence, access to nationality, "
                 "anti-discrimination, health",
                 "sub-indicator scores"],
        limits=[
            "Measures law on the books, not implementation. A generous statute with a "
            "two-year appointment backlog scores well.",
            "Expert coding, so the scale is ordinal dressed up as cardinal. Differences "
            "of five points mean little.",
            "Rich-country bias in the country set.",
            "Rounds are years apart; it cannot support event-study designs.",
        ],
        url="https://www.mipex.eu/",
        checked="not fetched",
    ),
    dict(
        id="impic",
        name="IMPIC, Immigration Policies in Comparison",
        publisher="WZB Berlin (Helbling, Bjerre, Romer, Zobel)",
        family="policy",
        unit="country x year x policy field, restrictiveness score",
        coverage="33 OECD countries",
        years="1980-2010, with extensions",
        cadence="Static with occasional extension",
        access="Open download after registration",
        fmt="Stata, CSV",
        api="No",
        licence="Academic use",
        network="Node attributes",
        metrics=["restrictiveness of regulations and control mechanisms",
                 "by field: labour, family, asylum, co-ethnic migration",
                 "external vs internal control"],
        limits=[
            "Ends around 2010 in the core release; the last fifteen years of policy "
            "change are the interesting ones and they are not in it.",
            "OECD only.",
            "Aggregation weights across sub-indices are a choice, and results move "
            "with the choice.",
        ],
        url="https://www.wzb.eu/en/research/migration-and-diversity/migration-and-diversity/projects/impic",
        checked="not fetched",
    ),
    dict(
        id="demig",
        name="DEMIG POLICY, DEMIG C2C and DEMIG TOTAL",
        publisher="International Migration Institute, Oxford / Amsterdam",
        family="policy",
        unit="policy change event; and country-to-country flow series",
        coverage="45 countries for policy; 34 reporters for C2C flows",
        years="1945-2013",
        cadence="Static",
        access="Open download",
        fmt="XLSX, CSV",
        api="No",
        licence="Academic use with citation",
        network="DEMIG C2C is a bilateral flow network 1946-2011. DEMIG POLICY is an "
                "event list, not a network.",
        metrics=["6,500 policy changes coded by direction and magnitude",
                 "policy area and target group",
                 "C2C: annual bilateral inflows and outflows",
                 "TOTAL: long-run national flow series"],
        limits=[
            "Frozen in 2013. Nobody maintains it.",
            "Policy 'magnitude' is a four-point expert judgement.",
            "C2C reporters are the usual rich-country set, with the usual emigration "
            "undercount.",
        ],
        url="https://www.migrationinstitute.org/data/demig-data",
        checked="not fetched",
    ),
    dict(
        id="globalcit",
        name="GLOBALCIT citizenship law datasets",
        publisher="European University Institute",
        family="policy",
        unit="country x year x mode of acquisition or loss of citizenship",
        coverage="Near-global, 190+ countries for the core modes",
        years="Varies; CITLAW indicators from 1960s, current law fully coded",
        cadence="Continuous updating",
        access="Open download and a browsable database",
        fmt="CSV, XLSX",
        api="No",
        licence="CC BY",
        network="Node attributes, plus one genuine network: dual-citizenship "
                "toleration and bilateral citizenship agreements.",
        metrics=["modes of acquisition: birthright, descent, naturalisation, "
                 "marriage, ancestry-based, investment",
                 "modes of loss and deprivation",
                 "residence duration required for naturalisation",
                 "dual citizenship toleration",
                 "electoral rights of non-resident citizens and non-citizen residents"],
        limits=[
            "Law as written. Administrative discretion is invisible.",
            "Coding a legal system into indicators loses conditionality; a rule with "
            "five exceptions codes the same as one without.",
            "Some historical series are thin outside Europe.",
        ],
        url="https://globalcit.eu/databases/",
        checked="not fetched",
    ),
    dict(
        id="iom-mgi",
        name="IOM Migration Governance Indicators",
        publisher="IOM with the Economist Impact",
        family="policy",
        unit="country or city x assessment round, 90+ binary indicators",
        coverage="~100 countries assessed so far, plus subnational units",
        years="2016 onward, rolling",
        cadence="Rolling; each country assessed once or twice",
        access="Country profiles on the Migration Data Portal",
        fmt="PDF profiles; some structured data",
        api="No",
        licence="IOM terms",
        network="Node attributes",
        metrics=["six dimensions of migration governance",
                 "presence or absence of specific institutions and policies"],
        limits=[
            "Self-assessment with IOM facilitation, so it measures stated commitment.",
            "Not a scored index by design; IOM discourages ranking, which limits it "
            "as a regression covariate.",
            "Coverage is where governments agreed to be assessed.",
        ],
        url="https://www.migrationdataportal.org/overviews/mgi",
        checked="not fetched",
    ),

    # ------------------------------------------------------------------ mobility
    dict(
        id="demig-visa",
        name="DEMIG VISA",
        publisher="International Migration Institute",
        family="mobility",
        unit="origin nationality x destination country x year, visa required or not",
        coverage="237 nationalities x 214 destinations",
        years="1973-2013",
        cadence="Static",
        access="Open download",
        fmt="XLSX",
        api="No",
        licence="Academic use",
        network="Directed binary network, near-complete: an arc when a passport holder "
                "of A needs a visa for B. Forty years of it, which makes it the only "
                "long longitudinal mobility-rights network.",
        metrics=["visa requirement, binary, per year and per pair"],
        limits=[
            "Stops in 2013.",
            "Binary. Visa-on-arrival, eTA and e-visa regimes collapse into the same "
            "cell as a full embassy application.",
            "Says nothing about refusal rates, which is where the real restriction "
            "sits for many nationalities.",
        ],
        url="https://www.migrationinstitute.org/data/demig-data/demig-visa-data",
        checked="not fetched",
    ),
    dict(
        id="passport-indices",
        name="Henley Passport Index and Global Passport Power Index",
        publisher="Henley and Partners (IATA data); Arton Capital",
        family="mobility",
        unit="passport x destination, access category",
        coverage="199 passports x 227 destinations",
        years="2006 onward, updated through the year",
        cadence="Quarterly to monthly",
        access="Public web rankings; the underlying pairwise matrix is commercial",
        fmt="Web, scraping needed for the matrix",
        api="Commercial",
        licence="Proprietary; rankings are public, the matrix is not",
        network="Directed network of visa-free access. The contemporary successor to "
                "DEMIG VISA, and one of the cleanest inequality measures in the field.",
        metrics=["visa-free destinations count", "visa-on-arrival", "eTA required",
                 "visa required", "mobility score"],
        limits=[
            "Licensing. The headline ranking is free, the pair-level matrix is not, "
            "and scraping it is against the terms.",
            "Built from IATA timetable data, which encodes airline-facing rules and "
            "occasionally lags real policy.",
            "Tourist entry only. It says nothing about work or settlement rights, "
            "which is what migration actually needs.",
        ],
        url="https://www.henleyglobal.com/passport-index",
        checked="not fetched",
    ),
    dict(
        id="visa-openness",
        name="UN Tourism and regional visa openness indices",
        publisher="UN Tourism (UNWTO); African Union and AfDB for the Africa index",
        family="mobility",
        unit="destination x origin region, entry requirement",
        coverage="Global for UNWTO; 54 countries for the Africa Visa Openness Index",
        years="2008 onward; Africa index annual since 2016",
        cadence="Annual",
        access="Report downloads, some structured annexes",
        fmt="PDF, XLSX",
        api="No",
        licence="Free with attribution",
        network="Directed, but usually published at origin-region rather than "
                "origin-country resolution, which coarsens the network badly.",
        metrics=["share of world population requiring a visa",
                 "visa-free, visa-on-arrival, e-visa shares",
                 "Africa index: openness score, reciprocity"],
        limits=[
            "Tourism framing, so short-stay rules only.",
            "Aggregated to regions in most published tables.",
            "The pair-level source is the same commercial IATA feed.",
        ],
        url="https://www.unwto.org/tourism-visa-openness",
        checked="not fetched",
    ),

    # ----------------------------------------------------------------- irregular
    dict(
        id="iom-mmp",
        name="IOM Missing Migrants Project",
        publisher="IOM Global Migration Data Analysis Centre",
        family="irregular",
        unit="incident: date, location, route, dead, missing, survivors, nationalities",
        coverage="Global, all migration routes",
        years="2014 onward",
        cadence="Continuous, updated weekly",
        access="Open download, no registration",
        fmt="CSV with coordinates",
        api="Partial",
        licence="CC BY",
        network="Not a network. Point events with coordinates and a named route; "
                "can be aggregated to origin-route or origin-region edges.",
        metrics=["dead and missing per incident", "cause of death",
                 "route", "coordinates", "reported nationalities of the deceased",
                 "number of survivors"],
        limits=[
            "Undercount by construction, and the publisher says so. Deaths in deserts "
            "and in unmonitored sea areas are found only when someone reports them.",
            "Media-sourced, so coverage tracks journalistic attention. The "
            "Mediterranean looks deadlier partly because it is watched.",
            "Nationality is unknown for most records.",
            "An incident is not a person; group incidents with an unknown count are "
            "recorded with estimates.",
        ],
        url="https://missingmigrants.iom.int/downloads",
        checked="not fetched",
    ),
    dict(
        id="ctdc",
        name="Counter Trafficking Data Collaborative",
        publisher="IOM, Polaris, Liberty Shared and partners",
        family="irregular",
        unit="individual victim case, de-identified",
        coverage="Global, ~190 countries of origin represented",
        years="2002 onward",
        cadence="Periodic releases",
        access="Open global synthetic and k-anonymised datasets",
        fmt="CSV",
        api="No",
        licence="CC BY-NC",
        network="Origin country -> exploitation country edges at case level. One of "
                "very few victim-level datasets that yields a real network.",
        metrics=["country of origin, exploitation and citizenship",
                 "type of exploitation: sexual, forced labour, forced marriage",
                 "means of control", "recruiter relationship",
                 "age band and gender", "sector of exploitation"],
        limits=[
            "Cases known to service providers. This is a sample of the identified, "
            "which is a biased sample of the exploited.",
            "Heavy privacy protection: k-anonymisation and synthetic variants blur "
            "exactly the small cells you would want.",
            "Case counts reflect counter-trafficking capacity in a country, not "
            "trafficking prevalence.",
        ],
        url="https://www.ctdatacollaborative.org/",
        checked="not fetched",
    ),
    dict(
        id="unodc-tip",
        name="UNODC Global Report on Trafficking in Persons",
        publisher="UN Office on Drugs and Crime",
        family="irregular",
        unit="country x year, detected victims and convictions; plus origin-destination "
             "flows at subregional level",
        coverage="~150 countries reporting",
        years="2003 onward, biennial reports",
        cadence="Every two years",
        access="Report plus a data portal",
        fmt="PDF, XLSX, some CSV",
        api="No",
        licence="UN terms",
        network="Subregion -> subregion trafficking flows. Coarse, but the only "
                "official global one.",
        metrics=["detected victims by age, sex and form of exploitation",
                 "convictions and prosecutions",
                 "cross-border vs domestic share",
                 "origin-destination flows at subregional resolution"],
        limits=[
            "Detection, not prevalence, and detection is a function of enforcement.",
            "Subregional flows only; no country pairs.",
            "Reporting country coverage changes between editions, which breaks "
            "comparability of totals.",
        ],
        url="https://www.unodc.org/unodc/data-and-analysis/glotip.html",
        checked="not fetched",
    ),
    dict(
        id="gdp-detention",
        name="Global Detention Project database",
        publisher="Global Detention Project",
        family="irregular",
        unit="detention facility; and country immigration-detention profile",
        coverage="~100 countries profiled",
        years="2006 onward, rolling updates",
        cadence="Rolling",
        access="Open web database and downloads",
        fmt="Web, CSV extracts",
        api="Limited",
        licence="CC BY-NC",
        network="Not a network. Facility-level attributes with coordinates, plus "
                "country legal frameworks.",
        metrics=["number and type of detention facilities",
                 "detention capacity and population where known",
                 "legal grounds and maximum duration",
                 "detention of minors", "operators including private contractors"],
        limits=[
            "Coverage depends on state transparency; the least transparent systems "
            "have the thinnest profiles.",
            "Capacity and occupancy figures are often years old.",
            "Facility lists are incomplete where detention happens in police stations "
            "and unofficial sites.",
        ],
        url="https://www.globaldetentionproject.org/",
        checked="not fetched",
    ),

    # --------------------------------------------------------------------- money
    dict(
        id="knomad-remit",
        name="KNOMAD bilateral remittance matrix",
        publisher="World Bank / KNOMAD",
        family="money",
        unit="sending country x receiving country x year, USD",
        coverage="~214 countries, complete matrix",
        years="2010 onward, selected years",
        cadence="Alongside the Migration and Development Brief",
        access="XLSX download",
        fmt="XLSX square matrix",
        api="No",
        licence="CC BY",
        network="Weighted directed money network, the mirror image of the migration "
                "network. Comparing the two is a ready-made research question.",
        metrics=["estimated bilateral remittance flow in USD"],
        limits=[
            "Estimated, not measured. Allocation uses the bilateral migrant stock and "
            "income differences, so the remittance network is partly a transformation "
            "of the migration network. Correlating them is close to circular.",
            "Informal channels, hawala and cash carried by hand are outside it.",
            "National totals are balance-of-payments figures with known definitional "
            "problems around compensation of employees.",
        ],
        url="https://www.knomad.org/data/remittances",
        checked="not fetched",
    ),
    dict(
        id="rpw",
        name="Remittance Prices Worldwide",
        publisher="World Bank",
        family="money",
        unit="corridor x provider x quarter, cost of sending a fixed amount",
        coverage="48 sending and 105 receiving countries, 367 corridors",
        years="2008 onward, quarterly",
        cadence="Quarterly",
        access="Open download",
        fmt="XLSX, CSV",
        api="No",
        licence="CC BY",
        network="Weighted directed corridor network where the weight is a price, not "
                "a volume. Useful as an edge cost.",
        metrics=["total cost as percentage of the amount sent",
                 "fee and exchange-rate margin split",
                 "by provider type: bank, MTO, mobile operator",
                 "speed of transfer", "SDG 10.c.1 indicator"],
        limits=[
            "Corridor set is chosen for policy salience, not coverage. Many corridors "
            "with large volumes are missing.",
            "Mystery-shopper prices, collected on one day per quarter.",
            "Advertised prices, which are not what everyone pays.",
        ],
        url="https://remittanceprices.worldbank.org/",
        checked="not fetched",
    ),
    dict(
        id="wb-wdi",
        name="World Bank World Development Indicators",
        publisher="World Bank",
        family="money",
        unit="country x year x indicator",
        coverage="Global, 217 economies plus aggregates",
        years="1960 onward, varies by indicator",
        cadence="Continuous, with annual major updates",
        access="Open API with no key",
        fmt="JSON, XML, CSV bulk",
        api="Yes: api.worldbank.org/v2/",
        licence="CC BY 4.0",
        network="Node attributes. The default covariate set for country-level models.",
        metrics=["net migration SM.POP.NETM",
                 "international migrant stock SM.POP.TOTL and share SM.POP.TOTL.ZS",
                 "personal remittances received BX.TRF.PWKR.CD.DT and paid "
                 "BM.TRF.PWKR.CD.DT",
                 "remittances as share of GDP BX.TRF.PWKR.DT.GD.ZS",
                 "GDP per capita, population, urban share, unemployment"],
        limits=[
            "Net migration is a five-year residual estimate, not a measurement, and "
            "it absorbs every error in the population accounts.",
            "The refugee series SM.POP.REFG has been archived; use UNHCR instead.",
            "Aggregate rows (WLD, EUU, income groups) share the same endpoint as "
            "countries and will silently pollute a country-level join.",
            "Latest year coverage thins out for poorer countries, so a 'latest "
            "available' join creates a rich-country sample without warning.",
        ],
        url="https://data.worldbank.org/",
        checked="fetched 2026-09-16: 2024 values returned for 243-260 countries "
                "across population, net migration, migrant stock, remittances and "
                "GDP per capita; SM.POP.REFG returns 'indicator not found'.",
    ),
    dict(
        id="ilostat",
        name="ILOSTAT labour migration statistics",
        publisher="International Labour Organization",
        family="money",
        unit="country x year x sex x status, migrant worker counts and shares",
        coverage="~130 countries with labour force surveys",
        years="Mostly 2010 onward",
        cadence="Annual, with periodic global estimates",
        access="Open bulk download and an API",
        fmt="CSV, SDMX",
        api="Yes",
        licence="CC BY",
        network="Node attributes",
        metrics=["international migrant workers by sex and sector",
                 "share of migrants in the labour force",
                 "informality rate among migrant workers",
                 "unemployment rate of migrants vs nationals",
                 "domestic workers who are migrants"],
        limits=[
            "Labour force surveys miss people in collective housing, undocumented "
            "workers and very recent arrivals. Those are large migrant groups.",
            "Gulf states, which host the largest migrant labour shares, have thin or "
            "absent survey series.",
            "Global estimates are modelled from a partial country set.",
        ],
        url="https://ilostat.ilo.org/topics/labour-migration/",
        checked="not fetched",
    ),

    # --------------------------------------------------------------------- micro
    dict(
        id="ipums-i",
        name="IPUMS International",
        publisher="Minnesota Population Center",
        family="micro",
        unit="individual census record, harmonised",
        coverage="100+ countries, 500+ censuses, over a billion records",
        years="1960 onward, some earlier",
        cadence="New samples added continuously",
        access="Free registration and a project description; extracts by request",
        fmt="Custom extract: CSV, Stata, SPSS, fixed-width",
        api="Yes, extract API",
        licence="Free for research; redistribution prohibited",
        network="Not a network in itself, but birthplace x residence at individual "
                "level rebuilds the bilateral stock matrix with any covariate you want "
                "on the edge.",
        metrics=["country of birth", "year of immigration", "citizenship",
                 "internal migration: previous residence one and five years ago",
                 "education, occupation, income, household structure, language"],
        limits=[
            "Registration and an approved research purpose. Not a drop-in download.",
            "Harmonisation loses country-specific detail; the harmonised birthplace "
            "variable groups small origins into regional categories.",
            "Census rounds are ten years apart in most countries.",
            "Some countries release only small samples, and a few release nothing "
            "recent.",
            "Undocumented populations are under-enumerated in every census.",
        ],
        url="https://international.ipums.org/international/",
        checked="not fetched",
    ),
    dict(
        id="ipums-usa",
        name="IPUMS USA, CPS and ACS",
        publisher="Minnesota Population Center",
        family="micro",
        unit="individual record, US",
        coverage="United States",
        years="1850 onward for censuses; ACS from 2000; CPS from 1962",
        cadence="Annual",
        access="Free registration, extract system",
        fmt="CSV, Stata, SPSS",
        api="Yes",
        licence="Free for research",
        network="Origin -> US edges with full individual covariates",
        metrics=["birthplace at detailed country level", "year of immigration",
                 "citizenship status", "ancestry", "language spoken at home",
                 "wages, occupation, industry, education", "state and PUMA of residence"],
        limits=[
            "One destination.",
            "ACS is a 1% sample; small origin groups have wide standard errors and "
            "the design effect is easy to forget.",
            "Legal status is not asked. Imputation of undocumented status is an "
            "assumption-heavy literature.",
        ],
        url="https://usa.ipums.org/usa/",
        checked="not fetched",
    ),
    dict(
        id="ess",
        name="European Social Survey",
        publisher="ESS ERIC",
        family="micro",
        unit="individual respondent, repeated cross-section",
        coverage="~30 European countries",
        years="2002 onward, biennial rounds",
        cadence="Every two years",
        access="Free download after registration",
        fmt="CSV, Stata, SPSS",
        api="No",
        licence="Free for non-commercial use",
        network="Node attributes aggregated to country, or individual-level analysis",
        metrics=["allow more or fewer immigrants of same race, different race, "
                 "poorer countries outside Europe",
                 "immigration good or bad for the economy, cultural life, place to live",
                 "respondent's own and parents' country of birth",
                 "contact with people of a different race",
                 "trust, political orientation, religiosity"],
        limits=[
            "Europe only.",
            "The three headline immigration items are the same wording since 2002, "
            "which is a strength for trends and a weakness for anything recent.",
            "Response rates have fallen and vary sharply across countries.",
            "Migrants themselves are undersampled; surveys in the national language "
            "exclude recent arrivals.",
        ],
        url="https://www.europeansocialsurvey.org/",
        checked="not fetched",
    ),
    dict(
        id="gallup-wp",
        name="Gallup World Poll migration module",
        publisher="Gallup",
        family="micro",
        unit="individual respondent, ~1000 per country per year",
        coverage="~150 countries",
        years="2005 onward, annual",
        cadence="Annual",
        access="Commercial licence; derived indices published free",
        fmt="Proprietary; institutional subscription",
        api="Commercial",
        licence="Proprietary",
        network="Desire-to-move gives an intended origin -> destination network, which "
                "is rare and valuable: intentions before selection.",
        metrics=["desire to migrate permanently",
                 "planning to move in the next 12 months",
                 "preferred destination country",
                 "Potential Net Migration Index",
                 "life evaluation, employment, social capital"],
        limits=[
            "Expensive. The microdata is behind an institutional subscription.",
            "Intentions are not behaviour. The gap between wanting to move and moving "
            "is roughly an order of magnitude.",
            "1000 respondents per country makes destination-level breakdowns thin.",
            "Sampling in conflict-affected countries is partial or suspended.",
        ],
        url="https://www.gallup.com/analytics/318875/global-research.aspx",
        checked="not fetched",
    ),
    dict(
        id="mafe",
        name="MAFE, Migrations between Africa and Europe",
        publisher="INED and partners",
        family="micro",
        unit="individual life history, origin and destination samples",
        coverage="Senegal, DR Congo, Ghana; France, Italy, Spain, UK, Belgium, Netherlands",
        years="Fieldwork 2008-2010, retrospective histories back decades",
        cadence="Static",
        access="Free after registration",
        fmt="Stata, CSV",
        api="No",
        licence="Academic use",
        network="Individual migration trajectories, plus transnational family "
                "networks. Gives multi-step migration paths, which almost nothing "
                "else does.",
        metrics=["year-by-year residence, activity, housing and family histories",
                 "return and circular migration",
                 "remittances and investments back home",
                 "documentation status over time",
                 "network contacts at destination before departure"],
        limits=[
            "Three origin countries. Not generalisable.",
            "Fieldwork is now fifteen years old.",
            "Retrospective recall over decades, with the usual telescoping errors.",
            "Sampling migrants at destination and non-migrants at origin makes the "
            "weighting delicate.",
        ],
        url="https://mafeproject.site.ined.fr/en/",
        checked="not fetched",
    ),
    dict(
        id="dhs-lsms",
        name="DHS and LSMS household surveys",
        publisher="USAID / ICF; World Bank",
        family="micro",
        unit="household and individual records",
        coverage="90+ low and middle income countries",
        years="1984 onward (DHS); 1985 onward (LSMS)",
        cadence="Country rounds every few years",
        access="Free after a registered project request",
        fmt="Stata, SPSS, CSV",
        api="DHS has an API for indicators",
        licence="Free for research",
        network="Household rosters with absent members give an origin-household -> "
                "destination network, including internal migration.",
        metrics=["absent household members and where they went",
                 "remittances received by the household",
                 "migration history of the respondent",
                 "internal vs international split",
                 "health, fertility and consumption outcomes"],
        limits=[
            "Whole-household migration is invisible: if everyone left, nobody is home "
            "to be surveyed. This biases the sample toward split households.",
            "Migration modules are not standard across rounds or countries.",
            "Destination is often recorded only as 'abroad'.",
        ],
        url="https://dhsprogram.com/",
        checked="not fetched",
    ),

    # ------------------------------------------------------------------- digital
    dict(
        id="meta-sci",
        name="Meta Social Connectedness Index",
        publisher="Meta / Humanitarian Data Exchange",
        family="digital",
        unit="region pair, relative friendship link intensity",
        coverage="Global at country level; subnational for many countries",
        years="Snapshots from 2018 onward",
        cadence="Occasional refreshes",
        access="Open download via HDX",
        fmt="TSV",
        api="No",
        licence="Free with attribution, some use restrictions",
        network="Weighted undirected social network between places. Correlates "
                "strongly with migration corridors and is available where migration "
                "data is not.",
        metrics=["scaled probability that two users in regions i and j are friends"],
        limits=[
            "Facebook users, not people. Penetration varies by country, age and "
            "gender, and the index is scaled in a way that hides the denominator.",
            "Friendship is not migration. Diaspora, tourism, colonial history and "
            "language all load onto it.",
            "Undirected, so it cannot tell origin from destination.",
            "Snapshot timing is not always documented.",
        ],
        url="https://data.humdata.org/dataset/social-connectedness-index",
        checked="not fetched",
    ),
    dict(
        id="linkedin-d4d",
        name="LinkedIn Data for Development migration indicators",
        publisher="World Bank and LinkedIn",
        family="digital",
        unit="origin country x destination country x industry x skill, relative flow",
        coverage="~100 countries with sufficient LinkedIn penetration",
        years="2015 onward, quarterly",
        cadence="Quarterly",
        access="Open via the World Bank Data Catalog",
        fmt="CSV",
        api="No",
        licence="CC BY",
        network="Weighted directed network of professional relocation, by skill and "
                "industry. The only near-real-time high-skill migration network.",
        metrics=["migration rate per 10,000 members",
                 "by industry and by skill group",
                 "talent migration direction"],
        limits=[
            "LinkedIn members: white-collar, urban, English-literate. It measures a "
            "narrow slice and calls it talent.",
            "Penetration differs by an order of magnitude across countries, so "
            "cross-country levels are not comparable, only within-country trends.",
            "Location changes are self-reported and can lag or be aspirational.",
            "No coverage of China and several large markets.",
        ],
        url="https://datacatalog.worldbank.org/search/dataset/0038044",
        checked="not fetched",
    ),
    dict(
        id="twitter-geo",
        name="Geotagged social media migration estimates",
        publisher="Academic (Zagheni, Weber, State and others)",
        family="digital",
        unit="user trajectory aggregated to country pairs and months",
        coverage="Varies by study; global in principle",
        years="2011 onward, study-specific windows",
        cadence="Not maintained; replication datasets only",
        access="Replication packages; raw platform data increasingly closed",
        fmt="CSV",
        api="Platform APIs largely closed since 2023",
        licence="Varies",
        network="Directed monthly migration network at high frequency",
        metrics=["estimated migration rate", "seasonality",
                 "post-shock displacement response within weeks"],
        limits=[
            "The platform APIs that made this work possible are now closed or priced "
            "out of reach. New collection is mostly not feasible.",
            "Geotagging is a small and unrepresentative share of users.",
            "Distinguishing migration from tourism and business travel needs an "
            "arbitrary dwell-time threshold.",
            "Bias correction requires an external ground truth, which returns you to "
            "DESA.",
        ],
        url="https://www.demographic-research.org/",
        checked="not fetched",
    ),
    dict(
        id="gdelt",
        name="GDELT Global Knowledge Graph",
        publisher="GDELT Project",
        family="digital",
        unit="news event and article, every 15 minutes",
        coverage="Global, 100+ languages",
        years="1979 onward for events; GKG from 2013",
        cadence="Every 15 minutes",
        access="Open; BigQuery public dataset and raw file downloads",
        fmt="CSV, BigQuery",
        api="Yes",
        licence="Free with attribution",
        network="Actor-to-actor event network, and a country co-mention network. "
                "Migration-related events can be filtered by CAMEO code and theme "
                "(REFUGEES, MIGRATION, BORDER).",
        metrics=["event actors, type, tone and Goldstein score",
                 "themes including refugee and migration codes",
                 "geographic mentions", "article volume and tone by country"],
        limits=[
            "Media attention, not events. Volume tracks newsroom capacity.",
            "Automated actor and event coding is noisy; published error rates for "
            "CAMEO coding are high enough to matter.",
            "Deduplication of the same story across outlets is imperfect, so volume "
            "spikes can be one story reprinted.",
            "English-language sources dominate despite the multilingual claim.",
        ],
        url="https://www.gdeltproject.org/",
        checked="not fetched",
    ),

    # -------------------------------------------------------------------- actors
    dict(
        id="wikidata-orgs",
        name="Wikipedia and Wikidata migration organisations (this repo)",
        publisher="Harvested here from Wikimedia projects",
        family="actors",
        unit="organisation article, with country, type and founding date",
        coverage="Global, limited to organisations with an English Wikipedia article",
        years="Snapshot; founding dates span the whole history of each organisation",
        cadence="Re-runnable at any time via scripts/migration/run_all.py",
        access="Free APIs, no key, User-Agent header required",
        fmt="TSV produced by this repo; JSON from the APIs",
        api="Yes: MediaWiki action API and the Wikidata SPARQL endpoint",
        licence="CC BY-SA for Wikipedia text, CC0 for Wikidata claims",
        network="Directed article-link network among organisations, plus a typed "
                "Wikidata tie network (member of, parent organisation, affiliation).",
        metrics=["organisation type: IGO, NGO, charity, government agency, research "
                 "institute, diaspora association",
                 "country of the organisation and how it was inferred",
                 "inception and dissolution dates",
                 "number of Wikipedia language editions as a reach proxy",
                 "the categories the organisation was found in"],
        limits=[
            "Wikipedia notability is the selection rule. Anglophone, formal and "
            "long-lived organisations are over-represented; grassroots and "
            "non-English-speaking ones are missing.",
            "An article link is not a relationship. It can mean funding, opposition, "
            "a shared founder or a passing mention.",
            "Country attribution falls back to the category name when Wikidata is "
            "silent, which is weaker evidence. The rule used is recorded per row.",
            "Category membership on Wikipedia is inconsistent and editor-dependent, "
            "so the recall of any single crawl is unknown.",
        ],
        url="https://www.wikidata.org/",
        checked="crawl run 2026-09-16 from 25 seed categories to depth 4",
    ),
    dict(
        id="uia-yearbook",
        name="Yearbook of International Organizations",
        publisher="Union of International Associations",
        family="actors",
        unit="international organisation profile",
        coverage="~75,000 organisations in 300 countries",
        years="1908 onward",
        cadence="Annual",
        access="Subscription database; some institutional access",
        fmt="Web database, limited export",
        api="No",
        licence="Proprietary",
        network="Organisation-to-organisation relations and shared memberships. The "
                "most complete organisational network in existence for this domain, "
                "and the hardest to get at.",
        metrics=["organisation type and aims", "founding date",
                 "members by country", "relations with other organisations",
                 "consultative status with UN bodies"],
        limits=[
            "Paywalled, with export restrictions that make bulk network construction "
            "difficult even with access.",
            "Self-reported profiles, updated when organisations respond.",
            "Coverage of national NGOs is thin; the focus is international bodies.",
        ],
        url="https://uia.org/yearbook",
        checked="not fetched",
    ),
    dict(
        id="acled-ucdp",
        name="ACLED and UCDP conflict event data",
        publisher="ACLED; Uppsala Conflict Data Program",
        family="actors",
        unit="conflict event with date, actors, location and fatalities",
        coverage="Global (ACLED); global (UCDP GED)",
        years="ACLED 1997 onward by region; UCDP GED 1989 onward",
        cadence="ACLED weekly; UCDP annual with a monthly candidate release",
        access="Free registration for ACLED; open download for UCDP",
        fmt="CSV, API",
        api="Yes for both",
        licence="ACLED: free for non-commercial with attribution. UCDP: CC BY.",
        network="Actor-to-actor conflict network, and geolocated events that join to "
                "displacement data as the driver side of the story.",
        metrics=["event type, sub-event type, actors and interaction code",
                 "fatalities", "precise coordinates and geoprecision flag",
                 "civilian targeting"],
        limits=[
            "Media-sourced, so the same attention bias as GDELT, moderated by human "
            "coding.",
            "ACLED and UCDP disagree on totals for the same conflicts because of "
            "different inclusion rules. Pick one and say which.",
            "Fatality figures in contested conflicts are estimates with wide ranges.",
        ],
        url="https://acleddata.com/",
        checked="not fetched",
    ),
    dict(
        id="emdat",
        name="EM-DAT International Disaster Database",
        publisher="CRED, UCLouvain",
        family="actors",
        unit="disaster event: country, type, deaths, affected, damage",
        coverage="Global",
        years="1900 onward, reliable from 1970s",
        cadence="Continuous",
        access="Free registration for academic use",
        fmt="XLSX, CSV",
        api="Limited",
        licence="Free for non-commercial research",
        network="Not a network. The environmental driver side, joined by country-year.",
        metrics=["disaster type and subtype", "deaths, injured, affected, homeless",
                 "economic damage", "start and end dates", "affected subregions"],
        limits=[
            "Entry threshold of ten deaths or a hundred affected excludes slow-onset "
            "events, which are the ones most linked to migration.",
            "Reporting improves over time, so a rising trend is partly a reporting "
            "artefact.",
            "'Affected' is defined inconsistently across sources.",
        ],
        url="https://www.emdat.be/",
        checked="not fetched",
    ),

    # ------------------------------------------------------------------- history
    dict(
        id="historical-census",
        name="Historical census and passenger records",
        publisher="IPUMS, national archives, Ellis Island Foundation",
        family="history",
        unit="individual record or ship manifest line",
        coverage="Mostly Europe and the Americas",
        years="1820s onward",
        cadence="Static digitisation projects",
        access="Mixed: IPUMS free with registration, genealogy sites commercial",
        fmt="CSV, fixed-width, scanned images with transcriptions",
        api="Partial",
        licence="Mixed",
        network="Origin -> destination at individual level for the age of mass "
                "migration, which is the only period with near-complete individual "
                "coverage of a migration wave.",
        metrics=["port of departure and arrival", "declared last residence",
                 "age, occupation, literacy, money carried",
                 "name of contact at destination, which yields a real social network"],
        limits=[
            "Transcription errors in names and places are pervasive.",
            "Coverage is where records survived and were digitised, which is a "
            "European and North Atlantic story.",
            "Return migration is invisible in arrival records; roughly a third of "
            "arrivals in some corridors went home.",
        ],
        url="https://international.ipums.org/international/",
        checked="not fetched",
    ),

    # -------------------------------------------------------------------- portal
    dict(
        id="migration-data-portal",
        name="Migration Data Portal",
        publisher="IOM Global Migration Data Analysis Centre",
        family="portal",
        unit="curated indicator listing and country profiles",
        coverage="Global",
        years="Current",
        cadence="Continuous",
        access="Open web",
        fmt="Web, some downloads",
        api="No",
        licence="Free with attribution",
        network="Not data itself. The best single index of who publishes what, "
                "including the definitions and the caveats.",
        metrics=["indicator definitions", "country profiles",
                 "thematic overviews with source lists"],
        limits=[
            "A directory, not a repository. Everything still has to be fetched from "
            "the original publisher.",
            "Some linked sources are stale.",
        ],
        url="https://www.migrationdataportal.org/",
        checked="not fetched",
    ),
    dict(
        id="mpi-datahub",
        name="Migration Policy Institute Data Hub",
        publisher="Migration Policy Institute",
        family="portal",
        unit="curated tables and interactive maps",
        coverage="United States in depth; global and European summaries",
        years="Current with historical series",
        cadence="Continuous",
        access="Open web with XLSX downloads",
        fmt="XLSX, web",
        api="No",
        licence="Free with attribution",
        network="Not a network. Derived tables, pre-cleaned, good for sanity checks.",
        metrics=["immigrant population by state and metro area",
                 "unauthorised population estimates",
                 "refugee admissions", "European asylum trends"],
        limits=[
            "Derived from ACS and official sources, so it inherits their limits and "
            "adds MPI's own modelling for unauthorised estimates.",
            "US-centric.",
            "Tables, not microdata.",
        ],
        url="https://www.migrationpolicy.org/programs/migration-data-hub",
        checked="not fetched",
    ),
    dict(
        id="hdx",
        name="Humanitarian Data Exchange",
        publisher="UN OCHA Centre for Humanitarian Data",
        family="portal",
        unit="dataset records from hundreds of organisations",
        coverage="Global, crisis-focused",
        years="2014 onward",
        cadence="Continuous",
        access="Open, with an API and a Python client",
        fmt="CSV, XLSX, GeoJSON",
        api="Yes: CKAN API",
        licence="Varies by dataset, mostly open",
        network="Not a network. The place to find displacement, needs assessment and "
                "population movement tracking data for a specific crisis.",
        metrics=["IOM Displacement Tracking Matrix country datasets",
                 "population movement and flow monitoring",
                 "humanitarian needs by admin level",
                 "administrative boundaries and population rasters"],
        limits=[
            "Quality varies enormously between contributors.",
            "Crisis datasets are snapshots that stop when the response ends.",
            "Admin boundary and naming mismatches across datasets from the same "
            "country are the normal case, not the exception.",
        ],
        url="https://data.humdata.org/",
        checked="not fetched",
    ),
    dict(
        id="iom-dtm",
        name="IOM Displacement Tracking Matrix",
        publisher="IOM",
        family="portal",
        unit="site, area or flow-monitoring point assessment",
        coverage="~90 countries in crisis",
        years="2004 onward, country-specific windows",
        cadence="Continuous per operation, from daily to quarterly",
        access="Open via dtm.iom.int and HDX, with an API",
        fmt="CSV, XLSX, API",
        api="Yes",
        licence="Free with attribution",
        network="Flow monitoring records origin and intended destination at "
                "individual-journey level, which yields a real movement network "
                "inside crisis corridors.",
        metrics=["displaced population by site and admin area",
                 "flow monitoring: travellers per day, origin, intended destination, "
                 "reason for moving, means of transport",
                 "needs and vulnerabilities per site",
                 "returnee tracking"],
        limits=[
            "Operational data collected for response, not research. Methods change "
            "between rounds within the same country.",
            "Flow monitoring points cover selected routes; coverage is purposive, not "
            "a sample.",
            "Intended destination is stated intent at one moment on a journey.",
            "Comparability across countries is poor by design.",
        ],
        url="https://dtm.iom.int/",
        checked="not fetched",
    ),
]

# ---------------------------------------------------------------------------
# Added 16 September 2026, after the four project questions were fixed:
# closeness (how easy is a country to reach), betweenness (which countries and
# cities are hubs), cliques (which blocs move among themselves), and the effect
# of shocks (COVID, a chokepoint closure, a change of US administration).
# None of these were fetched; confirm against the publisher before citing.
# ---------------------------------------------------------------------------

SOURCES += [
    # ------------------------------------------------------------------ gravity
    dict(
        id="cepii-gravity",
        name="CEPII Gravity and GeoDist databases",
        publisher="CEPII",
        family="gravity",
        unit="country pair x year",
        coverage="252 countries, complete pair matrix",
        years="1948-2021 for Gravity; GeoDist is time-invariant",
        cadence="Roughly every two years",
        access="Open download, no registration",
        fmt="CSV, Stata, R, parquet",
        api="No",
        licence="Free for research with citation",
        network="A complete weighted pair matrix of everything except migration. "
                "This is the null model for a migration network: distance, adjacency, "
                "shared language, shared coloniser, shared currency.",
        metrics=["population-weighted and simple bilateral distance",
                 "contiguity", "common official language, common spoken language",
                 "colonial relationship ever, common coloniser, year of independence",
                 "regional trade agreement in force", "common currency",
                 "GDP, population and area for both ends"],
        limits=[
            "Distance is between population-weighted centroids of the largest cities. "
            "For a migration question it is the wrong distance: what matters is "
            "route feasibility, not great-circle kilometres.",
            "'Common official language' misses lingua francas and misses the "
            "difference between an official language and one people speak.",
            "The colonial variables are binary and recent-biased; they cannot express "
            "the intensity or the length of the relationship.",
            "Ends in 2021 in the current release.",
        ],
        url="https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele.asp",
        checked="not fetched",
    ),
    dict(
        id="cepii-language",
        name="CEPII linguistic proximity (Melitz and Toubal)",
        publisher="CEPII",
        family="gravity",
        unit="country pair, language overlap indices",
        coverage="195 countries",
        years="Time-invariant",
        cadence="Static",
        access="Open download",
        fmt="CSV, Stata",
        api="No",
        licence="Free with citation",
        network="Weighted undirected language-overlap network. Explains a large share "
                "of migration ties that distance cannot.",
        metrics=["common native language probability",
                 "common spoken language probability",
                 "linguistic proximity from language-tree distance",
                 "common official language"],
        limits=[
            "Built from country-level language shares, so it assumes random matching "
            "between two populations.",
            "Static. It cannot capture English spreading as a second language.",
            "Language trees measure genealogy, not mutual intelligibility.",
        ],
        url="https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele.asp",
        checked="not fetched",
    ),
    dict(
        id="cow-igo",
        name="Correlates of War Intergovernmental Organizations dataset",
        publisher="Correlates of War Project",
        family="gravity",
        unit="country x organisation x year, membership",
        coverage="Global, ~530 intergovernmental organisations",
        years="1815-2014 (v3)",
        cadence="Periodic version releases",
        access="Open download",
        fmt="CSV, Stata",
        api="No",
        licence="Free with citation",
        network="Bipartite country-organisation membership, which projects to a "
                "weighted country co-membership network. The obvious explanation to "
                "test against any migration clique you find.",
        metrics=["membership status: full, associate, observer",
                 "organisation founding and dissolution years",
                 "co-membership counts per pair"],
        limits=[
            "Ends in 2014.",
            "Membership is not integration. Sitting in the same body says nothing "
            "about whether the border is open.",
            "Organisation coverage is skewed toward formal treaty bodies.",
        ],
        url="https://correlatesofwar.org/data-sets/igos/",
        checked="not fetched",
    ),
    dict(
        id="free-movement",
        name="Free movement protocols and regional mobility agreements",
        publisher="IOM, ILO, African Union, WTO RTA database",
        family="gravity",
        unit="agreement x member states x entry-into-force date",
        coverage="Global, assembled from several partial inventories",
        years="1950s onward",
        cadence="Irregular; no single maintained register",
        access="Report annexes, the WTO RTA Information System, ILO inventories",
        fmt="PDF annexes, some XLSX; assembly required",
        api="WTO RTA-IS has a search interface, not a bulk API",
        licence="Mixed, mostly free with attribution",
        network="Country blocs with legal free movement: EU/EEA plus Switzerland, "
                "the Nordic Passport Union, ECOWAS, EAC, CARICOM, MERCOSUR residence, "
                "GCC, the Trans-Tasman arrangement, the Common Travel Area. These are "
                "the cliques you would expect to find, so finding them is not a result.",
        metrics=["right of entry, residence and work, separately",
                 "entry into force and any suspension",
                 "labour mobility provisions inside trade agreements"],
        limits=[
            "No single authoritative dataset exists. It has to be assembled by hand, "
            "and different inventories disagree on what counts as free movement.",
            "Legal right and practical exercise diverge sharply. ECOWAS grants free "
            "movement on paper and border practice does not follow.",
            "Suspensions (Schengen internal border controls since 2015) are recorded "
            "nowhere consistently.",
        ],
        url="https://rtais.wto.org/",
        checked="not fetched",
    ),
    dict(
        id="un-treaties",
        name="UN Treaty Collection ratification status",
        publisher="United Nations Office of Legal Affairs",
        family="gravity",
        unit="country x treaty x action x date",
        coverage="Global",
        years="1945 onward",
        cadence="Continuous",
        access="Open web database; scraping needed for bulk",
        fmt="Web, HTML tables",
        api="No official API",
        licence="UN terms",
        network="Bipartite country-treaty, projecting to a legal-alignment network.",
        metrics=["1951 Refugee Convention and 1967 Protocol, with reservations",
                 "1954 and 1961 statelessness conventions",
                 "1990 Migrant Workers Convention (ICRMW)",
                 "Palermo Protocols on trafficking and smuggling",
                 "signature, ratification and reservation dates"],
        limits=[
            "Reservations matter enormously and are free text, so they resist coding. "
            "Several states ratified the Refugee Convention with a geographic "
            "limitation that changes what it means.",
            "Ratification is not compliance.",
            "No bulk download; the tables have to be scraped.",
        ],
        url="https://treaties.un.org/",
        checked="not fetched",
    ),

    # ---------------------------------------------------------------- competing
    dict(
        id="openflights",
        name="OpenFlights and OurAirports route data",
        publisher="OpenFlights project; OurAirports",
        family="competing",
        unit="airline x source airport x destination airport",
        coverage="~67,000 routes, ~3,300 airlines, ~10,000 airports",
        years="Snapshot, last major refresh around 2014",
        cadence="OpenFlights is effectively frozen; OurAirports is community-updated",
        access="Open download from GitHub",
        fmt="CSV with coordinates",
        api="No",
        licence="Open Database License",
        network="Directed city-pair and airport-pair network. The transport layer the "
                "betweenness question needs, and the only free one at airport level.",
        metrics=["route existence by airline", "airport coordinates, IATA and ICAO codes",
                 "number of stops", "equipment type"],
        limits=[
            "Stale. The 2014 snapshot predates Gulf carrier expansion, COVID network "
            "cuts and every low-cost route since. Betweenness computed on it describes "
            "2014.",
            "Route existence, not capacity. A daily A380 and a weekly turboprop are the "
            "same edge.",
            "Airport-level, so a multi-airport city needs manual aggregation before it "
            "answers a question about cities.",
        ],
        url="https://openflights.org/data.html",
        checked="not fetched",
    ),
    dict(
        id="opensky",
        name="OpenSky Network flight data",
        publisher="OpenSky Network",
        family="competing",
        unit="individual flight: aircraft, origin and destination airport, times",
        coverage="Global where ADS-B receivers exist; dense in Europe and North America",
        years="2016 onward; the COVID-19 dataset covers 2019 onward continuously",
        cadence="Live, with monthly historical dumps",
        access="Free for research after registration; the COVID dataset is open on Zenodo",
        fmt="CSV, Parquet, Trino/Impala query access",
        api="Yes, REST and a Python client",
        licence="CC BY for the published datasets",
        network="Directed airport-pair network with actual flight counts per day. This "
                "is the dataset that shows COVID collapsing and recovering, edge by "
                "edge, at daily resolution.",
        metrics=["flights per airport pair per day",
                 "aircraft type and operator", "departure and arrival times",
                 "full trajectories for a subset"],
        limits=[
            "Coverage follows volunteer receivers. Africa, central Asia and oceanic "
            "sectors are thin, which is exactly where some interesting routes are.",
            "Origin and destination airports are inferred from trajectories, not "
            "filed plans, so short and low-altitude flights are missed.",
            "Flights are not passengers. Cargo and repositioning flights are in there.",
            "Large. The COVID dataset alone runs to tens of gigabytes.",
        ],
        url="https://opensky-network.org/datasets/",
        checked="not fetched",
    ),
    dict(
        id="comtrade-baci",
        name="UN Comtrade and CEPII BACI bilateral trade",
        publisher="UN Statistics Division; CEPII",
        family="competing",
        unit="exporter x importer x product x year, value and quantity",
        coverage="Global, ~200 reporters",
        years="Comtrade from 1962; BACI from 1995",
        cadence="Annual, with monthly Comtrade series",
        access="Comtrade free tier with rate limits and a paid bulk tier; BACI free "
               "after registration",
        fmt="CSV, JSON; BACI is a single large CSV per year",
        api="Yes for Comtrade",
        licence="UN terms; BACI free for research",
        network="Weighted directed trade network, complete and annual. The standard "
                "comparison: if migration centrality just reproduces trade centrality, "
                "there is nothing migration-specific to report.",
        metrics=["export and import value by HS product code",
                 "quantities", "BACI reconciles mirror discrepancies into one value"],
        limits=[
            "Comtrade mirror statistics disagree; exporter-reported and "
            "importer-reported values for the same flow differ by a lot. BACI exists "
            "to patch this and its patching is a model.",
            "Free API rate limits make a full matrix pull slow.",
            "Entrepôt trade (Netherlands, Singapore, Hong Kong) inflates their "
            "betweenness for reasons that have nothing to do with migration.",
        ],
        url="https://comtradeplus.un.org/",
        checked="not fetched",
    ),
    dict(
        id="imf-portwatch",
        name="IMF PortWatch",
        publisher="IMF and Oxford University, from AIS satellite data",
        family="competing",
        unit="port x day, and chokepoint x day, vessel transits",
        coverage="~1,400 ports, 25 maritime chokepoints",
        years="January 2019 onward, daily",
        cadence="Daily, with about a two-day lag",
        access="Open portal with downloads and an ArcGIS feature service",
        fmt="CSV, GeoJSON",
        api="Yes",
        licence="Free with attribution",
        network="Port-to-port trade flow estimates, and a direct daily series for the "
                "Strait of Hormuz, Bab el-Mandeb, Suez, Panama and the Bosphorus. "
                "This is the dataset for a chokepoint event study.",
        metrics=["daily vessel transits by chokepoint and cargo type",
                 "port calls and estimated trade volume by port",
                 "disruption simulation results"],
        limits=[
            "Ships, not people. It answers what a chokepoint closure did to trade and "
            "says nothing directly about migration.",
            "Volumes are estimated from AIS vessel characteristics, not manifests.",
            "AIS can be switched off, and is, on sanctioned routes.",
        ],
        url="https://portwatch.imf.org/",
        checked="not fetched",
    ),
    dict(
        id="lowy-diplomacy",
        name="Lowy Institute Global Diplomacy Index",
        publisher="Lowy Institute",
        family="competing",
        unit="sending country x host city, diplomatic post",
        coverage="~110 countries, ~11,000 posts",
        years="2016, 2017, 2019, 2021, 2024 editions",
        cadence="Every two to three years",
        access="Open interactive site; bulk data needs scraping",
        fmt="Web, JSON behind the visualisation",
        api="No official API",
        licence="Free with attribution",
        network="Directed network of embassies and consulates, at city level. Where a "
                "country has a consulate is where its nationals can get a visa, so "
                "this is a real component of 'how easy is it to get there'.",
        metrics=["embassies, consulates general, permanent missions, other posts",
                 "host city", "network size ranking"],
        limits=[
            "110 countries, so most of the sending side of the world is missing.",
            "A post existing is not a post issuing visas; many consulates do no "
            "consular work.",
            "Editions are years apart, so closures during a crisis are invisible.",
        ],
        url="https://globaldiplomacyindex.lowyinstitute.org/",
        checked="not fetched",
    ),
    dict(
        id="unga-voting",
        name="UN General Assembly voting data",
        publisher="Erik Voeten, Harvard Dataverse",
        family="competing",
        unit="country x resolution x vote",
        coverage="Global, all member states",
        years="1946 onward",
        cadence="Annual updates",
        access="Open download",
        fmt="CSV, Stata, R",
        api="No",
        licence="CC0",
        network="Country similarity network from vote agreement, plus ideal-point "
                "estimates. Tells you whether a migration clique is a political bloc.",
        metrics=["vote choice per resolution", "ideal point estimates with uncertainty",
                 "agreement scores between country pairs",
                 "issue codes including human rights"],
        limits=[
            "UNGA votes are cheap talk. Agreement there does not imply cooperation "
            "on anything costly.",
            "Most resolutions pass by consensus and carry no information.",
            "Ideal points are a one-dimensional summary of a multidimensional thing.",
        ],
        url="https://dataverse.harvard.edu/dataverse/Voeten",
        checked="not fetched",
    ),
    dict(
        id="wikimedia-clickstream",
        name="Wikimedia Clickstream and Pageviews",
        publisher="Wikimedia Foundation",
        family="competing",
        unit="referrer article -> target article, monthly click count; and article x day views",
        coverage="Major language editions",
        years="2015 onward, monthly dumps",
        cadence="Monthly",
        access="Open dumps, no registration",
        fmt="TSV.gz dumps; REST API for pageviews",
        api="Yes for pageviews",
        licence="CC0",
        network="A weighted version of the article-link network in this repo: how many "
                "readers actually walked each edge. Turns a link graph into a traffic "
                "graph, which changes every centrality on it.",
        metrics=["clicks per article pair per month",
                 "link type: link, external, other",
                 "daily pageviews per article by access method and agent"],
        limits=[
            "Counts under ten are dropped from the clickstream for privacy, which "
            "removes most edges in a small domain like ours.",
            "Reader attention, not importance. A news cycle moves it.",
            "Bot filtering is imperfect despite the agent field.",
            "One language edition at a time; the English one carries an anglophone "
            "readership.",
        ],
        url="https://dumps.wikimedia.org/other/clickstream/",
        checked="not fetched",
    ),

    # ------------------------------------------------------------------- events
    dict(
        id="oxcgrt",
        name="Oxford COVID-19 Government Response Tracker",
        publisher="Blavatnik School of Government, University of Oxford",
        family="events",
        unit="country (and US state, some subnational) x day x policy indicator",
        coverage="180+ countries",
        years="1 January 2020 to 31 December 2022",
        cadence="Closed series, complete",
        access="Open on GitHub",
        fmt="CSV",
        api="Yes",
        licence="CC BY",
        network="Node attributes at daily resolution. C8 international travel controls "
                "is the variable that makes COVID border closure an event study rather "
                "than an anecdote.",
        metrics=["C8 international travel controls, 0 to 4",
                 "C7 internal movement restrictions",
                 "stringency index, containment and health index",
                 "school and workplace closure, stay-at-home orders"],
        limits=[
            "C8 is a country-level ordinal, so it cannot say which origins were banned. "
            "A ban on three countries and a total closure can score the same.",
            "Policy on paper, again. Enforcement varied.",
            "Ends at the close of 2022.",
        ],
        url="https://github.com/OxCGRT/covid-policy-dataset",
        checked="not fetched",
    ),
    dict(
        id="iom-travel-restrictions",
        name="IOM COVID-19 travel and mobility restrictions",
        publisher="IOM Displacement Tracking Matrix",
        family="events",
        unit="country x point in time x restriction type; and point of entry status",
        coverage="Global, ~240 countries and territories, ~7,000 points of entry",
        years="March 2020 to 2022",
        cadence="Closed; was updated twice weekly",
        access="Open via dtm.iom.int and HDX",
        fmt="CSV, XLSX",
        api="Partial",
        licence="Free with attribution",
        network="Directed, and this is the point: IOM recorded which nationalities each "
                "country barred, so the COVID border regime is a bilateral network, not "
                "a single index.",
        metrics=["points of entry fully or partially closed, by air, land and sea",
                 "nationality-specific entry bans",
                 "exceptions for residents, medical and essential travel",
                 "quarantine and testing requirements"],
        limits=[
            "Collected from official announcements, so it records the rule on the day "
            "it was announced, not the day it took effect.",
            "Point-in-time snapshots rather than a clean daily panel; reconstructing a "
            "continuous series needs interpolation.",
            "Stops in 2022.",
        ],
        url="https://dtm.iom.int/",
        checked="not fetched",
    ),
    dict(
        id="unhcr-operational",
        name="UNHCR Operational Data Portal",
        publisher="UNHCR",
        family="events",
        unit="situation x country x date, arrivals and border crossings",
        coverage="Active emergencies: Ukraine, Sudan, Afghanistan, Venezuela, Syria "
                 "and others",
        years="Situation-specific, mostly 2015 onward",
        cadence="Daily to weekly during an emergency",
        access="Open portal with downloads and an API",
        fmt="CSV, JSON",
        api="Yes",
        licence="Free with attribution",
        network="Origin -> neighbouring country arrivals at daily or weekly resolution. "
                "The only place a displacement shock is visible while it happens.",
        metrics=["border crossings per day by crossing point",
                 "refugees recorded in each neighbouring country",
                 "onward movement to third countries",
                 "returns to the country of origin"],
        limits=[
            "Only where there is an active response. A shock without an emergency "
            "declaration leaves no trace here.",
            "Border crossing counts are movements, not people, and include back-and-"
            "forth travel, which was large in Ukraine.",
            "Series definitions change as a response matures, and old figures get "
            "revised without a changelog.",
            "Portals are archived and sometimes taken down when a situation closes.",
        ],
        url="https://data.unhcr.org/",
        checked="not fetched",
    ),
    dict(
        id="us-visa-issuance",
        name="US monthly immigrant and nonimmigrant visa issuance statistics",
        publisher="US Department of State, Bureau of Consular Affairs",
        family="events",
        unit="month x visa class x nationality x issuing post",
        coverage="United States, all consular posts worldwide",
        years="2017 onward monthly; annual back further",
        cadence="Monthly, with about a two-month lag",
        access="Open download",
        fmt="PDF and XLSX tables, monthly files",
        api="No",
        licence="US public domain",
        network="Origin nationality -> US, monthly, split by visa class and by the "
                "consulate that issued it. The sharpest instrument for measuring what "
                "a travel ban or a policy change did, and when.",
        metrics=["visas issued by class: H-1B, F-1, B1/B2, immigrant preference "
                 "categories, diversity visa",
                 "by nationality and by post",
                 "refusals under specific grounds in the annual tables"],
        limits=[
            "Issuance, not arrival or stay. Many issued visas are never used.",
            "Published as monthly PDFs and workbooks with inconsistent layouts, so "
            "building a panel is a parsing job.",
            "Consular capacity confounds everything. A post that closed issues zero "
            "visas whatever the policy says.",
            "One destination.",
        ],
        url="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-statistics.html",
        checked="not fetched",
    ),
    dict(
        id="wraps",
        name="US Refugee Processing Center arrivals (WRAPS)",
        publisher="US Department of State Refugee Processing Center",
        family="events",
        unit="month x nationality x religion x US state of resettlement",
        coverage="United States",
        years="2002 onward monthly",
        cadence="Monthly",
        access="Open download from the interactive reporting site",
        fmt="XLSX, CSV",
        api="No",
        licence="US public domain",
        network="Origin -> US state resettlement flows, monthly. Shows the effect of an "
                "admissions ceiling change within weeks.",
        metrics=["refugee arrivals by nationality and month",
                 "state and city of initial resettlement",
                 "religion", "resettlement agency",
                 "annual presidential determination ceiling"],
        limits=[
            "Resettlement is a programme, not migration. The numbers move because the "
            "ceiling moved, which is the point but also the limit.",
            "Initial placement only; secondary migration within the US is invisible "
            "and is large.",
            "The site's export formats change between administrations.",
        ],
        url="https://www.wrapsnet.org/admissions-and-arrivals/",
        checked="not fetched",
    ),
    dict(
        id="schengen-visa-stats",
        name="Schengen visa statistics by consulate and nationality",
        publisher="European Commission, DG Migration and Home Affairs",
        family="events",
        unit="Schengen state x consulate x applicant nationality x year",
        coverage="All Schengen consulates worldwide",
        years="2010 onward",
        cadence="Annual",
        access="Open download",
        fmt="XLSX",
        api="No",
        licence="Reuse with attribution",
        network="Weighted directed: applications and refusals from every nationality "
                "to every Schengen state. The refusal rate is the honest answer to "
                "'how easy is it to get there', far better than the binary visa "
                "requirement.",
        metrics=["short-stay visa applications, issued, refused",
                 "refusal rate by nationality and by consulate",
                 "multiple-entry visa share",
                 "airport transit visas"],
        limits=[
            "Short-stay visas only. Work and study permits are national and are "
            "published separately or not at all.",
            "Annual, so it cannot resolve a policy change within a year.",
            "Applications are filtered by expectation. A nationality with a 60% "
            "refusal rate also has people who never applied, so the rate understates "
            "the barrier.",
            "Consulate workload and appointment scarcity are invisible and are often "
            "the real constraint.",
        ],
        url="https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en",
        checked="not fetched",
    ),
    dict(
        id="mmc-4mi",
        name="Mixed Migration Centre 4Mi",
        publisher="Mixed Migration Centre, Danish Refugee Council",
        family="events",
        unit="individual interview with a person on the move, at a route point",
        coverage="West, North and East Africa, Asia, Latin America, Europe",
        years="2014 onward, continuous",
        cadence="Continuous, with monthly and quarterly snapshots",
        access="Open dashboards and downloadable datasets",
        fmt="CSV, XLSX",
        api="Partial",
        licence="Free with attribution",
        network="Multi-step journeys: departure country, every transit country, "
                "intended destination. Almost nothing else records the middle of a "
                "journey, and betweenness without it is guesswork.",
        metrics=["route taken, waypoint by waypoint",
                 "cost paid and to whom", "duration",
                 "smuggler use", "protection incidents on route",
                 "reason for leaving and for choosing the destination",
                 "change of intended destination during the journey"],
        limits=[
            "Purposive sampling at accessible route points. It is not representative "
            "of people on the move and the publisher says so plainly.",
            "Interviewees who died or were detained are not interviewed, so the "
            "sample is conditioned on survival and mobility.",
            "Geographic coverage follows funded programmes.",
            "Self-reported costs and durations.",
        ],
        url="https://mixedmigration.org/4mi/",
        checked="not fetched",
    ),
    dict(
        id="google-trends",
        name="Google Trends migration search interest",
        publisher="Google",
        family="events",
        unit="region x week x search term, relative interest 0-100",
        coverage="Global, at country and subnational level",
        years="2004 onward",
        cadence="Daily to weekly",
        access="Free web interface; unofficial Python clients",
        fmt="CSV export",
        api="No official API",
        licence="Google terms; no redistribution of raw series",
        network="Not a network. A leading indicator: searches for emigration terms "
                "move weeks before the movement does, which is how the nowcasting "
                "literature detects a shock early.",
        metrics=["relative search interest for terms such as 'jobs in Germany', "
                 "'asylum application', 'visa sponsorship'",
                 "related queries and rising queries",
                 "subnational breakdown within a country"],
        limits=[
            "Indexed to 100 within the query window, so two pulls are not comparable "
            "and the absolute level is unknowable.",
            "Sampled, so repeated identical queries return slightly different series.",
            "Language choice determines the result, which makes cross-country "
            "comparison a translation problem.",
            "Search interest is not intent and intent is not migration.",
        ],
        url="https://trends.google.com/trends/",
        checked="not fetched",
    ),

    # ------------------------------------------------------------------- cities
    dict(
        id="gawc",
        name="GaWC world city network",
        publisher="Globalization and World Cities Research Network, Loughborough",
        family="cities",
        unit="city pair, connectivity derived from advanced-producer-service firm offices",
        coverage="~700 cities worldwide",
        years="2000, 2004, 2008, 2010, 2012, 2016, 2020 rounds",
        cadence="Every few years",
        access="Open data bulletins",
        fmt="XLSX, CSV",
        api="No",
        licence="Free with citation",
        network="A weighted inter-city network built from where firms put offices. "
                "The reference point for any claim that a city is a hub, and it is "
                "already a network, which almost no city data is.",
        metrics=["global network connectivity score",
                 "alpha, beta, gamma city classification",
                 "city-pair connectivity by sector"],
        limits=[
            "Measures corporate service networks. A city can be a migration hub and "
            "a corporate backwater, and Istanbul, Nairobi and Tijuana are exactly "
            "that case.",
            "Firm office lists are the raw input, so it tracks accountancy and law, "
            "not people.",
            "Rounds are years apart.",
        ],
        url="https://www.lboro.ac.uk/gawc/",
        checked="not fetched",
    ),
    dict(
        id="city-foreignborn",
        name="City-level foreign-born population",
        publisher="Eurostat Urban Audit; OECD Metropolitan Areas; national statistics offices",
        family="cities",
        unit="city or metropolitan area x year, population by birthplace or citizenship",
        coverage="Europe and OECD in depth; the rest of the world patchy",
        years="2000 onward for Urban Audit; varies elsewhere",
        cadence="Annual where it exists",
        access="Eurostat database and OECD Data Explorer",
        fmt="TSV, CSV, SDMX",
        api="Yes for both",
        licence="Reuse with attribution",
        network="Node attributes on cities. There is no global city-to-city migration "
                "matrix, and assembling one from these is the single biggest gap for "
                "the hub question.",
        metrics=["foreign-born and foreign-national population by city",
                 "share of total city population",
                 "by broad region of origin where published",
                 "metropolitan area definitions that are comparable across countries"],
        limits=[
            "No origin detail in most city tables, so you get a node attribute and "
            "not an edge.",
            "City boundaries differ between sources; Urban Audit cities, functional "
            "urban areas and administrative cities are three different things.",
            "Outside Europe and the OECD this is a collection of incompatible national "
            "sources.",
            "IPUMS International is the fallback and gives city-level birthplace at "
            "individual level, at the cost of ten-year census rounds.",
        ],
        url="https://ec.europa.eu/eurostat/web/cities/database",
        checked="not fetched",
    ),
    dict(
        id="travel-time-friction",
        name="Global friction surface and travel time to cities",
        publisher="Malaria Atlas Project (Weiss et al.)",
        family="cities",
        unit="1 km raster cell, minutes of travel per metre and time to nearest city",
        coverage="Global land surface",
        years="2015 and 2019 surfaces",
        cadence="Occasional",
        access="Open download; available through Google Earth Engine",
        fmt="GeoTIFF",
        api="Earth Engine",
        licence="CC BY",
        network="Not a network, but it builds one: least-cost paths across it give "
                "real land travel times between any two places, which is what "
                "'how easy is it to get there' means on foot and by road.",
        metrics=["motorised travel speed per cell from roads, rivers, railways, "
                 "land cover and slope",
                 "accumulated travel time to the nearest city of 50,000+"],
        limits=[
            "It assumes you may travel. Borders, checkpoints, minefields and the "
            "sea are not modelled as barriers to a migrant.",
            "Road network quality comes from OpenStreetMap, which is uneven.",
            "Static surfaces, so a closed border or a destroyed bridge is invisible.",
        ],
        url="https://malariaatlas.org/",
        checked="not fetched",
    ),
    dict(
        id="image-internal",
        name="IMAGE internal migration around the globe",
        publisher="University of Queensland (Bell, Charles-Edwards, Stillwell and others)",
        family="cities",
        unit="subnational region pair x period, internal migration",
        coverage="~130 countries with comparable internal migration measures",
        years="Census rounds, roughly 1990 onward",
        cadence="Static research output",
        access="Project repository and published supplementary data",
        fmt="CSV, spatial files",
        api="No",
        licence="Academic use with citation",
        network="Subnational origin-destination networks inside countries. Internal "
                "migration is several times larger than international migration, and "
                "leaving it out makes every hub claim partial.",
        metrics=["crude migration intensity", "migration effectiveness",
                 "aggregate net migration rate",
                 "distance decay parameters",
                 "origin-destination matrices at the finest available geography"],
        limits=[
            "Comparability is the whole research problem: countries use different "
            "region sizes and different time intervals, and the measures correct for "
            "this imperfectly.",
            "Census-based, so five to ten year intervals.",
            "Not maintained as a live series.",
        ],
        url="https://imageproject.com.au/",
        checked="not fetched",
    ),

    # ------------------------------------------------------------------ context
    dict(
        id="un-wpp",
        name="UN World Population Prospects",
        publisher="UN DESA Population Division",
        family="context",
        unit="country x year x age x sex, estimates and projections",
        coverage="237 countries and areas",
        years="1950-2100 (2024 revision)",
        cadence="Every two years",
        access="Open download and an API",
        fmt="CSV, XLSX",
        api="Yes",
        licence="Free with attribution",
        network="Node attributes, and the denominator for every rate you will compute.",
        metrics=["total population, age structure, median age",
                 "net migration rate by country and year",
                 "fertility, mortality, dependency ratios",
                 "projections under several migration assumptions"],
        limits=[
            "Net migration in WPP is the residual that balances the population "
            "accounts. It absorbs census error and should never be treated as a "
            "migration measurement.",
            "Projections embed a migration assumption, so using them to study "
            "migration is circular.",
            "Revisions change history: the same year gets different values across "
            "revisions.",
        ],
        url="https://population.un.org/wpp/",
        checked="not fetched",
    ),
    dict(
        id="vdem",
        name="V-Dem Varieties of Democracy",
        publisher="V-Dem Institute, University of Gothenburg",
        family="context",
        unit="country x year, ~500 indicators",
        coverage="202 countries",
        years="1789 onward",
        cadence="Annual, each March",
        access="Open download; R package",
        fmt="CSV, R, Stata",
        api="No",
        licence="Free for research",
        network="Node attributes. The regime-type covariate, and the push-factor "
                "measure that ACLED cannot give you.",
        metrics=["liberal, electoral, participatory and deliberative democracy indices",
                 "civil liberties, freedom of movement, freedom of expression",
                 "political violence and repression",
                 "exclusion by social group"],
        limits=[
            "Expert-coded with measurement-model uncertainty. Use the confidence "
            "intervals; most users do not.",
            "Country-year, so it cannot time a shock.",
            "Aggregate indices hide which component moved.",
        ],
        url="https://v-dem.net/data/the-v-dem-dataset/",
        checked="not fetched",
    ),
    dict(
        id="nd-gain",
        name="ND-GAIN Country Index",
        publisher="Notre Dame Global Adaptation Initiative",
        family="context",
        unit="country x year, vulnerability and readiness scores",
        coverage="192 countries",
        years="1995 onward",
        cadence="Annual",
        access="Open download",
        fmt="CSV",
        api="No",
        licence="Free with attribution",
        network="Node attributes. The climate push factor, for the part of the "
                "migration story that EM-DAT's ten-death threshold misses.",
        metrics=["vulnerability across food, water, health, ecosystems, habitat, "
                 "infrastructure",
                 "readiness: economic, governance, social",
                 "exposure, sensitivity and adaptive capacity separately"],
        limits=[
            "Composite of composites. The weighting is a choice and results move "
            "with it.",
            "Vulnerability and GDP per capita are strongly correlated, so it is "
            "partly a restatement of income.",
            "Country-level, while climate exposure is intensely local.",
        ],
        url="https://gain.nd.edu/our-work/country-index/",
        checked="not fetched",
    ),

    # ------------------------------------------------------------ actors, funding
    dict(
        id="ocha-fts",
        name="UN OCHA Financial Tracking Service",
        publisher="UN Office for the Coordination of Humanitarian Affairs",
        family="actors",
        unit="funding flow: donor organisation -> recipient organisation, with "
             "destination country, appeal and sector",
        coverage="Global humanitarian funding",
        years="2000 onward",
        cadence="Continuous, reported by donors and agencies",
        access="Open, with a documented REST API and no key",
        fmt="JSON, CSV",
        api="Yes: api.hpc.tools",
        licence="Free with attribution",
        network="A directed weighted organisation-to-organisation money network, with "
                "a country on every edge. This is the real version of what the "
                "Wikipedia link network in this repo approximates.",
        metrics=["amount committed and paid, in USD",
                 "source and destination organisation, typed as government, UN "
                 "agency, NGO, pooled fund or private",
                 "destination country and emergency",
                 "sector, including protection and refugee response",
                 "appeal coverage against requirements"],
        limits=[
            "Voluntary reporting. Coverage of non-Western donors and of local NGOs "
            "is poor, so the network looks more Western-centric than it is.",
            "Earmarked pass-through funding creates chains that double count if you "
            "sum edges naively. A UN agency receiving and regranting appears twice.",
            "Humanitarian only. Development spending on migration is in the OECD DAC "
            "system instead.",
            "Organisation names are not cleanly keyed, so the same NGO appears under "
            "several spellings and needs reconciling before it becomes a node.",
        ],
        url="https://fts.unocha.org/",
        checked="not fetched",
    ),
    dict(
        id="iati",
        name="IATI Registry",
        publisher="International Aid Transparency Initiative",
        family="actors",
        unit="aid activity: reporting organisation, participating organisations, "
             "recipient country, sector, transactions",
        coverage="~1,500 publishers, millions of activities",
        years="2011 onward",
        cadence="Continuous",
        access="Open registry, Datastore API, no key for basic use",
        fmt="XML, with CSV and JSON through the Datastore",
        api="Yes",
        licence="Mostly open, per publisher",
        network="Funder -> implementer -> recipient country, at activity level. "
                "Combined with FTS it gives a full organisational funding network "
                "including development as well as humanitarian money.",
        metrics=["commitments and disbursements by transaction",
                 "participating organisation roles: funding, accountable, "
                 "extending, implementing",
                 "OECD DAC sector codes, including 72010 emergency relief and the "
                 "migration-relevant codes",
                 "recipient country and region",
                 "results frameworks where published"],
        limits=[
            "Data quality varies by publisher from excellent to unusable. Some "
            "publish activities with no transactions at all.",
            "Organisation identifiers are inconsistent despite the standard, so "
            "node resolution is most of the work.",
            "Self-reported and unaudited.",
            "XML at scale is awkward; the Datastore is the practical entry point.",
        ],
        url="https://iatiregistry.org/",
        checked="not fetched",
    ),
    dict(
        id="oecd-crs",
        name="OECD DAC Creditor Reporting System",
        publisher="OECD Development Assistance Committee",
        family="actors",
        unit="donor x recipient x year x sector x project, aid commitments and "
             "disbursements",
        coverage="All DAC donors plus many non-DAC reporters",
        years="1973 onward, detailed from 2002",
        cadence="Annual",
        access="Open bulk download and SDMX",
        fmt="CSV, SDMX",
        api="Yes",
        licence="OECD terms, free",
        network="Donor country -> recipient country weighted aid network, filterable "
                "to migration and refugee sectors.",
        metrics=["aid by purpose code, including refugee support",
                 "in-donor refugee costs, reported as aid",
                 "channel of delivery: which NGO or multilateral implemented it",
                 "commitments and gross disbursements"],
        limits=[
            "In-donor refugee costs are counted as aid to the recipient country, "
            "which means a donor can raise its aid figure by hosting refugees at "
            "home. Any analysis that sums 'aid for migration' without excluding this "
            "is measuring domestic spending.",
            "Two-year publication lag.",
            "Purpose codes are assigned by the donor and applied inconsistently.",
        ],
        url="https://www.oecd.org/en/data/datasets/creditor-reporting-system.html",
        checked="not fetched",
    ),
    dict(
        id="ecosoc-icso",
        name="UN ECOSOC consultative status database (iCSO)",
        publisher="UN Department of Economic and Social Affairs",
        family="actors",
        unit="NGO profile: name, country, status, year granted, areas of work",
        coverage="~6,500 NGOs with consultative status",
        years="1946 onward",
        cadence="Continuous",
        access="Open web database; scraping needed for bulk",
        fmt="Web, HTML",
        api="No",
        licence="UN terms",
        network="Bipartite NGO-to-UN-body accreditation, which projects to an NGO "
                "co-accreditation network. A cleaner organisational spine than "
                "Wikipedia categories, with a country on every node.",
        metrics=["consultative status: general, special, roster",
                 "country of headquarters and countries of operation",
                 "areas of work including migration and refugees",
                 "year status granted"],
        limits=[
            "Status is a UN relationship, not influence. Many accredited NGOs are "
            "dormant.",
            "Self-described areas of work, so the migration filter is unreliable.",
            "No bulk export; it has to be scraped, and the site is slow.",
        ],
        url="https://esango.un.org/civilsociety/",
        checked="not fetched",
    ),
    dict(
        id="irs-990",
        name="US IRS Form 990 filings",
        publisher="US Internal Revenue Service, mirrored on AWS Open Data",
        family="actors",
        unit="nonprofit organisation x tax year, full return including grants made",
        coverage="United States, ~1.5 million registered nonprofits",
        years="2011 onward for machine-readable e-file data",
        cadence="Continuous as returns are filed",
        access="Open bulk XML on AWS S3; ProPublica Nonprofit Explorer as a front end",
        fmt="XML, with derived CSV from Candid and ProPublica",
        api="Yes, ProPublica",
        licence="US public domain",
        network="Schedule I lists grants made to named recipients, which yields a "
                "funder -> grantee network among US nonprofits. Combined with the "
                "NTEE code for international relief and refugee assistance, it gives "
                "the US slice of the migration NGO funding network.",
        metrics=["revenue, expenses, assets, programme service expenses",
                 "grants made, with recipient name, address and purpose",
                 "officer compensation",
                 "NTEE classification including Q33 international relief and "
                 "P84 ethnic and immigrant services",
                 "foreign activity by region on Schedule F"],
        limits=[
            "United States only.",
            "Recipient names are free text with no identifier, so building edges "
            "means entity resolution on messy strings.",
            "Filing lags by up to two years.",
            "Small organisations file the 990-N postcard with almost no content, "
            "which removes exactly the grassroots groups you would want.",
        ],
        url="https://registry.opendata.aws/irs990/",
        checked="not fetched",
    ),
]


# ---------------------------------------------------------------------------
# The four project questions, and what each one needs.
#
# `trap` is the reason the obvious dataset does not answer the question as
# asked. It is the first thing to write into the post, because every one of
# these four questions has a plausible wrong answer that falls out of the
# migrant stock matrix without complaint.
# ---------------------------------------------------------------------------

QUESTIONS = [
    dict(
        id="closeness",
        measure="Closeness centrality",
        question="How easy is it to get to a country if you want to migrate there?",
        edges="Edge weight has to be the cost or difficulty of moving A -> B, not the "
              "number of people who already did. Closeness then reads as 'how near "
              "is this country to everyone who might want to come'.",
        trap="Closeness on the migrant stock network answers a different question: "
             "how connected a country already is to the world's migrant population. "
             "That is an outcome of past ease, not current ease, and it is circular. "
             "The United States would score as the easiest country on earth to "
             "migrate to.",
        primary=["demig-visa", "passport-indices", "schengen-visa-stats",
                 "lowy-diplomacy", "cepii-gravity"],
        supporting=["mipex", "impic", "globalcit", "openflights", "opensky",
                    "travel-time-friction", "mmc-4mi", "undesa-ims", "abel-cohen"],
        gap="There is no global dataset of visa refusal rates. Schengen publishes "
            "them by consulate and nationality and almost nobody else does, so a "
            "worldwide difficulty-weighted network has to use the binary visa "
            "requirement outside Europe and say so. Work and study permit rules are "
            "national and largely unpublished in structured form.",
        notes={
            "demig-visa": "237 nationalities by 214 destinations, visa required or "
                "not, every year from 1973 to 2013. The longest mobility-rights "
                "network anyone has assembled.",
            "passport-indices": "The current-day successor, if you can live with the "
                "pair matrix being commercial.",
            "schengen-visa-stats": "Applications, issuances and refusal rates by "
                "consulate and applicant nationality. The refusal rate is the honest "
                "edge weight: a binary 'visa required' gives every visa-needing "
                "nationality the same score, while the published refusal rates run "
                "from a few per cent to over half depending on the nationality and "
                "the consulate.",
            "lowy-diplomacy": "Where each country keeps consulates. If you have to "
                "fly to a third country to lodge an application, that is part of the "
                "difficulty and nothing else measures it.",
            "cepii-gravity": "Distance, contiguity, shared language, shared "
                "coloniser, as a complete pair matrix. The baseline any difficulty "
                "score has to beat.",
            "travel-time-friction": "A global 1 km surface of how fast you can move "
                "over ground. Least-cost paths across it give real land travel times, "
                "which is what ease of access means when there is no flight.",
            "mmc-4mi": "What people actually paid and how long it actually took, "
                "reported by people on the route.",
            "undesa-ims": "The realised flows, for validating a difficulty score "
                "rather than building it.",
        },
    ),
    dict(
        id="betweenness",
        measure="Betweenness centrality",
        question="Which countries or cities are migration and transportation hubs "
                 "or bridges?",
        edges="You need journeys, not residence. An edge should be a leg of a trip: "
              "A -> T -> B, so that T can sit on a path. Transport networks give the "
              "legs; route surveys give the itineraries.",
        trap="A migrant stock matrix records where people live, not how they got "
             "there. Somebody who went Syria -> Turkey -> Germany appears as a "
             "Syria-born resident of Germany, and Turkey is nowhere on that edge. "
             "Betweenness on the stock matrix is close to meaningless: the matrix is "
             "so dense that shortest paths are almost all length one, and the "
             "betweenness you compute is an artefact of which cells DESA left blank.",
        primary=["mmc-4mi", "iom-dtm", "openflights", "opensky", "gawc"],
        supporting=["unhcr-operational", "eurostat-asylum", "frontex-dibc",
                    "city-foreignborn", "ipums-i", "gdp-detention",
                    "imf-portwatch", "comtrade-baci", "travel-time-friction"],
        gap="There is no global city-to-city migration matrix. IPUMS International "
            "can build one for the countries whose censuses record city of residence "
            "and country of birth, and that is the only route to it. For transit "
            "specifically, 4Mi and DTM flow monitoring are the only sources that "
            "record the middle of a journey, and both are purposive samples on "
            "selected routes.",
        notes={
            "mmc-4mi": "Interviews with people mid-journey: every transit country, "
                "the cost paid, the duration, and whether the intended destination "
                "changed on the way. It records the middle of a trip, which almost "
                "nothing else does.",
            "iom-dtm": "Flow monitoring points log origin and intended destination at "
                "a waypoint, at city resolution, in the countries with an active "
                "operation.",
            "openflights": "Free airport-pair route network with coordinates, and "
                "frozen around 2014, so betweenness on it describes 2014.",
            "opensky": "Every flight from 2019 onward, free for research. Airport-pair "
                "counts per day, which is both the transport network and the COVID "
                "event study in one file.",
            "gawc": "An inter-city network that already exists. Also a useful foil: "
                "Istanbul, Nairobi and Tijuana are migration hubs and corporate "
                "backwaters, so a gap between the two rankings is itself the finding.",
            "city-foreignborn": "Node attributes on cities. There is no global "
                "city-to-city matrix, so this is the closest thing until you build "
                "one from census microdata.",
            "ipums-i": "The only route to a real city-to-city matrix, for the "
                "countries whose censuses record city of residence and country of "
                "birth together.",
            "eurostat-asylum": "Dublin transfer requests are documented secondary "
                "movement inside Europe: a rare recorded second leg.",
            "imf-portwatch": "The maritime version of the same question.",
        },
    ),
    dict(
        id="cliques",
        measure="Cliques and communities",
        question="Which countries or regions have migration running between all "
                 "members, above some threshold?",
        edges="Thresholded mutual migration: keep the pair if the stock in both "
              "directions clears a floor, then look for complete subgraphs. The "
              "threshold choice is the analysis, so report several.",
        trap="You will find the EU, the Nordic countries, the Gulf, ECOWAS, the "
             "anglophone settler states and the former Soviet republics. Every one "
             "of those is a legal free movement zone, a colonial residue or a "
             "language bloc, so the clique itself is not a finding. The finding is "
             "whichever clique survives after conditioning on free movement, shared "
             "language, shared coloniser and distance.",
        primary=["undesa-ims", "abel-cohen", "free-movement", "cepii-gravity",
                 "cepii-language"],
        supporting=["knomad-matrix", "cow-igo", "un-treaties", "unga-voting",
                    "comtrade-baci", "oecd-imd", "eurostat-migr", "knomad-remit"],
        gap="The DESA matrix is ragged, and a clique needs every pair present. A "
            "country that reports its origins coarsely cannot be in a clique no "
            "matter how it behaves, so the ragged matrix will hand you a tidy "
            "European answer for a reporting reason. Use a completed matrix "
            "(Abel and Cohen, or KNOMAD) for the clique search and DESA only to "
            "check it. There is also no single maintained register of free movement "
            "agreements, so the control variable has to be assembled by hand.",
        notes={
            "undesa-ims": "Both directions of every pair, so mutual edges above a "
                "threshold are computable directly. Ragged, though.",
            "abel-cohen": "A complete matrix, which is what a clique search needs. "
                "Estimates, so report which of the six methods you used.",
            "free-movement": "EU and EEA, the Nordic Passport Union, ECOWAS, the East "
                "African Community, CARICOM, MERCOSUR residence, the GCC, the "
                "Trans-Tasman arrangement, the Common Travel Area. Assemble it by "
                "hand; no single register exists.",
            "cepii-gravity": "Shared coloniser and contiguity explain most of what is "
                "left after free movement.",
            "cepii-language": "Common native and spoken language probabilities, which "
                "is the other half of the explanation.",
            "cow-igo": "Country by organisation by year, projecting to a co-membership "
                "network. The obvious alternative story for any bloc you find.",
            "un-treaties": "Refugee Convention, its Protocol and the Migrant Workers "
                "Convention. Ratification blocs and migration blocs are different "
                "shapes, which is worth showing.",
            "unga-voting": "Tells you whether a migration clique is also a political "
                "bloc, or whether it crosses one.",
            "knomad-matrix": "The other completed matrix, for checking that the "
                "cliques are not an artefact of one completion method.",
        },
    ),
    dict(
        id="events",
        measure="Shocks and event studies",
        question="What did COVID, a Strait of Hormuz closure, or a change of US "
                 "administration do to the network?",
        edges="Whatever the edge is, it has to be observed monthly or faster. The "
              "unit of analysis is the pair-month, and the design is a "
              "before-and-after on the treated pairs against untreated ones.",
        trap="Every core migration dataset is annual at best and five-yearly at "
             "worst. DESA cannot see COVID: its 2020 and 2024 points straddle the "
             "whole thing. Any claim about a shock has to come from a different "
             "family of data, and mixing a high-frequency shock measure with an "
             "annual outcome will produce a null result that means nothing.",
        primary=["oxcgrt", "iom-travel-restrictions", "opensky",
                 "us-visa-issuance", "eurostat-asylum", "imf-portwatch"],
        supporting=["wraps", "dhs-ois", "unhcr-operational", "google-trends",
                    "acled-ucdp", "idmc-gidd", "frontex-dibc", "comtrade-baci",
                    "iom-mmp", "mpi-datahub"],
        gap="No maintained global migration policy event database exists after 2013, "
            "when DEMIG POLICY stopped. Dating a policy change worldwide means "
            "hand-coding from MPI, national gazettes and news. For the Strait of "
            "Hormuz the migration effect is indirect: PortWatch shows the trade "
            "shock daily, ACLED shows the conflict, and the migration response "
            "appears months later in Gulf labour-permit statistics that mostly are "
            "not published.",
        notes={
            "oxcgrt": "Daily international travel controls for 180+ countries, "
                "January 2020 to December 2022. One ordinal per country, so it cannot "
                "say who was banned, only how hard.",
            "iom-travel-restrictions": "Which nationalities each country actually "
                "barred. This is what makes the COVID border regime a bilateral "
                "network instead of a single index, and it is the reason to prefer it "
                "over the stringency score.",
            "opensky": "The collapse and the recovery, edge by edge, at daily "
                "resolution. No survey and no register can show that.",
            "us-visa-issuance": "Monthly, by nationality and by issuing consulate. "
                "The sharpest instrument for a travel ban: it dates the effect to the "
                "month and separates the banned nationalities from the rest.",
            "wraps": "Monthly US refugee arrivals by nationality. Moves within weeks "
                "of a change in the admissions ceiling.",
            "eurostat-asylum": "Monthly applications by origin and destination. The "
                "highest-frequency bilateral migration series that exists anywhere.",
            "imf-portwatch": "Daily transits through the Strait of Hormuz, Bab "
                "el-Mandeb, Suez and Panama, from 2019. Free, and built for exactly "
                "this kind of event study.",
            "google-trends": "Search interest moves weeks before the movement does, "
                "which is how the nowcasting literature spots a shock early.",
            "acled-ucdp": "The conflict side of a chokepoint crisis, geolocated and "
                "weekly.",
            "dhs-ois": "Monthly CBP encounters, for the US southern border.",
        },
    ),
]


# ---------------------------------------------------------------------------
# Denmark. Added 16 September 2026 after checking every endpoint below.
#
# Denmark is a population-register country, which is why its numbers are better
# than almost anything in the global families: emigration is recorded rather
# than estimated, the geography goes down to the municipality, and the
# immigration series is published weekly. If a question needs resolution the
# world cannot give, ask it of Denmark first and say that is what you did.
# ---------------------------------------------------------------------------

SOURCES += [
    dict(
        id="dst-statbank",
        name="Statistics Denmark StatBank",
        publisher="Danmarks Statistik",
        family="denmark",
        unit="varies by table; the migration tables are municipality x country x "
             "period x sex x age",
        coverage="Denmark, 98 municipalities and 5 regions, against 242 countries",
        years="1980 onward for the annual series; weekly since 2021",
        cadence="Weekly, monthly, quarterly and annual depending on the table",
        access="Free REST API, no key, no registration",
        fmt="CSV, JSON, JSON-stat, XLSX",
        api="Yes: api.statbank.dk/v1/",
        licence="Free reuse with attribution",
        network="Weighted directed, both directions, at municipality resolution. "
                "Denmark is one endpoint and 242 countries are the other, plus a "
                "complete 98-node internal migration network between municipalities.",
        metrics=[
            "VAN1AAR / VAN1KVT / VAN1UGE: immigrations by municipality, country of "
            "last residence, citizenship, sex and age. Annual from 2007, quarterly "
            "from 2007Q2, WEEKLY from 2021W52",
            "VAN2AAR / VAN2KVT: emigrations by country of destination, same "
            "breakdowns. A register measures this; almost no other country does",
            "INDVAN / UDVAN: the same flows back to 1980, without the geography",
            "FLY66: internal migration between all 98 municipalities, 2006-2025, "
            "by age and sex. A complete city-to-city network",
            "FOLK1C / FOLK2: population by municipality, ancestry and country of "
            "origin, quarterly from 2008 and annual from 1980",
            "VAN5M / VAN5RKAM: asylum applications by citizenship, MONTHLY from "
            "2014M01",
            "VAN66 / VAN77M: residence permits by citizenship and permit type, "
            "annual from 1997 and monthly from 2014. The permit type is the legal "
            "pathway, which the global sources never give you",
            "DKSTAT: acquisitions of Danish citizenship by former citizenship, 1979 "
            "onward",
            "KRYDS1: a person's origin, own country of birth, and both parents' "
            "country of birth and citizenship",
        ],
        limits=[
            "One country. Every finding is about Denmark until you show otherwise.",
            "The official 'Western / non-Western' ancestry split is a Danish "
            "administrative category with a political history, not a neutral "
            "geographic one. Use country of origin and say why.",
            "'Ancestry' (herkomst) classifies a Danish-born child of two immigrants "
            "as a descendant for life, and the category changes if one parent "
            "naturalises. It is a legal construct, not a measure of who someone is.",
            "Immigration is counted at register entry, which requires an intended "
            "stay of at least three months and a CPR number. Short stays, EU posted "
            "workers and undocumented people are outside it entirely.",
            "Small cells are rounded or suppressed for disclosure control, and "
            "municipality-by-country cells are mostly small.",
            "Variable codes are Danish even in the English interface (OMRÅDE, KØN, "
            "ALDER, INDVLAND, STATSB, Tid), and sex has no total category: request "
            "both values or omit the variable.",
        ],
        url="https://www.statbank.dk/",
        checked="fetched 2026-09-16: the API answers without a key; VAN1AAR has 105 "
                "regions, 242 countries of last residence, 241 citizenships and 19 "
                "years, last updated 2026-02-12. The 2024 pull gives Ukraine 8,756, "
                "Germany 6,888, USA 6,513, Romania 4,916 and Sweden 4,347 as the top "
                "origins.",
    ),
    dict(
        id="dst-forskerservice",
        name="Statistics Denmark Research Services register microdata",
        publisher="Danmarks Statistik Forskningsservice",
        family="denmark",
        unit="individual, linkable across every register by an anonymised personal key",
        coverage="The entire resident population of Denmark",
        years="1980 onward for most registers; some back to 1968",
        cadence="Annual register updates",
        access="Authorised research institution, an approved project and a paid "
               "remote-desktop environment. DTU is an authorised institution, so "
               "access runs through a supervisor's project rather than a course.",
        fmt="SAS, Stata and R inside a locked remote environment; no data leaves it",
        api="No",
        licence="Project-bound agreement",
        network="Individual migration histories with exact dates in and out, linkable "
                "to family, address, employer, education and income. The richest "
                "migration data that exists anywhere, and the hardest to reach.",
        metrics=["VNDS: every in-migration and out-migration event with dates and "
                 "countries",
                 "BEF: population register with country of birth, citizenship, "
                 "family links and address",
                 "IDA and RAS: employer-employee links and labour market status",
                 "UDDA: completed education, including qualifications gained abroad",
                 "IND: income and transfers",
                 "Everything joins on the same key, so a migrant's whole trajectory "
                 "in Denmark is observable"],
        limits=[
            "Not usable for a weekly course post. Approval takes months, costs money "
            "and needs an institutional project.",
            "Nothing can be exported except aggregated output cleared by the "
            "disclosure rules, so no figure with small cells leaves the environment.",
            "It observes people after they arrive. Why they came and what happened "
            "to those who did not are both invisible.",
            "People who leave without deregistering keep a live record, so emigration "
            "dates carry error even here.",
        ],
        url="https://www.dst.dk/en/TilSalg/Forskningsservice",
        checked="not fetched",
    ),
    dict(
        id="nyidanmark",
        name="Danish Immigration Service and SIRI statistics",
        publisher="Udlændingestyrelsen and Styrelsen for International Rekruttering "
                  "og Integration",
        family="denmark",
        unit="case: permit or asylum decision by nationality, type and month",
        coverage="Denmark",
        years="Mostly 2010 onward, some series longer",
        cadence="Monthly for asylum, annual for the full account",
        access="Open download from nyidanmark.dk; the Udlændingedatabasen sits inside "
               "StatBank",
        fmt="XLSX, PDF; the StatBank tables are the machine-readable route",
        api="Through StatBank",
        licence="Free reuse with attribution",
        network="Origin nationality to Denmark, split by the legal route taken: "
                "asylum, family reunification, work, study, EU rules.",
        metrics=["asylum applications, decisions and recognition rates by nationality",
                 "residence permits by type: work, study, family, EU/EEA, au pair",
                 "family reunification decisions and refusals",
                 "revocations and returns",
                 "unaccompanied minors",
                 "quota (resettlement) refugee arrivals"],
        limits=[
            "Case counts, not people. One person can generate an application, an "
            "appeal and a permit.",
            "Recognition rate computed as decisions over applications in the same "
            "month is wrong; decisions lag applications by months.",
            "Published as workbooks whose layout changes between years, so building "
            "a panel means parsing.",
            "Denmark's opt-out from EU asylum and migration rules makes several "
            "series not comparable with other member states, which is a feature for "
            "a comparison and a trap for a pooled analysis.",
        ],
        url="https://www.nyidanmark.dk/en-GB/Statistics",
        checked="not fetched",
    ),
    dict(
        id="integrationsbarometer",
        name="Integrationsbarometer",
        publisher="Udlændinge- og Integrationsministeriet",
        family="denmark",
        unit="municipality x year x indicator",
        coverage="All 98 Danish municipalities",
        years="2012 onward",
        cadence="Annual",
        access="Open web with downloads",
        fmt="XLSX, web",
        api="No",
        licence="Free reuse with attribution",
        network="Node attributes on municipalities, which pairs directly with the "
                "FLY66 internal migration network.",
        metrics=["employment rate of immigrants and descendants by municipality",
                 "education participation and completion",
                 "Danish language test results",
                 "crime rate among immigrants and descendants",
                 "share living in deprived residential areas",
                 "naturalisation rate"],
        limits=[
            "Indicators chosen by a ministry with a policy position. What is measured "
            "is itself an argument.",
            "'Deprived residential area' is a statutory Danish category with legal "
            "consequences, not a neutral descriptor.",
            "Municipality-level, so composition effects drive most cross-municipality "
            "differences.",
        ],
        url="https://integrationsbarometer.dk/",
        checked="not fetched",
    ),
    dict(
        id="folketinget-oda",
        name="Folketinget Open Data (oda.ft.dk)",
        publisher="Folketinget, the Danish parliament",
        family="denmark",
        unit="case, document, actor, meeting, vote and speech",
        coverage="The Danish parliament",
        years="1990s onward, with full text from around 2009",
        cadence="Continuous, updated daily",
        access="Open OData API, no key, no registration",
        fmt="JSON, XML",
        api="Yes: oda.ft.dk/api/",
        licence="Free reuse",
        network="Actor-to-case and actor-to-actor networks: who proposed what with "
                "whom, who voted together. And the text layer for weeks 5 to 8: "
                "every speech about migration, by party and by year.",
        metrics=["bills and their full document text",
                 "individual voting records per member",
                 "committee membership",
                 "speeches and meeting transcripts",
                 "case status, type and subject classification",
                 "actors: members, ministers, parties, committees"],
        limits=[
            "Danish. Any NLP on it needs Danish models, and the English tooling in "
            "the course will underperform.",
            "The data model is large and awkwardly documented; joining cases to "
            "speeches to actors takes real work.",
            "Full text coverage thins out before about 2009.",
            "Parliamentary speech is performance. It measures how migration is "
            "talked about, not what was done.",
        ],
        url="https://oda.ft.dk/",
        checked="fetched 2026-09-16: the OData endpoint answers without a key.",
    ),
    dict(
        id="cvr",
        name="Danish Central Business Register (CVR)",
        publisher="Erhvervsstyrelsen",
        family="denmark",
        unit="registered legal entity, including associations and foundations",
        coverage="Every registered organisation in Denmark",
        years="Current, with history of changes",
        cadence="Continuous",
        access="Free bulk access through Virk's Elasticsearch endpoint after "
               "registration; cvrapi.dk for light lookups without one",
        fmt="JSON",
        api="Yes",
        licence="Free reuse",
        network="Not a network by itself, but it fixes the worst limitation of the "
                "organisation layer in this repo: Wikipedia only has organisations "
                "notable enough for an article, while CVR has all of them. For the "
                "Danish slice you can have the whole population of migration "
                "organisations, not the famous ones.",
        metrics=["name, CVR number, founding date, legal form",
                 "industry code, including the codes for social work and membership "
                 "organisations",
                 "registered address and municipality",
                 "board members and management, which gives an interlock network",
                 "annual accounts for entities that file them",
                 "status: active, dissolved, bankrupt"],
        limits=[
            "Industry codes are self-selected and coarse. There is no 'migration' "
            "code, so finding the relevant organisations means filtering on name and "
            "purpose text, which is error-prone in both directions.",
            "Small voluntary associations without a CVR number are absent, and many "
            "grassroots migrant groups are exactly that.",
            "Bulk access needs a Virk account; the light API is rate-limited.",
            "Board member names without identifiers, so interlocks need entity "
            "resolution.",
        ],
        url="https://datacvr.virk.dk/",
        checked="fetched 2026-09-16: cvrapi.dk answers a name lookup without a key.",
    ),
    dict(
        id="nordic-statistics",
        name="Nordic Statistics Database",
        publisher="Nordic Council of Ministers",
        family="denmark",
        unit="Nordic country pair x year, migration and population",
        coverage="Denmark, Sweden, Norway, Finland, Iceland, Faroe Islands, "
                 "Greenland, Åland",
        years="1990 onward for most series",
        cadence="Annual",
        access="Open PxWeb API, no key",
        fmt="JSON, CSV, PX",
        api="Yes: pxweb.nordicstatistics.org/api/v1/",
        licence="Free reuse with attribution",
        network="A small, complete, harmonised migration network between the Nordic "
                "countries, both directions. The Nordic Passport Union has run since "
                "1954, so this is what a migration clique looks like when free "
                "movement has had seventy years to work.",
        metrics=["migration between Nordic countries by sex and age",
                 "immigration from and emigration to the rest of the world",
                 "foreign-born population by background",
                 "harmonised labour market and education indicators"],
        limits=[
            "Eight units. Every network measure on it is descriptive.",
            "Harmonisation across five statistical systems still leaves definitional "
            "differences, particularly for who counts as resident.",
            "Mirror statistics between Nordic countries disagree even inside a "
            "shared register system.",
        ],
        url="https://www.nordicstatistics.org/",
        checked="fetched 2026-09-16: the PxWeb API answers without a key.",
    ),
    dict(
        id="dk-dispersal",
        name="Danish refugee dispersal policy, 1986-1998",
        publisher="Research datasets built on Statistics Denmark registers "
                  "(Damm, and others since)",
        family="denmark",
        unit="individual refugee, assigned municipality and subsequent location",
        coverage="Refugees granted asylum in Denmark, 1986-1998",
        years="1986-1998 assignment, with outcomes followed for decades after",
        cadence="Static; the policy ended",
        access="Through Statistics Denmark Research Services; the published papers "
               "document the design",
        fmt="Register extracts",
        api="No",
        licence="Project-bound",
        network="Assignment to a municipality was made without regard to a refugee's "
                "preferences, which makes it close to random with respect to "
                "outcomes. It is one of the cleanest natural experiments in the "
                "migration literature, and it is Danish.",
        metrics=["assigned municipality and date",
                 "co-ethnic network size in the assigned area",
                 "subsequent internal moves",
                 "employment, earnings, education and crime outcomes over decades"],
        limits=[
            "Needs register access, so the same gate as Forskerservice.",
            "The policy ended in 1998 and the cohort is specific: mostly refugees "
            "from Iran, Iraq, Lebanon, Sri Lanka, Somalia and Vietnam.",
            "Assignment was conditional on family size and nationality, so it is "
            "quasi-random rather than random, and the papers spend their length on "
            "exactly that.",
        ],
        url="https://www.dst.dk/en/TilSalg/Forskningsservice",
        checked="not fetched",
    ),
]


# ---------------------------------------------------------------------------
# Twenty questions we could ask, and the verdict on each for the weekly posts.
#
# `stake` is what could come out the other way. A question with no possible
# surprise is a description, not a question, and the classmate posts that work
# all have one.
#
# `verdict` places it in the course:
#   week3        fits "who matters, and why": paths, centrality, mixing, cliques
#   companion    a section inside another post rather than a post of its own
#   later        belongs to a week that has not happened yet
#   project      too heavy for one week, strong for the final project
# ---------------------------------------------------------------------------

QUESTION_IDEAS = [
    dict(
        id="gravity-residual",
        group="Shape of the country network",
        title="What is left after gravity?",
        question="Fit distance, population, shared language, shared coloniser and "
                 "contiguity to the migrant stock matrix, then look at the residual "
                 "network. Which corridors carry far more people than geography and "
                 "history predict?",
        stake="The residual could be structureless, in which case migration is "
              "geography and nothing else. If it is not, the residual graph is a map "
              "of everything gravity leaves out.",
        null="The gravity fit itself is the null. Every claim is about the residual.",
        data=["undesa-ims", "cepii-gravity", "cepii-language"],
        verdict="project",
        note="The strongest spine we have for a final project.",
        denmark="Denmark's registered emigration lets you fit the model in both "
                "directions for one country and see whether the residual is symmetric.",
    ),
    dict(
        id="concentrating",
        group="Shape of the country network",
        title="Is migration concentrating or spreading?",
        question="Eight time points from 1990 to 2024. Track the Gini of edge weights, "
                 "the top-10 corridor share and the network entropy.",
        stake="Globalisation predicts spreading. If the corridors are concentrating "
              "instead, the standard story is wrong in a measurable way.",
        null="A degree-preserving shuffle at each time point, so the trend is not just "
             "the degree sequence changing.",
        data=["undesa-ims"],
        verdict="companion",
        note="Not a centrality question, so it cannot carry week 3 alone. Good opening "
             "section for any of the country-network posts.",
    ),
    dict(
        id="core-periphery",
        group="Shape of the country network",
        title="Core-periphery, or communities?",
        question="Does the network have one rich core that exchanges with everyone, or "
                 "distinct regional blocs? Fit both models and report which wins.",
        stake="Most people assume blocs because Louvain always returns some. Testing "
              "the alternative is the whole point.",
        null="Compare the two model fits against each other and against a "
             "degree-preserving shuffle.",
        data=["undesa-ims", "cepii-gravity"],
        verdict="later",
        note="Community detection is week 4. Do not spend it early.",
    ),
    dict(
        id="reciprocity",
        group="Shape of the country network",
        title="Who exchanges, and who only sends?",
        question="Per country, the share of corridors carrying real flow in both "
                 "directions. Then predict it from income and rank the countries that "
                 "defy the prediction.",
        stake="If reciprocity is simply income, there is no finding. The countries off "
              "the line are the story.",
        null="A degree-preserving shuffle gives the reciprocity a country's degree "
             "sequence forces on it.",
        data=["undesa-ims", "wb-wdi"],
        verdict="companion",
        note="DESA reciprocity is measured at 0.60 across 8,795 arcs in the 2024 "
             "network; see analysis/week03_country_facts.json.",
        denmark="Denmark measures emigration rather than estimating it, so its "
                "reciprocity is real where most countries' is an artefact.",
    ),
    dict(
        id="flight-hubs",
        group="Brokers and transit",
        title="Do flight hubs and migration hubs coincide?",
        question="Betweenness on the airport network against betweenness on the "
                 "migration network. Istanbul, Addis Ababa and Dubai should be high on "
                 "both.",
        stake="Where the two rankings diverge is a place that moves people without "
              "keeping them, or keeps them without moving them.",
        null="Degree-preserving shuffles of both networks, so neither ranking is just "
             "its degree sequence.",
        data=["opensky", "openflights", "undesa-ims"],
        verdict="companion",
        note="Inherits the thresholding problem below, and needs a second network "
             "downloaded. Do it after the thresholding is shown to work.",
    ),
    dict(
        id="removal",
        group="Brokers and transit",
        title="Which country's removal breaks the network?",
        question="Remove countries in order of degree, of betweenness and of refugee "
                 "hosting, and watch the giant component shrink under each order.",
        stake="Whether the three orders agree.",
        null="Random removal, as the baseline for every robustness curve.",
        data=["undesa-ims", "unhcr-rdf"],
        verdict="companion",
        note="The group already ran node removal in week 2 and was criticised for it "
             "not being in that brief. Repeating it now reads as recycling.",
    ),
    dict(
        id="transit-lie",
        group="Brokers and transit",
        title="Where does a stock matrix lie about transit?",
        question="Betweenness from DESA against transit prominence in 4Mi route data. "
                 "Name the countries the stock matrix cannot see.",
        stake="The size of the gap between where people are counted and where they "
              "pass through.",
        null="None needed; this is a comparison of two measurements of the same thing.",
        data=["undesa-ims", "mmc-4mi", "iom-dtm"],
        verdict="project",
        note="Needs 4Mi, which is a purposive sample on selected routes. Handle the "
             "sampling honestly or not at all.",
    ),
    dict(
        id="mobility-birth",
        group="Mobility as inequality",
        title="How much of your mobility is decided at birth?",
        question="Closeness centrality on the visa network, one score per passport, "
                 "against the GDP per capita of the issuing country.",
        stake="The strength of the relationship. A single scatter plot makes the point "
              "better than any paragraph.",
        null="Shuffle the visa requirements while preserving each country's count of "
             "requirements, and see how much of the inequality survives.",
        data=["demig-visa", "passport-indices", "wb-wdi"],
        verdict="week3",
        note="Pure closeness, section 3 of the brief. One figure, one download. Works "
             "as the closing section of a bigger post.",
    ),
    dict(
        id="visa-openness-trend",
        group="Mobility as inequality",
        title="Did the world get more open between 1973 and 2013?",
        question="Density of the visa-free network over forty years of DEMIG VISA, "
                 "split into who gained access and who lost it.",
        stake="The aggregate probably rose while specific nationalities fell. If so, "
              "'the world is opening' is true and misleading at once.",
        null="Compare each nationality's trajectory against the global trend.",
        data=["demig-visa"],
        verdict="companion",
        note="A time series rather than a centrality, so it supports a post rather "
             "than being one.",
    ),
    dict(
        id="mobility-hierarchy",
        group="Mobility as inequality",
        title="Map the mobility hierarchy.",
        question="Keep only asymmetric pairs, where A's citizens need a visa for B and "
                 "B's do not need one for A. How close is that directed graph to a "
                 "perfect hierarchy, and who are the anomalies?",
        stake="A perfect hierarchy would be a total order. Every violation is a pair of "
              "countries with a history.",
        null="A random tournament with the same number of arcs.",
        data=["demig-visa", "passport-indices"],
        verdict="companion",
        note="Elegant, and narrower than it first looks.",
    ),
    dict(
        id="openness-causes",
        group="Mobility as inequality",
        title="Does openness cause migration, or follow it?",
        question="Lagged relationships in both directions between visa liberalisation "
                 "and corridor growth.",
        stake="Very likely neither direction is identified. Saying that well is worth "
              "more than a fabricated answer.",
        null="Placebo lags: if a future liberalisation predicts past migration, the "
             "design is broken.",
        data=["demig-visa", "undesa-ims"],
        verdict="project",
        note="A causal question with observational data. Treat with suspicion.",
    ),
    dict(
        id="refugees-different",
        group="Forced versus chosen",
        title="Are refugees a different network from migrants?",
        question="UNHCR against DESA over the same countries. Degree distribution, "
                 "clustering, distance decay, assortativity, and the overlap between "
                 "the two rankings of destinations.",
        stake="The hypothesis is that refugees go next door and migrants go far. The "
              "overlap between the two top-15 destination lists is 4 out of 15: "
              "Germany, France, Iran and Turkey. Eleven countries are top-15 for "
              "migrants and not refugees, eleven the other way.",
        null="A degree-preserving shuffle of each network, plus the distance "
             "distribution each one would have under gravity.",
        data=["unhcr-rdf", "undesa-ims", "cepii-gravity"],
        verdict="week3",
        note="The recommended week 3 post. Covers brief sections 3 to 7, runs entirely "
             "on files already in data/, and the finding is verified in "
             "analysis/week03_country_facts.json.",
    ),
    dict(
        id="hosting-residual",
        group="Forced versus chosen",
        title="Who hosts more refugees than their wealth predicts?",
        question="Regress hosting on GDP and population, then rank the residuals.",
        stake="The answer contradicts most political rhetoric about who carries the "
              "burden, which is exactly why it is worth publishing.",
        null="The regression is the null; the residual is the result.",
        data=["unhcr-rdf", "wb-wdi"],
        verdict="companion",
        note="Node attributes rather than network structure, so it belongs inside a "
             "post rather than being one.",
    ),
    dict(
        id="conflict-edge",
        group="Forced versus chosen",
        title="Does a new conflict create a new edge, and how fast?",
        question="Conflict onset in ACLED against the appearance of a refugee corridor "
                 "in UNHCR. Measure the lag.",
        stake="Whether the lag is weeks or years, and whether it depends on distance.",
        null="Country pairs with no conflict onset, over the same window.",
        data=["acled-ucdp", "unhcr-rdf", "unhcr-operational"],
        verdict="project",
        note="UNHCR's annual series is too coarse for the lag; the operational portal "
             "is the daily version and only covers active emergencies.",
    ),
    dict(
        id="corridors-close",
        group="Forced versus chosen",
        title="Do displacement corridors close again?",
        question="After a conflict ends, which refugee edges reverse and which become "
                 "permanent migration?",
        stake="Whether displacement is a shock the network absorbs or a shock that "
              "rewires it.",
        null="Corridors of the same size that never carried refugees.",
        data=["unhcr-rdf", "undesa-ims"],
        verdict="project",
        note="Needs the UNHCR time series, not the single year now in data/.",
    ),
    dict(
        id="ngo-global",
        group="The organisation network",
        title="Is the migration NGO world global, or a pile of national ones?",
        question="Attribute assortativity by country on the organisation link network, "
                 "tested against a shuffle of the country labels.",
        stake="If organisations link overwhelmingly within their own country, 'global "
              "migration governance' is a claim the network does not support. The "
              "handful of bodies that do bridge become the finding.",
        null="Shuffle the country labels across nodes rather than shuffling the links. "
             "This is the right null for homophily and it is exercise 3.9 in the brief.",
        data=["wikidata-orgs"],
        verdict="week3",
        note="Best coverage of the brief: assortativity in section 7, cliques in "
             "section 8, centrality in sections 3 to 5, and it uses our own harvested "
             "dataset. Blocked until the Wikidata classification stage runs over the "
             "20,849 crawled candidates.",
        denmark="CVR holds every registered Danish organisation, not only the ones "
                "Wikipedia found notable, so the Danish slice can be checked against a "
                "complete population.",
    ),
    dict(
        id="aid-enforcement-broker",
        group="The organisation network",
        title="Who brokers between aid and enforcement?",
        question="Label organisations humanitarian, advocacy, border enforcement or "
                 "research, then find the nodes with high betweenness between the "
                 "enforcement cluster and the aid cluster.",
        stake="Whether the two worlds touch at all, and through whom.",
        null="A degree-preserving shuffle, so a broker is not just a hub.",
        data=["wikidata-orgs"],
        verdict="week3",
        note="Shares a pipeline with the question above and makes a natural second "
             "section of the same post.",
    ),
    dict(
        id="field-built",
        group="The organisation network",
        title="When was this field built?",
        question="Founding dates of migration organisations against the crises that "
                 "preceded them. Do organisations appear after shocks, and how long "
                 "after?",
        stake="A visible lag would mean the organisational field is reactive. No lag "
              "would mean something else entirely.",
        null="Founding dates of organisations in an unrelated domain over the same "
             "period.",
        data=["wikidata-orgs"],
        verdict="companion",
        note="Wikidata P571 is already harvested for every organisation.",
    ),
    dict(
        id="attention-money",
        group="The organisation network",
        title="Attention against money.",
        question="Wikipedia language editions and pageviews per organisation, against "
                 "the funding it actually receives in OCHA FTS.",
        stake="The organisations with money and no attention, and with attention and "
              "no money, are both stories.",
        null="The relationship you would expect if attention simply tracked size.",
        data=["wikidata-orgs", "ocha-fts", "wikimedia-clickstream"],
        verdict="project",
        note="Needs FTS organisation names reconciled against Wikidata items, which is "
             "the entity-resolution job that makes it a project rather than a week.",
    ),
    dict(
        id="shared-vocabulary",
        group="Language, for weeks 5 to 8",
        title="Do border agencies and refugee charities describe the same thing?",
        question="TF-IDF over the Wikipedia article of every organisation, grouped by "
                 "organisation type. Then the week 8 move: do the communities in the "
                 "link network also share vocabulary?",
        stake="If the vocabularies barely overlap, the migration field does not share a "
              "language, and that becomes measurable instead of asserted.",
        null="Shuffle the type labels across articles and recompute the vocabulary "
             "separation.",
        data=["wikidata-orgs", "folketinget-oda"],
        verdict="later",
        note="Weeks 5 to 8. Folketinget gives a Danish-language parliamentary corpus "
             "for the same question in a single country.",
    ),
]
