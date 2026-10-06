# Log–Log Legends design

This file records the course website's visual design: which stylesheets each page uses, the type scale, the
colours and what each colour means. The stylesheets in `src/styles/` are the source of truth. When a value
here disagrees with them, the CSS wins: fix this file in the same pull request.

Code rules for charts, controls and accessibility are in
[.github/instructions/site.instructions.md](.github/instructions/site.instructions.md). Layout and writing
rules for posts are in [project/POST_GUIDE.md](project/POST_GUIDE.md).

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
| `--ink-mute` | #7a8fac | Captions, inactive marks |
| `--ground` | #eef3f9 | Page background |
| `--card` | #ffffff | Card surface |
| `--line` | #dce5f0 | Borders and rules |
| `--people` | #f2820c | People and migration, the main series |
| `--access` | #1f8fd6 | Flights and access, the comparison series |
| `--gain` / `--loss` | #00875a / #cc3311 | A diverging pair, separable under deuteranopia |
| `--outbound` | #6b4fbb | Third categorical slot |

Links and buttons use the accent #14618f. A scatter takes three categorical colours at most
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
