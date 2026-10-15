# Log-Log Legends design

This file records the course website's visual design: which stylesheets each page uses, the type scale, the
colours and what each colour means. The stylesheets in `src/styles/` are the source of truth. When a value
here disagrees with them, the CSS wins: fix this file in the same pull request.

Code rules for charts, controls and accessibility are in
[.github/instructions/site.instructions.md](.github/instructions/site.instructions.md). Layout and writing
rules for posts are in [project/POST_GUIDE.md](project/POST_GUIDE.md).

## Name

The site and the group are "Log-Log Legends", and the wordmark is "LOG-LOG LEGENDS". Both use a plain
hyphen (U+002D), never an en dash: the long dash reads as AI-written. The name in page titles, footers,
descriptions and docs follows this rule, and `tests/site.test.mjs` fails on an en dash in the name on any
built page or in the site code. #277 changed
every place the name appeared; [project/design/naming/before-after.png](project/design/naming/before-after.png)
shows the tab title, top bars, wordmark and Cold Read footer before and after.

Lowercase "log–log" is the chart term (both axes on a log scale), not the name, and keeps its en dash.

## Page families

| Pages | Stylesheets, in order | Look |
| --- | --- | --- |
| Home | `type.css`, `corridor.css`, `home.css` | Navy text, blue controls, pale blue ground, illustrated hero |
| Weeks 1 and 2 | `type.css`, `arcade.css`, `design.css`, `story.css` | The arcade edition: card packs, transit map |
| Week 3 | `type.css`, `corridor.css` | White cards on a cool ground, one colour per network |
| Week 4 onwards | `type.css`, `corridor.css`, `post.css` | Week 3's look in Week 4's card form |
| Play | `type.css`, `site.css`, `signal.css` | Dark scoreboard with yellow highlights |

A new post links `type.css`, `corridor.css` and `post.css` and nothing else. A rule another post could use
goes into `post.css` (`tests/stylesheets.test.mjs` checks this). The `/styleguide` page shows Week 3's
palettes and skins live.

Every page opens with the same top bar (`PostTopbar`): the wordmark on the left, the site nav (Home, Posts,
About) on the right. It is the page's only header: a page's own controls go in the bar as `tools`, just left
of the site nav behind a hairline (Weeks 1 and 2's data link and logbook, Cold Read's ways to play), never in a
second header under it. Its rules are in `topbar.css`, which the component imports, so pages outside the
corridor family get it too. There it keeps the corridor's light colours and scrolls with the page (the
mockups page keeps it stuck to the top); on corridor pages `corridor.css` maps it to the page's tokens and
skin and keeps it stuck to the top.

Every page closes with the same footer (`SiteFooter`): "02805 Social graphs and interactions · Fall 2026" on
the left, a Credits disclosure beside it and the GitHub link on the right. The page's data credits, in the form
each licence asks for, and any AI-use note that sat in the footer go inside Credits, which opens below its
summary. Its rules are in `footer.css`, which the component imports; `corridor.css` maps its colours to the
page's tokens and skin, as it does for the bar.

## Type

`src/styles/type.css` defines every font size and family. Stylesheets and charts take their type from these
tokens only.

| Token | Size | Use |
| --- | --- | --- |
| `--fs-display` | 54px | Page and home title |
| `--fs-h2` | 30px | Section title |
| `--fs-h3` | 22px | Topic title, home card title |
| `--fs-h4` | 20px | Card question |
| `--fs-lead` | 18px | The finding under a section title |
| `--fs-strong` | 16px | Card answer, hero lede |
| `--fs-body` | 13.5px | Body, drawer text, navigation |
| `--fs-small` | 12.5px | Buttons, table cells, chart labels |
| `--fs-caption` | 11.5px | Chart notes, ticks, legends, footer |

`--fs-numeral` (64px) is for section numbers and `--fs-jumbo` (96px) for Play's scoreboard only.

Families: `--font-sans` (the system UI stack) for text, `--font-display` (Barlow Condensed 800, bundled in
`src/fonts/`) for the wordmark and display numbers, and `--font-mono` for code.

## Colour

Each colour has one meaning on a page. Charts read colours from these custom properties with
`getComputedStyle`; a hex colour in a new JavaScript file fails `tests/theme.test.mjs`.

Posts from Week 3 on (`.corridor` in `corridor.css`):

| Token | Value | Meaning |
| --- | --- | --- |
| `--ink` | #0f2340 | Text |
| `--ink-soft` | #46618a | Secondary text |
| `--ink-mute` | #7a8fac | Inactive marks, guide lines, the grey series |
| `--ink-mute-text` | #59708f | Captions, tick labels and other quiet text (4.5:1 on `--ground`) |
| `--ground` | #eef3f9 | Page background |
| `--card` | #ffffff | Card surface |
| `--line` | #dce5f0 | Borders and rules |
| `--people` | #f2820c | People and migration, the main series |
| `--access` | #1f8fd6 | Flights and access, the comparison series |
| `--gain` / `--loss` | #00875a / #cc3311 | A diverging pair, separable under deuteranopia |
| `--outbound` | #6b4fbb | Third categorical slot |

`--ink-mute` is too pale for text (3:1 on `--ground`), so text takes `--ink-mute-text`. Each Week 3 skin sets
its own pair. Links and buttons use the accent #14618f. A scatter takes three categorical colours at most
(`--series-1` to `--series-3` in `post.css`) and greys out unlabelled points with `--series-none`.

The arcade pages (`arcade.css`) use the same navy, blue and orange under the names `--paper`, `--accent` and
`--hot` on the `--bg` ground.

## Variants

Week 3 offers readers alternative palettes and skins through attributes on `.corridor`. They change colour,
type and surface only, never a number or a control.

- `data-palette`: `ember`, `iris`, `okabe` (Okabe and Ito, safe for colourblind readers) and `slate` (no hue,
  for printing).
- `data-skin`: `editorial`, `terminal` (dark), `poster`.

## Layout

- Desktop only. Do not add phone layouts.
- Content width: 1120px on the arcade pages, 1180px on posts.
- Corners: 14px on post cards, 20px on arcade panels.
- Shadows are faint and navy-tinted. The top bar is translucent white with one hairline below.
- Headings stay bare: no pill, chip or badge beside them.

## Design artifacts

Design work done outside the repo lives in claude.ai artifacts. The kit is the one to build with; the rest
are records. All are private to Gyula unless noted.

| Artifact | What it holds |
| --- | --- |
| [Log-Log Legends Kit](https://claude.ai/artifact/JRrSbSw7WMvvxRr57oBmWD) | The design system to build with: the site's React components with live previews, this file and the post guide as guidelines. Synced from the repo (see `.design-sync/NOTES.md`); edit the repo, not the kit. |
| [Kit source project](https://claude.ai/design/p/90b493ad-23f8-40f4-9a54-b3d9b491d29b) | The claude.ai/design project `/design-sync` writes to; "Migrate again" copies it into the kit. Closes 14 December 2026. |
| [Log-Log Legends tokens](https://claude.ai/artifact/2DfxHtPMWbJSRnDk19Hxf8) | The first design system, tokens only, from `corridor.css` and `week04.css` (23 Sep). Superseded by the kit. |
| [Social Graphs design](https://claude.ai/artifact/Gcx984yt52bQBL2Bb2tJ8F) | The main canvas: Week 4 boards, the brief-gaps page, Week 5 boards, the chart and graph kits, the post template. Mirrored in `review/week04-redesign/`. Shared by link. |
| [Home canvas](https://claude.ai/artifact/TexCswK63W8faQ5baT3Km5) | One board of the home page (29 Sep). |
| [Week 6 essentials](https://claude.ai/artifact/PjKYabEmWLxe9kHeY1yWSS) | Week 6 canvas: Cold Read levels, practice and campaign, and the TF-IDF, PMI, GloVe, cosine and topic cards. |
| [Corridor Control Directions](https://claude.ai/artifact/6J32d5xusbCr4heiK8erCV) | Week 3 design directions: Blockwork, Instrument, Plate and Today boards. |
| [Corridor Control Design System](https://claude.ai/artifact/Ggj54hgjB2CY1oNjAE8kAg) | Week 3's design system read from `corridor.css`: components, charts, skins. |
| [Screen Test](https://claude.ai/artifact/LwE1yHYd7hSyhjFDFdUa7j) | Week 2 prototype: ER, WS and BA models and the degree-preserving null on the Marvel network. |
| [The Closure Cabinets](https://claude.ai/artifact/7PrPn4YwVmRArxbSHpZtVF) | Four Week 2 closure-game prototypes on the Marvel snapshot. |
| [Social Graphs Test 1](https://claude.ai/artifact/51D4UuUZa1uft2rKXwKhGc) | Practice test for weeks 1 to 4. Shared by link. |
| [Cold Read Endings](https://claude.ai/artifact/Hp6aVeQyJtD3ce5o6iQ492) | Gallery of the game's animated game-over endings. Shared by link. |
| [Cold Read portrait sources](https://claude.ai/artifact/R2HXmQqreW9W5RfLCrMq2H) | Portrait coverage for the 303 Marvel pages, measured 7 Oct. |
| [Log-Log Dash Fix](https://claude.ai/artifact/9rhyjkaihidKFQbzkXZMxz) | Before and after screenshots of #277, the hyphen in the name (see Name above). |
