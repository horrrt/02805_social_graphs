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

