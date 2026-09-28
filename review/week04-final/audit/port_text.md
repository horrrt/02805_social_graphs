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

## RS1

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### place>opener
- **opener#1**
  - before: Cities group by who hires there, not by region, and no single link holds the map together.
  - after: Cities group by who hires there, and no single link holds the map together.

### place>w4-intro
- **para#0**
  - before: The cities are the 40 metro areas with the most filings, 84.5% of the year's total. Louvain splits the 40 metros into three groups: seven large hubs led by New York and Dallas, eight tech hubs led by San Jose and San Francisco, and the other 25. The split is weak but real: modularity 0.049 against 0.013 for rewired networks in which each company keeps its number of metros (z = 29). The two questions below ask what the groups follow and where the network comes apart.
  - after: The cities are the 40 metro areas with the most filings, 84.5% of the year's total. Louvain splits them into three groups, and the split is weak but real: modularity 0.049 against 0.013 for rewired networks (z = 29).
- **drawers#0**
  - before: Method Two metros are linked when the same company files in both; the link weighs, summed over those companies, the smaller of the company's two filing counts.
  - after: Background Seven large hubs led by New York and Dallas, eight tech hubs led by San Jose and San Francisco, and the other 25. The rewired networks keep each company's number of metros. The two questions below ask what the groups follow and where the network comes apart. Method Two metros are linked when the same company files in both; the link weighs, summed over those companies, the smaller of the company's two filing counts.

### place-start
- **q-answer#1**
  - before: Not regional markets. Louvain splits the large hubs into two groups, which cross regions, and leaves the smaller metros as a third.
  - after: Not regional markets: the two hub groups cross regions.
- **para#1**
  - before: Toggle Louvain communities against Census regions on the same map.
  - after: Louvain splits the large hubs into two groups, which cross regions, and leaves the smaller metros as a third. Toggle Louvain communities against Census regions on the same map.
- **notice#0**
  - before: What to notice San Jose's 48,692 filings request 124,265 positions, 2.6 per filing, and Google files one in ten of them. New York files more (65,935) from three times as many employers (12,711), with 1.5 positions per filing, and its largest filer, EY, has under 4%.
  - after: What to notice San Jose's 48,692 filings request 124,265 positions, and Google files one in ten of them. New York files more (65,935) from three times as many employers (12,711).
- **notice#1**
  - before: What to notice One group holds New York, Dallas, Atlanta, Chicago, Houston, Philadelphia and Charlotte. The other holds San Jose, San Francisco, Seattle, Los Angeles, San Diego, Austin, Boston and Washington. The 25 smaller metros form the third. The split is real but weak: modularity is 0.049 against 0.013 for rewired networks that keep each company's number of metros (z = 29), and Louvain finds it in 65 of 100 runs; the other 35 find one other split, into two groups. NMI, normalized mutual information, scores how alike two groupings are, from 0 for unrelated to 1 for the same. 2024 gives that two-group split in all 100 runs, so it matches the split shown here at NMI 0.64, against 1.00 between two 2025 runs. NMI with Census regions is 0.14 and with divisions 0.21, no better than shuffled labels (p = 0.10 and 0.11). Infomap, which follows a random walk between metros instead of counting links, finds no split at all: one module holds all 40.
  - after: What to notice The split is real but weak: Louvain finds it in 65 of 100 runs. Census regions and divisions match it no better than shuffled labels (p = 0.10 and 0.11).
- **drawers#0**
  - before: Background The map shows the partition Louvain finds most often, and every number below is computed on it. The null rewires the company × metro network so each company and each metro keeps its number of partners, deals the filing counts back out at random, and projects it again: Method A filing counts once in each metro it names, with at most the positions it requests. More numbers In Seattle one company, Amazon, files 31%. Positions reward a few firms asking for many seats; employer counts reward a broad market. Maps: groups and Census regions Communities Census regions On the map The 48 contiguous states; none of the 40 metros lies outside them. Bubbles are sized by requested positions; colour and opacity follow the active metric. Each metro sits at its first-named city. Click a bubble to select it. Same cities, two labelings The same map, coloured by the active labelling. Communities are named after their two largest metros. Click a city to select it.
  - after: Background The map shows the partition Louvain finds most often, and every number below is computed on it. The null rewires the company × metro network so each company and each metro keeps its number of partners, deals the filing counts back out at random, and projects it again: One group holds New York, Dallas, Atlanta, Chicago, Houston, Philadelphia and Charlotte. The other holds San Jose, San Francisco, Seattle, Los Angeles, San Diego, Austin, Boston and Washington. The 25 smaller metros form the third. Modularity is 0.049 against 0.013 for rewired networks that keep each company's number of metros (z = 29). Louvain finds the split shown in 65 of 100 runs; the other 35 find one other split, into two groups. 2024 gives that two-group split in all 100 runs, so it matches the split shown here at NMI 0.64, against 1.00 between two 2025 runs. NMI with Census regions is 0.14 and with divisions 0.21. Infomap, which follows a random walk between metros instead of counting links, finds no split at all: one module holds all 40. Method A filing counts once in each metro it names, with at most the positions it requests. More numbers In Seattle one company, Amazon, files 31%. Positions reward a few firms asking for many seats; employer counts reward a broad market. San Jose averages 2.6 positions per filing, New York 1.5. New York's largest filer, EY, has under 4%. Maps: groups and Census regions Communities Census regions On the map The 48 contiguous states; none of the 40 metros lies outside them. Bubbles are sized by requested positions; colour and opacity follow the active metric. Each metro sits at its first-named city. Click a bubble to select it. Same cities, two labelings The same map, coloured by the active labelling. Communities are named after their two largest metros. Click a city to select it.

### place-who
- **q-answer#0**
  - before: By who hires. The groups follow how much of a city's hiring runs through consulting and IT-services firms better than they follow Census regions.
  - after: By who hires.
- **para#0**
  - before: Each bar is the adjusted mutual information (AMI) between the Louvain groups and one labelling: 0 means no better than labels dealt at random, 1 means the same grouping.
  - after: The groups follow how much of a city's hiring runs through consulting and IT-services firms. Each bar is the AMI between the Louvain groups and one labelling.
- **notice#0**
  - before: What to notice The IT-services share matches the groups at AMI 0.17 (p = 0.002) and the placed share at 0.12 (p = 0.012). Census regions reach 0.06 (p = 0.11) and divisions 0.06 (p = 0.08), no better than chance. The match is modest: most of what makes two metros alike stays unexplained.
  - after: What to notice The IT-services share matches the groups at AMI 0.17 (p = 0.002) and the placed share at 0.12 (p = 0.012); Census regions and divisions do no better than chance. The match is modest: most of what makes two metros alike stays unexplained.
- **drawers#0**
  - before: Method We gave each metro four labels: its Census region, its Census division, the third it falls in by the share of its filings that place a worker at a client, and the third it falls in by the share filed by professional and technical services firms (NAICS 54, the sector of IT consultancies). Thirds, because 35 of the 40 metros have that sector as their largest, so "largest sector" says almost nothing. AMI corrects for the number of labels, so four regions and three thirds compare fairly. More numbers Seven of the eight tech-hub metros sit in the lowest third by placed share: there, companies mostly hire for themselves. In the New York–Dallas group the median metro places 27% of its filings at a client and files 60% through IT-services firms.
  - after: Method We gave each metro four labels: its Census region, its Census division, the third it falls in by the share of its filings that place a worker at a client, and the third it falls in by the share filed by professional and technical services firms (NAICS 54, the sector of IT consultancies). Thirds, because 35 of the 40 metros have that sector as their largest, so "largest sector" says almost nothing. AMI corrects for the number of labels, so four regions and three thirds compare fairly. More numbers Seven of the eight tech-hub metros sit in the lowest third by placed share: there, companies mostly hire for themselves. In the New York–Dallas group the median metro places 27% of its filings at a client and files 60% through IT-services firms. Census regions reach 0.06 (p = 0.11) and divisions 0.06 (p = 0.08), no better than chance.

### place-break
- **q-answer#0**
  - before: Nowhere in one place. The map sheds metros one or two at a time, and the big outsourcing firms hold no more of those links than of any others.
  - after: Nowhere in one place: metros drop off one or two at a time.
- **para#0**
  - before: Every pair of the 40 metros shares some employer, so the full network is one hairball of 780 links. Tried at five values, the largest piece of the map fell from 32 metros at α = 0.1 to 18 at α = 0.05, which looks like one snap. So we removed the links one by one, least significant first, and watched the largest piece after each removal.
  - after: Every pair of the 40 metros shares some employer, so the full network is one hairball of 780 links. We removed the links one by one, least significant first by α, and watched the largest piece after each removal.
- **notice#0**
  - before: What to notice The first metro falls off at α = 0.136. No single removal cuts off more than two metros: Dallas–Durham at α = 0.041 takes Durham and Raleigh with it, and New York–Seattle at 0.023 splits the last five metros three and two. The fall from 32 to 18 is 14 separate links, each peeling one metro away. Of the 16 links whose removal cuts a metro loose, the five largest placing firms (Tata Consultancy Services, Cognizant, Infosys, HCL, Compunnel) lead 5 (31%): Cognizant four, HCL one. That is no more than their 70 of the 180 links in the whole backbone at α = 0.2 (38%, p = 0.37).
  - after: What to notice The big outsourcing firms hold no more of the links that cut metros loose than of any others. Of the 16 links whose removal cuts a metro loose, the five largest placing firms lead 5 (31%), no more than their share of the whole backbone (38%, p = 0.37).
- **drawers#0**
  - before: Method The disparity filter keeps a link when it carries an unusually large share of either metro's total weight; α is the test's threshold, and a smaller α keeps fewer links. More numbers The other eleven are led by Amazon (three), Intel, Deloitte, Capital One, JPMorgan Chase, Citigroup, FedEx, Fidelity Investments and the University of Maryland. Table: 14 links that peel metros off Link α Weight Leading company Its share
  - after: Method Tried at five values, the largest piece of the map fell from 32 metros at α = 0.1 to 18 at α = 0.05, which looks like one snap. The disparity filter keeps a link when it carries an unusually large share of either metro's total weight; α is the test's threshold, and a smaller α keeps fewer links. More numbers The other eleven are led by Amazon (three), Intel, Deloitte, Capital One, JPMorgan Chase, Citigroup, FedEx, Fidelity Investments and the University of Maryland. The first metro falls off at α = 0.136. The fall from 32 to 18 is 14 separate links, each peeling one metro away. That is no more than their 70 of the 180 links in the whole backbone at α = 0.2 (38%, p = 0.37). No single removal cuts off more than two metros: Dallas–Durham at α = 0.041 takes Durham and Raleigh with it, and New York–Seattle at 0.023 splits the last five metros three and two. Table: 14 links that peel metros off Link α Weight Leading company Its share

**Terms added:** 
- `w4-term-place-start-p`
- `w4-term-place-start-nmi`
- `w4-term-place-who-ami`
- `w4-term-place-who-placed`
- `w4-term-place-break-placing`
- `w4-term-place-break-backbone`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- place-start kicker#0: board numbers ['two'] not in the page slot; board text: Two first questions, side by side, before 1A
- place-start para#1: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** 
- place>w4-intro: ['40']
- place-break: ['four', 'one']

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** 
- #place-region-legend: board «New York–Dallas San Jose–San Francisco Detroit–Phoenix» page «»

**Text that still differs from the board, outside script-owned nodes:** 
- place-start: page «The opening» board «Two first»
- place-start: page «» board «San Jose, Seattle, San Francisco, Austin, Washington, Boston, Los Angeles, San Diego»
- place-start: page «» board «New York, Dallas, Chicago, Atlanta, Philadelphia, Houston, Charlotte»
- place-start: page «» board «Raleigh and»
- place-start: page «» board «down Raleigh, Detroit, Phoenix, Salt Lake City, St. Louis, Miami, Minneapolis, Portland, Tampa, Denver, Columbus, Pittsburgh,»
- place-start: page «Phoenix down» board «13 more»

**Style lint (3.7) on the page text:** no new hits

## RS2

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### jobs>w4-card
- **para#0**
  - before: Two occupations are linked when the same companies file for both. Clusters come from the whole network of … occupations, and they are real: modularity … against … for rewired networks in which every company keeps its number of occupations. Software developers sit in almost every company's mix, so most links run through them. The two questions below test the clusters from two sides: do outsourcing firms and direct employers bundle jobs the same way, and does any job belong to two bundles at once?
  - after: Two occupations are linked when the same companies file for both. The clusters across all … occupations are real: modularity … against … for rewired networks.
- **drawers#0 (added)**
  - before: (none)
  - after: Background Software developers sit in almost every company's mix, so most links run through them. The two questions below test the clusters from two sides: do outsourcing firms and direct employers bundle jobs the same way, and does any job belong to two bundles at once?

### jobs-together
- **para#0**
  - before: Each bar is a pair among the 60 largest occupations. Its length is the number of companies that filed for both, not the number of workers requested.
  - after: Each bar is one pair of jobs that the same companies hire for. Its length counts the companies that filed for both; the dark bars are pairs with Software Developers.

### jobs-split
- **para#0**
  - before: Each group gets its own occupation network and its own Louvain clusters, and the normalized mutual information (NMI) says how alike the two clusterings are on the 217 occupations that sit in a cluster of two or more on both sides.
  - after: Each group gets its own occupation network and its own Louvain clusters. NMI says how alike the two clusterings are.
- **drawers#0**
  - before: Method We split the companies in two: the 817 firms that place 20 or more filings at client sites (21% of all filings) and the 58,379 others. Alone, that number means little: splitting companies into a small and a large group changes the clusters even if nobody behaves differently. So the baseline draws 20 random groups that match the outsourcing firms in both respects: the same number of companies of each size, from the one-filing firms to the giants. More numbers The half-matched baselines show why the match matters: random groups with only the same number of companies hold 1.3% of filings and agree at 0.43 ± 0.09, which would have hidden the difference. At the top the two mixes look alike: software developers are 28% of the outsourcing firms' filings and 33% of the direct employers'. Below that they part: "computer occupations, all other" is 22% of the outsourcing firms' filings and 5% of the direct employers', and direct employers file for 276 occupations the outsourcing firms never touch.
  - after: Method We split the companies in two: the 817 firms that place 20 or more filings at client sites (21% of all filings) and the 58,379 others. Alone, that number means little: splitting companies into a small and a large group changes the clusters even if nobody behaves differently. So the baseline draws 20 random groups that match the outsourcing firms in both respects: the same number of companies of each size, from the one-filing firms to the giants. NMI is measured on the 217 occupations that sit in a cluster of two or more on both sides. More numbers The half-matched baselines show why the match matters: random groups with only the same number of companies hold 1.3% of filings and agree at 0.43 ± 0.09, which would have hidden the difference. At the top the two mixes look alike: software developers are 28% of the outsourcing firms' filings and 33% of the direct employers'. Below that they part: "computer occupations, all other" is 22% of the outsourcing firms' filings and 5% of the direct employers', and direct employers file for 276 occupations the outsourcing firms never touch.

### jobs-linkcom
- **notice#0**
  - before: What to notice A job's number of communities mostly counts its links (Spearman 0.84), so the table ranks by communities per link, as the course suggests. Two methods give two different lists of small occupations, so we cannot name a job that clearly sits in two clusters.
  - after: What to notice Two methods give two different lists of small occupations, so we cannot name a job that clearly sits in two clusters.
- **drawers#0**
  - before: Method The cut is chosen where partition density D, the average of how close each community is to a complete one, peaks. On the 28,096 links between 494 occupations it peaks at D = 0.57 with one community holding 85% of the links; 117 communities have three links or more, counting it. More numbers The top is small occupations such as communications equipment operators and electrical power-line installers (5 communities over 11 links each). Only 3 of the 6 occupations that section 2's first test flagged as bridges appear in it: credit counselors, licensed practical and licensed vocational nurses, and physical therapist aides. Table: 15 jobs in the most communities Occupation Links Communities Per link
  - after: Method The cut is chosen where partition density D, the average of how close each community is to a complete one, peaks. On the 28,096 links between 494 occupations it peaks at D = 0.57 with one community holding 85% of the links; 117 communities have three links or more, counting it. More numbers The top is small occupations such as communications equipment operators and electrical power-line installers (5 communities over 11 links each). Only 3 of the 6 occupations that section 2's first test flagged as bridges appear in it: credit counselors, licensed practical and licensed vocational nurses, and physical therapist aides. A job's number of communities mostly counts its links (Spearman 0.84), so the table ranks by communities per link, as the course suggests. Table: 15 jobs in the most communities Occupation Links Communities Per link

**Terms added:** 
- `w4-term-jobs-modularity`
- `w4-term-jobs-rewired`
- `w4-term-jobs-split-louvain`
- `w4-term-jobs-split-nmi`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- jobs>w4-card para#0: board numbers [] not in the page slot; board text: override used
- jobs-together para#0: board numbers [] not in the page slot; board text: override used
- jobs-split notice#0: board numbers ['-4.1'] not in the page slot; board text: What to notice The two clusterings agree at NMI 0.42. Random groups matched on size agree at 0.61 ± 0.04 (z = −4.1), so the outsourcing firms bundle jobs differently from companies like them.
- jobs-split drawers#0: board numbers [] not in the page slot; board text: override used
- jobs-linkcom figcaption#1: board numbers ['two'] not in the page slot; board text: The 15 jobs with the most communities per link Each dot is a job; dashed lines mark equal rates. Rings: the two jobs section 2's first test flagged as bridges.
- jobs-linkcom drawers#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** 
- jobs-together: ['60']

**Numbers in new term definitions (check each is a scale, not a result):** 
- jobs-split para#0: ['1', '0'] in «Normalized mutual information: a score for how alike two groupings are, 1 when they match exactly and 0 when they are unrelated.»

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- jobs>w4-card: page «…» board «501»
- jobs>w4-card: page «…» board «0.29»
- jobs>w4-card: page «…» board «0.03»
- jobs-split: page «−4.2),» board «−4.1),»
- jobs-split: page «0.43» board «0.44»
- jobs-split: page «0.09,» board «0.10,»
- jobs-split: page «276» board «283»
- jobs-linkcom: page «three» board «two»
- jobs-linkcom: page «28,096» board «28,155»
- jobs-linkcom: page «494» board «501»
- jobs-linkcom: page «links; 117 communities have» board «links and 121 small ones of»
- jobs-linkcom: page «more, counting» board «more beside»
- jobs-linkcom: page «communications equipment operators and electrical power-line installers (5» board «physical therapist aides (4»
- jobs-linkcom: page «11 links each).» board «10 links).»
- jobs-linkcom: page «3» board «2»
- jobs-linkcom: page «6» board «5»
- jobs-linkcom: page «credit counselors, licensed practical» board «interviewers»
- jobs-linkcom: page «licensed vocational nurses, and physical therapist aides.» board «electrical power-line installers.»

**Style lint (3.7) on the page text:** no new hits

## RS3

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### who>opener
- **opener#1**
  - before: One certified H-1B filing in five names a client company as the worksite. Held to a random baseline, clients group only weakly, and slightly more by the firm that staffs them than by industry. Yet a client that changes vendor stays inside its group far more often than chance.
  - after: One certified H-1B filing in five names a client company as the worksite. Against a random baseline clients group only weakly, yet a client that changes vendor stays inside its group far more often than chance.

### who>w4-card
- **para#0**
  - before: Here the network links an outsourcing firm to each client company where it places workers, and a link weighs the filings between them. Louvain runs on the largest connected piece: 21,759 firms and clients, 41,212 links. Counted once per link, the groups beat rewired networks in which every firm and client keeps its number of partners (modularity 0.57 against 0.53), and they match each client's main vendor (AMI 0.11) a little better than its industry (0.07). The three questions below ask whether the groups behave like markets.
  - after: Here the network links an outsourcing firm to each client company where it places workers, and a link weighs the filings between them. Counted once per link, the Louvain groups beat rewired networks on modularity (0.57 against 0.53) and match each client's main vendor (AMI 0.11) a little better than its industry (0.07).
- **drawers#0 (added)**
  - before: (none)
  - after: Method Louvain runs on the largest connected piece: 21,759 firms and clients, 41,212 links. The rewired networks keep every firm's and client's number of partners. The three questions below ask whether the groups behave like markets.

### who-q1
- **para#0**
  - before: A filing is a request to employ someone, not a hire. Placing firms also fare worse at USCIS: every year from 2022 on, it denied about twice the share of their first-time petitions, 2.7% against 1.2% for direct employers in 2022 and 3.4% against 2.0% from October 2025 to June 2026.
  - after: A filing is a request to employ someone, not a hire. Every year from 2022 on, USCIS denied placing firms about twice the share of first-time petitions it denied direct employers.
- **drawers#0**
  - before: Method The worksites file lists every client a filing names; we leave out the 16% of client entries that name no company, such as "Home Address", and the 1,881 where a firm names itself. Counted that way, 101,763 filings (18.9%) name a client company: the worker is employed by one company and works at another, down from 21.9% in 2022. More numbers The lottery shows the same split one step earlier. Each new H-1B worker starts as a registration that USCIS draws at random, and USCIS gave Bloomberg News every registration from the March 2023 draw after a FOIA lawsuit. Every petition that followed names its filing, so we can follow a ticket to its client. Direct employers sent 5.1 registrations per approved petition, placing firms 9.1, and firms with fewer than 20 filings 12.2; those small firms sent 53% of the 758,967 registrations. Most of the gap is drawn tickets nobody used. When USCIS drew a direct employer's registration, a petition followed 76% of the time; a placing firm's, 50%; a small firm's, 35%. That step carries 74% of the gap between placing and direct firms, and the draw itself 24%. Much of it comes from workers registered by several employers: 54% of registrations named one, and when USCIS drew one, a petition followed 23% of the time, against 81% for a worker registered once. 18,307 of the petitions lead to a client company. Citigroup received the most, 342 through 38 firms.
  - after: Method The worksites file lists every client a filing names; we leave out the 16% of client entries that name no company, such as "Home Address", and the 1,881 where a firm names itself. Counted that way, 101,763 filings (18.9%) name a client company: the worker is employed by one company and works at another, down from 21.9% in 2022. More numbers USCIS denied 2.7% of placing firms' first-time petitions against 1.2% for direct employers in 2022, and 3.4% against 2.0% from October 2025 to June 2026. The lottery shows the same split one step earlier. Each new H-1B worker starts as a registration that USCIS draws at random, and USCIS gave Bloomberg News every registration from the March 2023 draw after a FOIA lawsuit. Every petition that followed names its filing, so we can follow a ticket to its client. Direct employers sent 5.1 registrations per approved petition, placing firms 9.1, and firms with fewer than 20 filings 12.2; those small firms sent 53% of the 758,967 registrations. Most of the gap is drawn tickets nobody used. When USCIS drew a direct employer's registration, a petition followed 76% of the time; a placing firm's, 50%; a small firm's, 35%. That step carries 74% of the gap between placing and direct firms, and the draw itself 24%. Much of it comes from workers registered by several employers: 54% of registrations named one, and when USCIS drew one, a petition followed 23% of the time, against 81% for a worker registered once. 18,307 of the petitions lead to a client company. Citigroup received the most, 342 through 38 firms.

### who-switch
- **notice#0**
  - before: What to notice Pooled over the three pairs of years, 26.5% of switches stay in the group against 3.2% ± 0.5% for random vendors (z = 47). Much of that is familiarity: 62% of new main vendors already placed someone at the client the year before. The groups hold some information about where a client turns next beyond the vendors it already knows.
  - after: What to notice Pooled over the three pairs of years, 26.5% of switches stay in the group against 3.2% ± 0.5% for random vendors (z = 47). Much of that is familiarity: 62% of new main vendors already placed someone at the client the year before.

### who-movers
- **q-answer#0**
  - before: Two in three, but much of that is Louvain's own noise, and the movers are not mainly the clients with several vendors.
  - after: Two in three, but much of that is Louvain's own noise.
- **para#0**
  - before: We ran Louvain with links weighted by filings and with every link counting one, matched each weighted group to the unweighted group it overlaps most, and called a client a mover when its matched group changed. Two runs of the same kind with different seeds set the noise floor.
  - after: We ran Louvain with links weighted by filings and with every link counting one, and called a client a mover when its group changed. Two runs of the same kind with different seeds set the noise floor.
- **notice#0**
  - before: What to notice 64.4% of clients move between the weighted and unweighted partitions. Two runs of the same kind move fewer: a median 33.3% between two weighted seeds and 53.1% between two unweighted ones, over ten pairs of seeds each (ranges 26.8% to 39.3% and 49.4% to 55.9%).
  - after: What to notice 64.4% of clients move between the weighted and unweighted partitions. Two runs of the same kind move fewer: a median 33.3% between two weighted seeds and 53.1% between two unweighted ones.
- **drawers#0**
  - before: More numbers We expected the movers to be clients with several vendors, since only their filing counts can pull them one way or another. They are, but barely: 31.8% of movers have two or more vendors, against 26.8% of all clients. The largest movers are the largest clients: Citigroup sits with Tata Consultancy Services when filings count and with EY when they do not; Bank of America moves from Infosys' group to IBM's. Table: 15 largest movers Client Filings Vendors Group, weighted Group, unweighted A group is named after its largest firm.
  - after: Method We matched each weighted group to the unweighted group it overlaps most, and called a client a mover when its matched group changed. More numbers The medians come from ten pairs of seeds each (ranges 26.8% to 39.3% and 49.4% to 55.9%). We expected the movers to be clients with several vendors, since only their filing counts can pull them one way or another. They are, but barely: 31.8% of movers have two or more vendors, against 26.8% of all clients. The largest movers are the largest clients: Citigroup sits with Tata Consultancy Services when filings count and with EY when they do not; Bank of America moves from Infosys' group to IBM's. Table: 15 largest movers Client Filings Vendors Group, weighted Group, unweighted A group is named after its largest firm.

### who-overlap
- **q-answer#0**
  - before: 1,823 clients get a fifth or more of their filings from a second group, fewer than in rewired networks that keep each client's filing counts.
  - after: 1,823 clients get a fifth or more of their filings from a second group, fewer than in rewired networks.
- **notice#0**
  - before: What to notice The rewired networks give 2,154 ± 20 split clients (z = −16), so real clients draw on fewer groups than the same filing counts spread at random would. Read the count as the groups following clients' main suppliers, not as a separate measure of loyalty.
  - after: What to notice The rewired networks give 2,154 ± 20 split clients (z = −16): real clients draw on fewer groups than chance. Read the count as the groups following clients' main suppliers, not as a separate measure of loyalty.

**Terms added:** 
- `w4-term-who-louvain`
- `w4-term-who-rewired`
- `w4-term-who-modularity`
- `w4-term-who-ami`
- `w4-term-who-switch-z`
- `w4-term-who-movers-seeds`
- `w4-term-who-movers-partition`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- who>w4-card figcaption#1: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** 
- who>w4-card para#0: ['two'] in «A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get. It starts from a random order, so two runs can differ.»
- who>w4-card para#0: ['two'] in «Adjusted mutual information: how closely two ways of grouping the same clients agree, corrected for the agreement random labels would reach by chance.»

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- who>w4-card: page «The client's» board «{{egoClientName}}'s»
- who>w4-card: page «the year;» board «{{egoYear}}{{egoMonths}}, {{egoVendors}} firms in all;»

**Style lint (3.7) on the page text:** no new hits

## RS4

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### footprint>w4-intro
- **para#0**
  - before: A handful of companies file a large share of everything: the five largest placing firms (Tata Consultancy Services, Cognizant, Infosys, HCL, Compunnel) file 5.6% of the filings in the 40 metros, and the ten largest filers of any kind 19.1%. A company that files everywhere links every pair of metros and every pair of its jobs, so its footprint could be all the structure there is.
  - after: The ten largest filers file 19.1% of the filings in the 40 metros, and the five largest placing firms 5.6%. A company that files everywhere links every pair of metros and jobs, so its footprint could be all the structure there is.
- **notice#0**
  - before: What to notice Without the ten largest filers (Amazon, Cognizant, Google, Microsoft, EY, Meta, Deloitte, Apple, Tata Consultancy Services, Infosys), the metro groups match Census regions at AMI 0.13 (p = 0.013), against 0.06 for the full network and 0.01 ± 0.03 for random cuts, 4.6 standard deviations away. The national employers are what hide the regional pattern. The job clusters hold at NMI 0.90 and 0.81, but random cuts of the same volume leave them closer still (0.96 and 0.88, 3.1 and 3.9 standard deviations away), so the biggest firms do shape which jobs cluster together.
  - after: What to notice Without the ten largest filers, the metro groups match Census regions at AMI 0.13, against 0.06 for the full network: the national employers hide the regional pattern. The job clusters hold (NMI 0.90 and 0.81) but shift more than random cuts of the same volume do.
- **drawers#0**
  - before: Method We removed each set, reran 100 Louvain runs on the metro network and on the job network (weighted here by filings, since a count of companies barely moves when ten of 59,196 leave), and compared the groups with the full network's. Removing less data changes the groups too, so each removal sits beside 50 random cuts of companies that remove the same share of filings. More numbers Removing the five placing firms changes little: the groups stay close to the full network's (NMI 0.92, random cuts 0.85 ± 0.14), and the regional match rises only to 0.09, inside the range of random cuts (0.04 ± 0.05). Without the ten largest filers the clusters also sharpen, modularity rising from 0.28 to 0.32. Every version still beats its own rewired networks by a wide margin (z = 25 or more).
  - after: Background The five largest placing firms are Tata Consultancy Services, Cognizant, Infosys, HCL and Compunnel. The ten largest filers are Amazon, Cognizant, Google, Microsoft, EY, Meta, Deloitte, Apple, Tata Consultancy Services and Infosys. Method We removed each set, reran 100 Louvain runs on the metro network and on the job network (weighted here by filings, since a count of companies barely moves when ten of 59,196 leave), and compared the groups with the full network's. Removing less data changes the groups too, so each removal sits beside 50 random cuts of companies that remove the same share of filings. More numbers Removing the five placing firms changes little: the groups stay close to the full network's (NMI 0.92, random cuts 0.85 ± 0.14), and the regional match rises only to 0.09, inside the range of random cuts (0.04 ± 0.05). Without the ten largest filers the clusters also sharpen, modularity rising from 0.28 to 0.32. Every version still beats its own rewired networks by a wide margin (z = 25 or more). Without the ten largest filers the regional match has p = 0.013, against 0.01 ± 0.03 for random cuts, 4.6 standard deviations away. Random cuts leave the job clusters closer to the full network's (0.96 and 0.88, 3.1 and 3.9 standard deviations away), so the biggest firms do shape which jobs cluster together.

### footprint-which
- **para#0**
  - before: We removed each of the ten largest filers alone, and then the top 1, 2, 3 … 20 filers in turn, each time beside random cuts of companies that remove the same share of filings (50 for a single firm, 20 for each step of the sweep).
  - after: We removed each of the ten largest filers alone, then the top 1, 2, 3 … 20 filers in turn. Each removal sits beside random cuts of companies that remove the same share of filings.
- **notice#0**
  - before: What to notice Amazon files 5.1% of the filings in the 40 metros. Without it alone, the metro groups match Census regions at AMI 0.14 (3.5 standard deviations above its random cuts), more than the 0.13 without all ten. No other single firm pushes the match up beyond its random cuts: removing EY, Meta, Deloitte or Apple alone tips Louvain into a two-group split that ignores regions (AMI −0.005).
  - after: What to notice Amazon files 5.1% of the filings in the 40 metros. Without it alone, the metro groups match Census regions at AMI 0.14, more than the 0.13 without all ten.
- **drawers#0**
  - before: More numbers Removed in rank order, the largest filers keep the match above random cuts at every step from one to twenty, but not smoothly: it dips to about 0.07 without the top 17 to 19, where several partitions compete, and peaks at 0.20 without the top 20. 2024 tells the same story more strongly. Its full network shows no regional match (AMI −0.005); without its ten largest filers the match is 0.22 (p = 0.001), against −0.01 ± 0.01 for random cuts.
  - after: Method 50 random cuts for a single firm, 20 for each step of the sweep. More numbers Amazon's 0.14 sits 3.5 standard deviations above its random cuts. No other single firm pushes the match up beyond its random cuts: removing EY, Meta, Deloitte or Apple alone tips Louvain into a two-group split that ignores regions (AMI −0.005). Removed in rank order, the largest filers keep the match above random cuts at every step from one to twenty, but not smoothly: it dips to about 0.07 without the top 17 to 19, where several partitions compete, and peaks at 0.20 without the top 20. 2024 tells the same story more strongly. Its full network shows no regional match (AMI −0.005); without its ten largest filers the match is 0.22 (p = 0.001), against −0.01 ± 0.01 for random cuts.

**Terms added:** 
- `w4-term-footprint-placing`
- `w4-term-footprint-ami`
- `w4-term-footprint-nmi`
- `w4-term-footprint-louvain`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- footprint>w4-intro notice#0: board numbers [] not in the page slot; board text: override used
- footprint>w4-intro drawers#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** 
- footprint>w4-intro notice#0: ['0', 'two'] in «Adjusted mutual information: how closely two ways of grouping the same items agree. 0 is what chance gives, 1 is a perfect match.»
- footprint>w4-intro notice#0: ['0', 'two'] in «Normalised mutual information: how much two groupings of the same items agree, from 0 (unrelated) to 1 (identical).»

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- footprint>w4-intro: page «0.81)» board «0.82)»
- footprint>w4-intro: page «3.1» board «3.0»
- footprint>w4-intro: page «3.9» board «3.2»

**Style lint (3.7) on the page text:** no new hits

## RS5

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### beyond>w4-card
- **answers#0 (added)**
  - before: (none)
  - after: 5A Law firms: barely follow the section 3 groups. 5B Green cards: outsourcing firms sponsor fewer per H-1B filing. 5C Wage levels: a placed filing has 3.6 times the odds of level I or II.

### beyond-law
- **notice#0**
  - before: What to notice AMI 0.037 against 0.000 ± 0.002 for rewired networks: real (z = 15) and small. Modularity would mislead here.
  - after: What to notice AMI 0.037 against 0.000 ± 0.002 for rewired networks: real (z = 15) and small. Modularity would mislead here.

### beyond-perm
- **notice#0**
  - before: What to notice Outsourcing firms file 0.11 green cards per H-1B filing (95% interval 0.08 to 0.15), direct employers 0.18 (0.14 to 0.21). Across the six largest staffing groups the rate runs from 0.03 in Cognizant's group, where Cognizant itself filed almost none, to 0.15, a spread that shuffled group labels match 28% of the time (p = 0.28).
  - after: What to notice Outsourcing firms file 0.11 green cards per H-1B filing, direct employers 0.18. Across the six largest staffing groups the rate runs from 0.03 to 0.15, a spread that shuffled group labels match 28% of the time.
- **drawers#0**
  - before: Method For each company with 20 or more H-1B filings we divided its 2025 PERM filings by its H-1B filings, matching companies by name and tax number. More numbers The gap shrinks to 0.13 against 0.17 when a firm counts as outsourcing only if most of its filings go to clients. Single companies swing these rates more than any group does: counting every case status, filings in the names of Amazon and Google fell from 3,638 and 1,618 in 2024 to 15 and 3 in 2025. Green cards per company and the strongest employer ties are in the deep dive .
  - after: Method For each company with 20 or more H-1B filings we divided its 2025 PERM filings by its H-1B filings, matching companies by name and tax number. More numbers The gap shrinks to 0.13 against 0.17 when a firm counts as outsourcing only if most of its filings go to clients. Single companies swing these rates more than any group does: counting every case status, filings in the names of Amazon and Google fell from 3,638 and 1,618 in 2024 to 15 and 3 in 2025. Green cards per company and the strongest employer ties are in the deep dive . Outsourcing firms file 0.11 green cards per H-1B filing (95% interval 0.08 to 0.15), direct employers 0.18 (0.14 to 0.21). Across the six largest staffing groups the rate runs from 0.03 in Cognizant's group, where Cognizant itself filed almost none, to 0.15, a spread that shuffled group labels match 28% of the time (p = 0.28).

### beyond-wage
- **para#0**
  - before: Every filing states a prevailing-wage level from I (entry) to IV (fully competent), set by the experience and skills the job asks for; each level carries a wage floor. 92% of filings give one.
  - after: Every filing states a prevailing-wage level from I (entry) to IV (fully competent). 92% of filings give one.
- **notice#0**
  - before: What to notice Overall, 79% of placed filings sit at level I or II against 58% of direct ones. Within the 83 occupations with 20 or more filings of each kind, the Mantel–Haenszel odds ratio is 3.59, and 69 of the 83 point the same way. A level describes the job as filed, not the worker, so this shows cheaper job descriptions, not lower pay for the same person.
  - after: What to notice Overall, 79% of placed filings sit at level I or II against 58% of direct ones. Within the 83 occupations with 20 or more filings of each kind, the Mantel–Haenszel odds ratio is 3.59, and 69 of the 83 point the same way. A level describes the job as filed, not the worker, so this shows cheaper job descriptions, not lower pay for the same person.

**Terms added:** 
- `w4-term-beyond-law-ami`
- `w4-term-beyond-law-rewired`
- `w4-term-beyond-law-modularity`
- `w4-term-beyond-perm-shuffled`
- `w4-term-beyond-wage-wagelevel`
- `w4-term-beyond-wage-placed`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- beyond>w4-card answers#0: board numbers [] not in the page slot; board text: override used
- beyond-wage notice#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** 
- beyond-law notice#0: ['0', '1', 'two'] in «Adjusted mutual information: how closely two ways of grouping the same companies agree. 0 is what chance gives, 1 is a perfect match.»

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- beyond-wage: page «A level describes the job as filed, not the worker, so this shows cheaper job descriptions, not lower pay for the same person.» board «»

**Style lint (3.7) on the page text:** no new hits

## RClosing

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### closing>w4-card
- **notice#0**
  - before: One important limit A shared employer link means that the same companies file for both occupations or in both places. It does not prove that the jobs are performed together, that one caused the other, or that the network represents workers who were actually hired.
  - after: One important limit A shared employer link means the same companies file for both occupations or in both places. It does not show that the jobs are done together, that one caused the other, or that the network stands for workers who were hired.
- **para#0**
  - before: AI coding assistants helped structure the page, wrote analysis and page code, drafted and revised text, and tested the visual presentation. The numbers come from the public sources listed in Data and methods . Each analysis step writes the numbers its section quotes to a JSON file the page reads. A schema check tests each file against the fields the page uses, a name-matching check tests the company-name rules against tax numbers, and the site tests fail when the numbers in a card or in this closing drift from the analysis output. We checked generated tables, comparisons, source scope, and the page behaviour against the local data before including a claim.
  - after: AI coding assistants helped structure the page, wrote analysis and page code, drafted and revised text, and tested the visual presentation. The numbers come from the public sources listed in Data and methods .
- **drawers#0**
  - before: Background Cities group by who hires there, not by region. Outsourcing firms bundle jobs differently from direct employers of the same size. And when a client drops its main vendor, the new one comes from the same Louvain group nearly eight times as often as a random vendor would, though mostly because clients return to firms they already use. Take out the ten largest filers, most of them national tech and consulting employers, and the metro groups start to follow Census regions; Amazon alone does all of that. Where outsourcing shows most is outside the networks: a filing that places a worker at a client has 3.6 times the odds of a lower wage level for the same occupation. Lawyers and green cards barely follow the staffing groups.
  - after: Background Cities group by who hires there, not by region. Outsourcing firms bundle jobs differently from direct employers of the same size. And when a client drops its main vendor, the new one comes from the same Louvain group more than eight times as often as a random vendor would, though mostly because clients return to firms they already use. Take out the ten largest filers, most of them national tech and consulting employers, and the metro groups start to follow Census regions; Amazon alone does all of that. Where outsourcing shows most is outside the networks: a filing that places a worker at a client has 3.6 times the odds of a lower wage level for the same occupation. Lawyers and green cards barely follow the staffing groups. Method Each analysis step writes the numbers its section quotes to a JSON file the page reads. A schema check tests each file against the fields the page uses, a name-matching check tests the company-name rules against tax numbers, and the site tests fail when the numbers in a card or in this closing drift from the analysis output. We checked generated tables, comparisons, source scope, and the page behaviour against the local data before including a claim.

**Terms added:** none

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- closing>w4-card drawers#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- closing>w4-card: page «more than» board «nearly»

**Style lint (3.7) on the page text:** no new hits

## RDeep

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

No slot changed.
**Terms added:** none

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** none

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** none

**Style lint (3.7) on the page text:** no new hits

## RTopicWhere

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### place-backbone
- **q-answer#0**
  - before: Keep every shared-employer link and the map is one blob; keep only the links that are heavy for someone, and it comes apart.
  - after: With every link it is one blob; keep only links heavy for one of their metros and it comes apart.
- **para#0**
  - before: Cities are linked when they share an employer. The control sets the disparity-filter α from Week 4.
  - after: Cities are linked when they share an employer. The control sets the disparity-filter α from Week 4.
- **drawers#0**
  - before: Background Method Two metros are linked when a company files in both; the weight adds up, over those companies, the smaller of its two filing counts. One weight threshold would keep the links among the big hubs and cut a mid-size metro's strongest tie, which is light next to New York and Dallas. The disparity filter keeps a link when it carries an unusually large share of either endpoint's weight at level α, the method the course used for the philosophers backbone. α Edges kept Giant component
  - after: Method Two metros are linked when a company files in both; the weight adds up, over those companies, the smaller of its two filing counts. One weight threshold would keep the links among the big hubs and cut a mid-size metro's strongest tie, which is light next to New York and Dallas. The disparity filter keeps a link when it carries an unusually large share of either endpoint's weight at level α, the method the course used for the philosophers backbone. α Edges kept Giant component

### place-longhaul
- **q-answer#0**
  - before: Mostly not. Big direct employers lead the long links, Amazon above all, and a single company rarely carries one.
  - after: Mostly not: a single company rarely carries a long link.
- **para#0**
  - before: The shortlist is the five firms that place the most filings at client sites: Tata Consultancy Services, Cognizant, Infosys, HCL and Compunnel. The staffing section follows them to their clients.
  - after: Big direct employers lead the long links, Amazon above all. The shortlist is the five firms that place the most filings at client sites.
- **drawers#0**
  - before: More numbers Amazon leads the most long links (30), then Cognizant (17), EY (8) and Deloitte (7). The leading company carries a median 14% of a long link's weight, and only one long link, San Jose to Fayetteville (Walmart), has a company with half of it.
  - after: Background Tata Consultancy Services, Cognizant, Infosys, HCL and Compunnel. The staffing section follows them to their clients. More numbers Amazon leads the most long links (30), then Cognizant (17), EY (8) and Deloitte (7). The leading company carries a median 14% of a long link's weight, and only one long link, San Jose to Fayetteville (Walmart), has a company with half of it.

### deeper-density
- **q-answer#0**
  - before: New York files the most, 65,935, but that is 6.9 per 1,000 jobs; San Jose files 42.9, Trenton 17.2 and Seattle 16.8.
  - after: San Jose, at 42.9 filings per 1,000 jobs, against New York's 6.9.
- **drawers#0**
  - before: Method Section 1 counts filings. Divide each metro's 2025 filings by its jobs in the Bureau of Labor Statistics' May 2025 employment survey (OEWS) and the map shifts: nationally it is 4.5 filings per 1,000 jobs. A filing is a request, not a hire, so a rate can run high. More numbers Among the 203 metros with 100,000 jobs or more, count and density rank alike (Spearman 0.90), yet only 5 of the 10 largest by count stay in the top 10 by density: Dallas, San Jose, San Francisco, Seattle and Austin. For software developers alone the national rate is 139 filings per 1,000 jobs, and Fayetteville, Arkansas, the metro around Bentonville, reaches 896, 6.4 times the national share.
  - after: Method A filing is a request, not a hire, so a rate can run high. More numbers Among the 203 metros with 100,000 jobs or more, count and density rank alike (Spearman 0.90), yet only 5 of the 10 largest by count stay in the top 10 by density: Dallas, San Jose, San Francisco, Seattle and Austin. For software developers alone the national rate is 139 filings per 1,000 jobs, and Fayetteville, Arkansas, the metro around Bentonville, reaches 896, 6.4 times the national share. New York files the most, 65,935; Trenton files 17.2 and Seattle 16.8 per 1,000 jobs.

**Terms added:** 
- `w4-term-place-backbone-disparity`
- `w4-term-place-longhaul-place`
- `w4-term-deeper-density-spearman`

**Fix-ups applied (3.7):** 
- The control sets the disparity-filter α (term-wrapped)
- Colours are section 1's three metro groups.

**Cards a script builds (skipped, see 3.3):** 
- cut>w4-card: a method tab; the page's panels live in details#cut-methods, so its text moves by hand (Appendix A)
- cut>w4-card#1: a method tab; the page's panels live in details#cut-methods, so its text moves by hand (Appendix A)
- cut>w4-card#2: a method tab; the page's panels live in details#cut-methods, so its text moves by hand (Appendix A)
- cut>w4-card#3: a method tab; the page's panels live in details#cut-methods, so its text moves by hand (Appendix A)

**Held slots: board number not on the page (stale-number rule):** 
- topic-where>rx-topic-bar topic#0: board numbers ['40'] not in the page slot; board text: The 40 metros, linked by the employers they share.
- place-backbone q-answer#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** 
- place-longhaul: ['one']
- deeper-density: ['1', '2025', '2025', '4.5']

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** 
- #place-snap-note: board «Below α = 0.1 the giant component drops from 32 metros to 18; at α = 0.05 it keeps 25 links. The largest to fall off: Boston, Los Angeles, Detroit and 11 more.» page «Watch where the giant component snaps as you step α down with the control above.»
- #place-alpha-choice: board «The map opens at α = 0.2, the smallest α in the sweep that keeps all 40 metros connected, with 180 links. At α = 0.1 it keeps 59 links and 32 connected metros; at α = 0.3, 419 links.» page «»

**Text that still differs from the board, outside script-owned nodes:** 
- topic-where>rx-topic-bar: page «Section 1's» board «The 40»
- topic-where>rx-topic-bar: page «» board «7 boxes»
- place-backbone: page «control sets» board «slider is»
- place-backbone: page «» board «0.05 0.1 0.2 0.3 0.5»
- place-backbone: page «section 1's three metro groups.» board «the communities of card C.»

**Style lint (3.7) on the page text:** no new hits

## RTopicJobs

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### jobs-bridges
- **q-answer#0**
  - before: Only … of … pass, fewer than the … a test this strict passes by chance, so no occupation clearly belongs to two clusters.
  - after: None clearly: only … of … pass, fewer than the … chance alone passes.
- **para#0**
  - before: Colours are clusters found by Louvain in the full co-hiring network, named after their largest occupation. We looked for occupations that also belong to a second cluster, with more employer ties there than any rewired network gives them. A ringed node would be one that passes. Click a node to inspect it.
  - after: Colours are Louvain clusters in the full co-hiring network, named after their largest occupation. A ringed node would mark an occupation with more employer ties to a second cluster than any rewired network gives it; click a node to inspect it.

### jobs-groups
- **q-answer#0**
  - before: The clusters follow the official groups only in part: NMI … against … for shuffled labels (AMI … ), over the … occupations in clusters of two or more.
  - after: Only in part: NMI … against … for shuffled labels.
- **para#0**
  - before: The government groups occupations by their first two SOC digits. We compare those labels with the clusters found from hiring patterns. The shuffled bars keep the clusters fixed and scramble only the official labels.
  - after: The government groups occupations by their first two SOC digits. We compare those labels with the clusters found from hiring patterns. The shuffled labels keep the clusters fixed and scramble only the official groups.
- **axis-note#1**
  - before: Normalized mutual information from 0 (unrelated) to 1 (the same groups). Orange: the hiring clusters. Ring: Infomap's clusters. Grey: the official labels shuffled 100 times over the same clusters, up to their highest score.
  - after: Normalised mutual information from 0 (unrelated) to 1 (the same groups). Orange: the hiring clusters. Ring: Infomap's clusters. Grey: the official labels shuffled 100 times over the same clusters, up to their highest score.
- **drawers#0**
  - before: Method We keep certified H-1B filings and identify companies by tax number, as in the other sections. A link counts the companies that filed for both occupations. Filings still on 2010 codes ( … ) move to their 2018 successors through O*NET's 2010-to-2019 crosswalk. Louvain runs 100 times on the full projection and the best modularity run is kept; the runs agree at a median NMI of … . The null rewires the company × occupation network … times, keeping each company's number of occupations and each occupation's number of companies, and projects it again; real and rewired networks are scored on their largest connected piece (z = … ). An occupation's second cluster is the one its employer ties exceed most over the expectation modularity uses (its strength times the cluster's, over twice the total weight). A ratio above 1, our first rule, marks … occupations, but the rewired networks mark … on average with the same cluster labels. So an occupation now counts only when its ratio beats its own ratio in every rewired network. The disparity filter at α = … , as in the place section, keeps … of … links and … occupations. Louvain on that backbone finds … clusters, which match the full network's at NMI … , against … between two runs on the full network: the clusters only partly survive the filter. NMI and AMI leave out occupations alone in a cluster and are compared with 100 shuffles of the major-group labels. The same method on 2024 gives clusters that match 2025 at NMI … on the … occupations both years share. Infomap, the random-walk method, finds … clusters of two or more occupations; they agree with Louvain's at NMI … and match the official groups at … .
  - after: Method We keep certified H-1B filings and identify companies by tax number, as in the other sections. A link counts the companies that filed for both occupations. Filings still on 2010 codes ( … ) move to their 2018 successors through O*NET's 2010-to-2019 crosswalk. Louvain runs 100 times on the full projection and the best modularity run is kept; the runs agree at a median NMI of … . The null rewires the company × occupation network … times, keeping each company's number of occupations and each occupation's number of companies, and projects it again; real and rewired networks are scored on their largest connected piece (z = … ). An occupation's second cluster is the one its employer ties exceed most over the expectation modularity uses (its strength times the cluster's, over twice the total weight). A ratio above 1, our first rule, marks … occupations, but the rewired networks mark … on average with the same cluster labels. So an occupation now counts only when its ratio beats its own ratio in every rewired network. The disparity filter at α = … , as in the place section, keeps … of … links and … occupations. Louvain on that backbone finds … clusters, which match the full network's at NMI … , against … between two runs on the full network: the clusters only partly survive the filter. NMI and AMI leave out occupations alone in a cluster and are compared with 100 shuffles of the major-group labels. The same method on 2024 gives clusters that match 2025 at NMI … on the … occupations both years share. Infomap, the random-walk method, finds … clusters of two or more occupations; they agree with Louvain's at NMI … and match the official groups at … . The shuffled bars keep the clusters fixed and scramble only the official labels. AMI, a version of NMI adjusted for chance agreement, is … . Both scores cover the … occupations in clusters of two or more.

**Terms added:** 
- `w4-term-jobs-bridges-louvain`
- `w4-term-jobs-bridges-rewired`
- `w4-term-jobs-groups-nmi`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** 
- cut-skills-direct: a script builds this card, so its text moves in the script (PORT_PLAN 3.3)
- cut-skills-cluster: a script builds this card, so its text moves in the script (PORT_PLAN 3.3)
- cut-skills-radar: a script builds this card, so its text moves in the script (PORT_PLAN 3.3)
- cut-pagerank-explore: a script builds this card, so its text moves in the script (PORT_PLAN 3.3)
- cut-pagerank-iteration: a script builds this card, so its text moves in the script (PORT_PLAN 3.3)

**Held slots: board number not on the page (stale-number rule):** 
- jobs-bridges q-answer#0: board numbers [] not in the page slot; board text: override used
- jobs-groups q-answer#0: board numbers [] not in the page slot; board text: override used
- jobs-groups axis-note#0: board numbers ['438', '2', '2'] not in the page slot; board text: Every occupation in a cluster of two or more, 438 in all, split by its official major group: the three largest named, the rest grey. Two more clusters hold two occupations each: Home Health Aides (2) and First-Line Supervisors of Housekeeping and Janitorial Workers (2).
- jobs-groups drawers#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** 
- jobs-bridges: ['two', 'one']

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- topic-jobs>rx-topic-bar: page «» board «7 boxes»
- jobs-bridges: page «…» board «5»
- jobs-bridges: page «…» board «393»
- jobs-bridges: page «…» board «19»
- jobs-groups: page «…» board «0.23»
- jobs-groups: page «…» board «0.05»
- jobs-groups: page «the four largest clusters, 429» board «a cluster of two or more, 438»
- jobs-groups: page «The other two» board «Two more»
- jobs-groups: page «of two or more» board «»
- jobs-groups: page «each.» board «each: Home Health Aides (2) and First-Line Supervisors of Housekeeping and Janitorial Workers (2).»
- jobs-groups: page «…» board «48 filings»
- jobs-groups: page «…» board «0.99»
- jobs-groups: page «…» board «20»
- jobs-groups: page «…» board «285»
- jobs-groups: page «…» board «145»
- jobs-groups: page «…» board «452»
- jobs-groups: page «…» board «0.2»
- jobs-groups: page «…» board «7,639»
- jobs-groups: page «…» board «28,158»
- jobs-groups: page «…» board «345»
- jobs-groups: page «…» board «8»
- jobs-groups: page «…» board «0.69»
- jobs-groups: page «…» board «1.00»
- jobs-groups: page «…» board «0.59»
- jobs-groups: page «…» board «388»
- jobs-groups: page «…» board «9»
- jobs-groups: page «…» board «0.75»
- jobs-groups: page «…» board «0.25»
- jobs-groups: page «…» board «0.19»
- jobs-groups: page «…» board «438»

**Style lint (3.7) on the page text:** no new hits

## RTopicOutsourcing

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### topic-outsourcing>w4-card
- **figcaption#0**
  - before: Groups against rewired networks Modularity of the real firm–client network, real against rewired networks that keep everyone's number of partners.
  - after: Groups against rewired networks Modularity of the real firm–client network, real against rewired networks that keep everyone's number of partners.
- **figcaption#1**
  - before: Match with vendor and industry AMI between the groups and each client's main vendor or industry, 0 = labels dealt at random. Filled: the main vendor; hollow: the industry.
  - after: Match with vendor and industry AMI between the groups and each client's main vendor or industry, 0 = labels dealt at random. Filled: the main vendor; hollow: the industry.

### topic-outsourcing>w4-card#1
- **para#0 (added before the drawers)**
  - before: (none)
  - after: 14,678 of the 18,900 clients use one firm, but they hold 22% of placed filings. Of the 629 clients with 20 or more filings, 69 get over 90% from one firm, and the median one gets 37% from its largest.
- **drawers#0**
  - before: More numbers 14,678 of the 18,900 clients use one firm, but they hold 22% of placed filings. Of the 629 clients with 20 or more filings, 69 get over 90% from one firm, and the median one gets 37% from its largest. Citigroup, the largest client, uses 114 firms, and Tata Consultancy Services supplies a quarter. The eight largest firms supply only 27% of what the 20 largest clients receive.
  - after: More numbers Citigroup, the largest client, uses 114 firms, and Tata Consultancy Services supplies a quarter. The eight largest firms supply only 27% of what the 20 largest clients receive.

### topic-outsourcing>w4-card#2
- **drawers#0 (added)**
  - before: (none)
  - after: Background Only three sectors get a colour: finance and insurance, manufacturing and health care. Other known sectors are light grey, and the palest dots are clients with no sector on record. Band width is the number of placed filings from a firm to a client; the grey source gathers every other firm. Each client sits next to the named firm that supplies it most.

### staffing-community-stats
- **q-answer#0**
  - before: The two partitions share an NMI of … , less than two runs of either kind with different seeds ( … weighted, … unweighted), so the filing counts change the grouping.
  - after: Filing counts change the grouping: the two partitions share an NMI of … , less than two seeds of either kind ( … weighted, … unweighted).
- **para#0**
  - before: Louvain on the firm–client network for 2025, 100 runs each: once with links weighted by filings, once with every link counting one. They pull it toward vendors: AMI with each client's main vendor rises from … to … when filings count, while AMI with industry stays near … .
  - after: We ran Louvain on the 2025 firm–client network 100 times each way: with links weighted by filings, and with every link counting one. Filing counts pull clients toward vendors: AMI with each client's main vendor rises from … to … when filings count, while AMI with industry stays near … .
- **para#1**
  - before: The null rewires the network so every firm and client keeps its number of partners, and deals the filing counts back out at random. Rewiring breaks the network into a median of … pieces, each a free community, so we score each rewired network on its largest piece, as we do the real one. Without weights the real network wins ( … against … ). With weights it loses ( … against … ), and it loses when only the filing counts are shuffled on the real links ( … ). The real counts leave … of filings on links between groups, against … with shuffled counts: clients that use several firms hold … of the links but … of the filings, and only their links can cross: a client with one firm sits in that firm's group:
  - after: The null model rewires the network so every firm and client keeps its number of partners. Without weights the real network wins ( … against … ); with weights it loses ( … against … ).
- **para#2**
  - before: Infomap, which follows a random walk instead of counting links, splits the same network into … small modules, most of them a firm with its clients. They agree with Louvain at NMI … and, like weighted Louvain, follow the vendor far more than the industry (AMI … against … ). Finer partitions raise every NMI; AMI corrects for that, so it is the number to compare across methods.
  - after: Infomap, which follows a random walk instead of counting links, splits the same network into … small modules, most of them a firm with its clients. Like weighted Louvain, it follows the vendor far more than the industry (AMI … against … ).
- **drawers#0 (added)**
  - before: (none)
  - after: Method Infomap agrees with Louvain at NMI … . Finer partitions raise every NMI; AMI corrects for that, so it is the number to compare across methods. More numbers The null also deals the filing counts back out at random. Rewiring breaks the network into a median of … pieces, each a free community, so we score each rewired network on its largest piece, as we do the real one. The real network also loses when only the filing counts are shuffled on the real links ( … ). The real counts leave … of filings on links between groups, against … with shuffled counts: clients that use several firms hold … of the links but … of the filings, and only their links can cross, since a client with one firm sits in that firm's group.

### staffing-ties
- **para#0 (added before the drawers)**
  - before: (none)
  - after: Among friends, the strongest ties sit inside tight groups where your close friends also know each other, and weak ties bridge the groups (Granovetter 1973; Onnela and colleagues confirmed it on millions of phone users in 2007).
- **drawers#0**
  - before: Background Among friends, the strongest ties sit inside tight groups where your close friends also know each other, and weak ties bridge the groups (Granovetter 1973; Onnela and colleagues confirmed it on millions of phone users in 2007). A link's overlap measures the tightness: of the firm's other clients and the client's other firms, the share that are linked to each other. More numbers Over the 28,104 links where overlap is defined, filings and overlap correlate at Spearman -0.04; with the filing counts shuffled over the same links the correlation is 0.00 ± 0.01 (z = -6.3; 2024 gives z = -3.7). Links with one filing have a mean overlap of 0.065, links with 21 or more 0.034. Heavy links mostly belong to the largest firms, whose many clients rarely share other firms, so part of this is size. It agrees with the result above: the real filing counts put weight on links between groups. Each filing states one of four wage levels, from entry (I) to fully competent (IV). Averaged per client over the filings that reach it, the groups explain 13% of the variance in wage level; averaged per firm over all its filings, 3%. None of 1,000 shuffles of the group labels reached either. A client's filings come from the vendors that also decide its group, so part of the 13% is built in. Outsourcing firms file 66% of their applications at level II and 5% at level IV; direct employers file 35% and 22%. From January to June 2026, level IV rose to 17.7% of all filings from 13.6% a year earlier, and level I fell to 18.0% from 21.8%.
  - after: Background A link's overlap measures the tightness: of the firm's other clients and the client's other firms, the share that are linked to each other. More numbers Over the 28,104 links where overlap is defined, filings and overlap correlate at Spearman -0.04; with the filing counts shuffled over the same links the correlation is 0.00 ± 0.01 (z = -6.3; 2024 gives z = -3.7). Links with one filing have a mean overlap of 0.065, links with 21 or more 0.034. Heavy links mostly belong to the largest firms, whose many clients rarely share other firms, so part of this is size. It agrees with the result above: the real filing counts put weight on links between groups. Each filing states one of four wage levels, from entry (I) to fully competent (IV). Averaged per client over the filings that reach it, the groups explain 13% of the variance in wage level; averaged per firm over all its filings, 3%. None of 1,000 shuffles of the group labels reached either. A client's filings come from the vendors that also decide its group, so part of the 13% is built in. Outsourcing firms file 66% of their applications at level II and 5% at level IV; direct employers file 35% and 22%. From January to June 2026, level IV rose to 17.7% of all filings from 13.6% a year earlier, and level I fell to 18.0% from 21.8%.
- **figcaption#0**
  - before: Heavy links, looser neighbourhoods Spearman correlation between a link's filings and its overlap, against 100 shuffles of the filing counts over the same links.
  - after: Heavy links, looser neighbourhoods Spearman correlation between a link's filings and its overlap, against 100 shuffles of the filing counts over the same links.
- **figcaption#1**
  - before: Wage levels as filed Share of each kind of employer's 2025 filings at each prevailing-wage level.
  - after: Wage levels as filed Share of each kind of employer's 2025 filings at each prevailing-wage level.

### deeper-strength
- **q-answer#0**
  - before: Three of the top five are therapy and rehab clinics: the heaviest one-to-one ties belong to health care, not IT.
  - after: Three of the top five are therapy and rehab clinics.
- **para#0 (added before the drawers)**
  - before: (none)
  - after: The course compares a node's degree (how many partners) with its strength (how many filings over all its links), and finds the exceptions tell the story.
- **notice#0 (added before the drawers)**
  - before: (none)
  - after: 💡 What to notice Degree and strength rank firms almost alike (Spearman 0.91) but clients less so (0.75): the heaviest single ties belong to small rehab clinics, led by Ultimate Therapy with 133 filings from one firm.
- **drawers#0**
  - before: Method The course compares a node's degree (how many partners) with its strength (how many filings over all its links), and finds the exceptions tell the story. More numbers In the 2025 firm–client network the two rank firms almost alike (Spearman 0.91) and clients less so (0.75). The clients with the most filings from a single firm are Ultimate Therapy, 133 filings from one firm; Sigma Rehab, 95; Post Rehab Services, 61; and Grady Memorial Hospital, 58.
  - after: More numbers In the 2025 firm–client network the two rank firms almost alike (Spearman 0.91) and clients less so (0.75). The clients with the most filings from a single firm are Ultimate Therapy, 133 filings from one firm; Sigma Rehab, 95; Post Rehab Services, 61; and Grady Memorial Hospital, 58.

**Terms added:** 
- `w4-term-topic-outsourcing-modularity`
- `w4-term-topic-outsourcing-rewired`
- `w4-term-topic-outsourcing-ami`
- `w4-term-staffing-community-stats-nmi`
- `w4-term-staffing-community-stats-louvain`
- `w4-term-staffing-community-stats-null`
- `w4-term-staffing-ties-spearman`
- `w4-term-staffing-ties-overlap`
- `w4-term-staffing-ties-wagelevel`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- topic-outsourcing>w4-card#2 drawers#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** 
- deeper-strength: ['one']

**Numbers in new term definitions (check each is a scale, not a result):** 
- staffing-ties figcaption#0: ['two'] in «A measure of whether two quantities rise together, computed on their ranks rather than their values.»

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- topic-outsourcing>rx-topic-bar: page «» board «6 boxes»
- staffing-community-stats: page «…» board «0.38»
- staffing-community-stats: page «…» board «0.70»
- staffing-community-stats: page «…» board «0.50»
- staffing-community-stats: page «…» board «0.11»
- staffing-community-stats: page «…» board «0.48»
- staffing-community-stats: page «…» board «0.07»
- staffing-community-stats: page «…» board «0.57»
- staffing-community-stats: page «…» board «0.53»
- staffing-community-stats: page «…» board «0.60»
- staffing-community-stats: page «…» board «0.74»
- staffing-community-stats: page «…» board «1,725»
- staffing-community-stats: page «…» board «0.62»
- staffing-community-stats: page «…» board «0.06»
- staffing-community-stats: page «…» board «0.66»
- staffing-community-stats: page «…» board «583»
- staffing-community-stats: page «…» board «0.75»
- staffing-community-stats: page «…» board «35%»
- staffing-community-stats: page «…» board «23%»
- staffing-community-stats: page «…» board «73%»
- staffing-community-stats: page «…» board «82%»

**Style lint (3.7) on the page text:** no new hits

## RTopicPaperwork

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### staffing-lawyers
- **drawers#0**
  - before: Background Two law firms share filings when the same employer uses both: for each such employer, the smaller of its filings through either. That network has one giant hub, the case the disparity filter was made for. A weight threshold of four shared filings keeps 771 links and spends 26% of them on the five largest firms. The disparity filter at &alpha; = 0.2 keeps 697 and spends 19%. It also keeps 115 small firms the threshold drops, such as one law office whose link to BBI Law Group is 3 of its 5 shared filings and 3 of BBI's 342. The threshold keeps the larger connected core, 395 firms against the filter's 351. Another 144 firms stay only because they form a pair linked to nobody else, where neither end can judge the link. Louvain finds 34 groups at modularity 0.67, against 0.55 for rewired networks that keep each employer's and each law firm's number of partners (z = 12). The groups are barely regional (NMI 0.05 with Census regions, though above every shuffle), and the largest gather around shared employers. Google, Apple and Meta share Fragomen, Ogletree Deakins and Berry Appleman &amp; Leiden; Tata Consultancy, LTIMindtree and Salesforce share Usilaw, Goel &amp; Anderson and Chugh; Vialto, once PwC's law firm, serves Doordash and Databricks. The groups move from year to year: 2024 and 2025 agree at NMI 0.30 on the 1,041 law firms in both, against 0.88 between two runs of 2025. More numbers Fragomen alone files 78,531 for 3,129 employers. Outsourcing firms mostly do without: they file 52% of their applications with no outside firm and send 3% to the five largest, while direct employers send those five 48%. Per employer the averages are 2% and 30%, and none of 1,000 shuffles of which employer is which produced a gap that wide.
  - after: Background Two law firms share filings when the same employer uses both: for each such employer, the smaller of its filings through either. That network has one giant hub, the case the disparity filter was made for. A weight threshold of four shared filings keeps 771 links and spends 26% of them on the five largest firms. The disparity filter at α = 0.2 keeps 697 and spends 19%. It also keeps 115 small firms the threshold drops, such as one law office whose link to BBI Law Group is 3 of its 5 shared filings and 3 of BBI's 342. The threshold keeps the larger connected core, 395 firms against the filter's 351. Another 144 firms stay only because they form a pair linked to nobody else, where neither end can judge the link. Louvain finds 34 groups at modularity 0.67, against 0.55 for rewired networks that keep each employer's and each law firm's number of partners (z = 12). The groups are barely regional (NMI 0.05 with Census regions, though above every shuffle), and the largest gather around shared employers. Google, Apple and Meta share Fragomen, Ogletree Deakins and Berry Appleman &amp; Leiden; Tata Consultancy, LTIMindtree and Salesforce share Usilaw, Goel &amp; Anderson and Chugh; Vialto, once PwC's law firm, serves Doordash and Databricks. The groups move from year to year: 2024 and 2025 agree at NMI 0.30 on the 1,041 law firms in both, against 0.88 between two runs of 2025. More numbers Fragomen alone files 78,531 for 3,129 employers. Outsourcing firms mostly do without: they file 52% of their applications with no outside firm and send 3% to the five largest, while direct employers send those five 48%. Per employer the averages are 2% and 30%, and none of 1,000 shuffles of which employer is which produced a gap that wide.

### staffing-lottery
- **q-answer#0**
  - before: Registering the same workers is spread across the staffing groups; it does not mark a cluster of firms.
  - after: No. Firms that register the same workers are spread across the staffing groups.
- **para#0 (added before the drawers)**
  - before: (none)
  - after: We took the 2,942 firms in the 2023 staffing network that sent 20 or more registrations to the March 2023 draw, and split them at the median share of workers another employer had also registered (78%).
- **drawers#0**
  - before: Method We took the 2,942 firms in the 2023 staffing network that sent 20 or more registrations to the March 2023 draw, and split them at the median share of workers another employer had also registered (78%). More numbers If the high firms clustered, a high firm's Louvain group would be mostly high firms. It is 51.2% high, against 50.0% when the labels are shuffled (p = 0.001 over 1,000 shuffles), and AMI with the groups is 0.004 over 100 runs. The March 2022 draw against the 2022 network gives 51.9% against 50.0%. The lottery data is USCIS's, obtained by Bloomberg News.
  - after: More numbers If the high firms clustered, a high firm's Louvain group would be mostly high firms. It is 51.2% high, against 50.0% when the labels are shuffled (p = 0.001 over 1,000 shuffles), and AMI with the groups is 0.004 over 100 runs. The March 2022 draw against the 2022 network gives 51.9% against 50.0%. The lottery data is USCIS's, obtained by Bloomberg News.

### deeper-uscis
- **q-answer#0**
  - before: Share of first-time H-1B petitions USCIS denied, for employers with 20 or more certified filings that year. Placing firms put half or more of their filings at a client.
  - after: Share of first-time H-1B petitions USCIS denied, for employers with 20 or more certified filings that year.
- **para#0**
  - before: From the hub's Tableau export; 2026 runs October to June.
  - after: From the hub's Tableau export; 2026 runs October to June. Placing firms put half or more of their filings at a client.

### deeper-perm
- **q-answer#0**
  - before: An H-1B filing is a weak tie between an employer and a worker; a green-card filing (PERM) is a strong one, because the employer sponsors the worker to stay.
  - after: An H-1B filing is a weak tie between employer and worker; a green-card filing (PERM) is a strong one.
- **para#0 (added before the drawers)**
  - before: (none)
  - after: Only 65% of certified green cards come from an employer we can match to an H-1B filer.
- **notice#0 (added before the drawers)**
  - before: (none)
  - after: 💡 What to notice The median employer files 13.2 green cards per 100 H-1B filings, yet Oracle files 95 while Amazon, with 22,509 H-1B filings, files almost none.
- **drawers#0**
  - before: Method Only 65% of certified green cards come from an employer we can match to an H-1B filer. More numbers In 2025 the median employer with 20 or more H-1B filings filed 13.2 green cards per 100 of them, and the two counts rank employers only loosely alike (Spearman 0.50). As with degree and strength in the course, the exceptions carry the story: Oracle filed 95 green cards per 100 H-1B filings, Uber 64 and Salesforce 45, while Amazon (22,509 H-1B filings), Cognizant (11,085) and Google (8,657) filed almost none. Whether outsourcing firms sponsor fewer is section 5B . Clients sponsor their own staff too: Wells Fargo receives 1,547 H-1B filings from vendors, files 624 of its own and 167 green cards. Firms with more clients sponsor slightly more green cards, not fewer (Spearman 0.13).
  - after: More numbers In 2025 the median employer with 20 or more H-1B filings filed 13.2 green cards per 100 of them, and the two counts rank employers only loosely alike (Spearman 0.50). As with degree and strength in the course, the exceptions carry the story: Oracle filed 95 green cards per 100 H-1B filings, Uber 64 and Salesforce 45, while Amazon (22,509 H-1B filings), Cognizant (11,085) and Google (8,657) filed almost none. Whether outsourcing firms sponsor fewer is section 5B . Clients sponsor their own staff too: Wells Fargo receives 1,547 H-1B filings from vendors, files 624 of its own and 167 green cards. Firms with more clients sponsor slightly more green cards, not fewer (Spearman 0.13).

### deeper-countries
- **q-answer#0**
  - before: The groups match world regions (AMI 0.10) and Week 3's migration communities (0.10) only weakly: green-card hiring does not sort countries into regional blocs.
  - after: Green-card hiring does not sort countries into regional blocs.
- **para#0 (added before the drawers)**
  - before: (none)
  - after: We link two countries when the same employers file green cards for citizens of both, then ask whether those links form regional groups. They barely do: the groups match world regions only weakly.
- **notice#0 (added before the drawers)**
  - before: (none)
  - after: 💡 What to notice Counted once, the country links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared green cards they group less (0.26 against 0.40).
- **drawers#0**
  - before: Method A worker's citizenship is personal, so we read it only in memory and keep counts per country and employer, dropping every count under 10. That drops 96% of the cells and 43% of 2023's certified green-card filings, and no row about a person leaves the script. More numbers India holds 52% of those filings and China 12%; among lottery registrations, India holds 77% in the March 2022 draw and 81% in March 2023. Link two countries by the green cards their citizens receive at the same employers and 55 countries remain. Louvain splits them into three groups. Counted once each, the links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared green cards, they group less (0.26 against 0.40). India and China share one group with Canada, Belarus and Costa Rica, and India keeps 79% of its weight inside it. Among the ten largest sponsors, Google's green cards are the most varied, 4.7 effective countries with India at 30%, against Amazon's 3.0 at 67%. The third group gathers the Philippines, Kenya, Ghana, Zimbabwe, Ethiopia, Cameroon and Jamaica. Wayne Farms, a poultry company, filed 832 green cards in the counted cells, none for Indian citizens.
  - after: Method A worker's citizenship is personal, so we read it only in memory and keep counts per country and employer, dropping every count under 10. That drops 96% of the cells and 43% of 2023's certified green-card filings, and no row about a single person is ever saved. More numbers India holds 52% of those filings and China 12%; among lottery registrations, India holds 77% in the March 2022 draw and 81% in March 2023. Link two countries by the green cards their citizens receive at the same employers and 55 countries remain. Louvain splits them into three groups. Counted once each, the links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared green cards, they group less (0.26 against 0.40). India and China share one group with Canada, Belarus and Costa Rica, and India keeps 79% of its weight inside it. Among the ten largest sponsors, Google's green cards are the most varied, 4.7 effective countries with India at 30%, against Amazon's 3.0 at 67%. The third group gathers the Philippines, Kenya, Ghana, Zimbabwe, Ethiopia, Cameroon and Jamaica. Wayne Farms, a poultry company, filed 832 green cards in the counted cells, none for Indian citizens. The groups match world regions (AMI 0.10) and Week 3's migration communities (0.10) only weakly: green-card hiring does not sort countries into regional blocs.

**Terms added:** 
- `w4-term-staffing-lawyers-disparity`
- `w4-term-staffing-lawyers-louvain`
- `w4-term-staffing-lawyers-modularity`
- `w4-term-staffing-lawyers-nmi`
- `w4-term-staffing-lottery-ami`
- `w4-term-deeper-lottery-registrations`
- `w4-term-deeper-uscis-hub`
- `w4-term-deeper-perm-perm`
- `w4-term-deeper-perm-spearman`
- `w4-term-deeper-countries-effective`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** 
- deeper-lottery para#0: board numbers [] not in the page slot; board text: held by hand (null override)
- deeper-lottery notice#0: board numbers ['2.2', '4.0', '2.9', '2025'] not in the page slot; board text: What to notice The two draws this box can split by employer were the most crowded: registrations per selection rose from 2.2 in March 2020 to 4.0 in March 2023, then fell to 2.9 by March 2025 once each worker counted once.
- deeper-lottery drawers#0: board numbers ['1'] not in the page slot; board text: Method The every-draw chart divides eligible by selected registrations from the historical table on USCIS's H-1B Electronic Registration Process page; its selections include later rounds, so its ratio is lower than the one per approved petition. More numbers Between the March 2022 and March 2023 dra
- deeper-lottery figcaption#0: board numbers ['2024'] not in the page slot; board text: Every draw since 2020 Eligible registrations per selected registration, from USCIS's published totals; the line under each date is the share of registrations for a worker registered more than once. From March 2024 USCIS drew by person, not by registration.
- deeper-uscis para#0: board numbers [] not in the page slot; board text: override used

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- topic-paperwork>rx-topic-bar: page «» board «6 boxes»
- deeper-lottery: page «Method» board «»
- deeper-lottery: page «» board «💡 What to notice The two draws this box can split by employer were the most crowded: registrations per selection rose from 2.2 in March 2020 to 4.0 in March 2023, then fell to 2.9 by March 2025 once each worker counted once. Method The every-draw chart divides eligible by selected registrations from the historical table on USCIS's H-1B Electronic Registration Process page; its selections include later rounds, so its ratio is lower than the one per approved petition.»
- deeper-lottery: page «totals, counting every selection round of» board «totals;»
- deeper-lottery: page «year; the figure» board «line»
- deeper-lottery: page «The dashed line marks where» board «From March 2024»
- deeper-lottery: page «began to draw» board «drew»

**Style lint (3.7) on the page text:** no new hits

## RTopicYears

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

### topic-years>w4-card
- **para#0 (added before the drawers)**
  - before: (none)
  - after: We compare each year's client groups with the next year's, on the clients both years share, and with a second run on the same year as the ceiling. Consecutive years agree less than that ceiling, so the groups carry over only in part.
- **figcaption#0**
  - before: Consecutive years against the same year NMI of the groups on shared clients. Dots: two consecutive years. Dashed: two runs of the same year.
  - after: Consecutive years against the same year NMI of the groups on shared clients. Dots: two consecutive years. Dashed: two runs of the same year.

**Terms added:** 
- `w4-term-topic-years-nmi`

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** 
- years-card: a script builds this card, so its text moves in the script (PORT_PLAN 3.3)
- roles-card: a script builds this card (PORT_PLAN 3.3)

**Held slots: board number not on the page (stale-number rule):** none

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** 
- topic-years>w4-card figcaption#0: ['0', '1'] in «Normalised mutual information: how much two groupings of the same clients agree, from 0 (unrelated) to 1 (identical).»

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** 
- topic-years>rx-topic-bar: page «» board «3 boxes»

**Style lint (3.7) on the page text:** no new hits

## RData

Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines (`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).

No slot changed.
**Terms added:** none

**Fix-ups applied (3.7):** none

**Cards a script builds (skipped, see 3.3):** none

**Held slots: board number not on the page (stale-number rule):** none

**Numbers the board drops (accepted, list in the PR body):** none

**Numbers in new term definitions (check each is a scale, not a result):** none

**Script-owned text that differs from the board (3.3):** none

**Text that still differs from the board, outside script-owned nodes:** none

**Style lint (3.7) on the page text:** no new hits

RData by hand: the board has no cards, only the #evidence source list. Its one change, hover terms on "LCA" and "FOIA" in two `dd` items, went in by hand as `w4-term-evidence-lca` and `w4-term-evidence-foia`.

