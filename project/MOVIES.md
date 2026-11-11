# Movie script networks

`analysis/movies.py` builds a character network for a film from its IMSDb screenplay. Two characters are
linked for every scene they both speak in. This note keeps the sources we checked on scripts and box
office, so a claim on the site can cite them.

## Papers on scripts and box office

Jehoshua Eliashberg, Sam K. Hui and Z. John Zhang, "From Story Line to Box Office: A New Approach for
Green-Lighting Movie Scripts", *Management Science* 53(6), 881-893, 2007.
[PDF](https://faculty.wharton.upenn.edu/wp-content/uploads/2012/04/From-Story-Line-to-Box-Office.pdf),
[RePEc](https://econpapers.repec.org/RePEc:inm:ormnsc:v:53:y:2007:i:6:p:881-893).
They forecast a film's return on investment from its script, using screenwriting knowledge, text
analysis and statistical learning. On films held out of training, picking scripts with the model would
have raised a studio's return. Return is measured on US box office only.

Jehoshua Eliashberg, Sam K. Hui and Z. John Zhang, "Assessing Box Office Performance Using Movie Scripts:
A Kernel-Based Approach", *IEEE Transactions on Knowledge and Data Engineering* 26(11), 2639-2648, 2014,
DOI [10.1109/TKDE.2014.2306681](https://doi.org/10.1109/TKDE.2014.2306681).
[PDF](https://faculty.wharton.upenn.edu/wp-content/uploads/2014/10/Assessing-Box-Office-Performance.pdf).
They predict box office from the script and an estimated production budget, at the point a studio
decides whether to make the film. Features come at three levels: genre and content, semantics, and
bag-of-words. On 300 shooting scripts, with US box office and budgets from IMDb and Box Office Mojo,
the method's mean squared error was 29% lower than the benchmark methods. An
[NYU Stern press release](https://www.stern.nyu.edu/experience-stern/news/uat_024235) describes an
earlier version on 200 scripts, so quote the published paper's numbers.

## What they do not show

Neither paper measures how much the script adds once budget, stars and sequel status are known. The 2014
model takes budget as an input and does not separate the two. Don't cite them for "the script matters
less than the budget" or the reverse.

Both papers work from the script's text, not from who appears with whom. A test of whether a film's
character network predicts its box office would be new next to these two papers. We have not yet
searched for other work that does it.
