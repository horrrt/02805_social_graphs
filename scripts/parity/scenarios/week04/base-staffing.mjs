// P0b base scenario for Week 4's staffing chart (week04-staffing.js,
// week04-frame.js segments): each year button by click, the year control by
// ArrowRight, End and Home, a client typed into the staffing search, and a
// client typed into the ego search of week04-vis-intros.js.
const YEARS = ["2022", "2023", "2024", "2025", "2026"];

export default [
  {
    name: "w4-staffing",
    url: "weeks/week04/",
    steps: [
      { hash: "#staffing-figure" },
      ...YEARS.flatMap((y) => [{ click: `#staffing-figure [data-year="${y}"]`, label: `year ${y}` }, { snap: true }]),
      { press: ['#staffing-figure [data-year="2022"]', "ArrowRight"], label: "year ArrowRight" },
      { snap: true },
      { press: [null, "End"], label: "year End" },
      { snap: true },
      { press: [null, "Home"], label: "year Home" },
      { snap: true },
      { type: ["#staffing-figure input[type=search]", "Verizon"] },
      { press: ["#staffing-figure input[type=search]", "Tab"], label: "staffing search Verizon" },
      { snap: true },
      { type: ['input[aria-label="Find a client"]', "Apple"], label: "ego search Apple" },
      { snap: true },
    ],
  },
];
