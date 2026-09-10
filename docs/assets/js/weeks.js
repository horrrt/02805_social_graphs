// The only place the course schedule lives. Mirrors the week list at
// https://sunelehmann.com/socialgraphs2026-web/index.html (autumn 2026).
// To open a week: set status to "live", add its cabinet, and update the
// "exactly weeks … are live" assertion in tests/site.test.mjs.
export const GROUP = {
  name: "Log–Log Legends",
  members: ["Àngela Buxó", "Gyula Kürthy", "Niklas Johansen"],
  course: "02805 · Social graphs and interactions · Fall 2026",
};

export const WEEKS = [
  {
    n: 1,
    courseTitle: "Networks",
    short: "NETWORKS",
    date: "2026-09-02",
    status: "live",
    cabinet: {
      name: "Hero Packs",
      marquee: "HERO PACKS",
      href: "weeks/week01/",
      blurb: "Open five. Chase the rare ones. Learn why the tail wins.",
    },
  },
  {
    n: 2,
    courseTitle: "Models & null models",
    short: "NULL MODELS",
    date: "2026-09-09",
    status: "live",
    cabinet: {
      name: "Transit Authority",
      marquee: "TRANSIT",
      href: "weeks/week02/",
      blurb: "Close a station. See who loses their way home.",
    },
  },
  {
    n: 3,
    courseTitle: "Who matters, and why",
    short: "WHO MATTERS",
    date: "2026-09-16",
    status: "coming",
  },
  {
    n: 4,
    courseTitle: "Communities & backbones",
    short: "COMMUNITIES",
    date: "2026-09-23",
    status: "coming",
  },
  {
    n: 5,
    courseTitle: "The language half · NLP I",
    short: "NLP I",
    date: "2026-09-30",
    status: "coming",
  },
  { n: 6, courseTitle: "NLP II", short: "NLP II", date: "2026-10-07", status: "coming" },
  { n: 7, courseTitle: "NLP III", short: "NLP III", date: "2026-10-21", status: "coming" },
  {
    n: 8,
    courseTitle: "Networks × language",
    short: "NET × LANGUAGE",
    date: "2026-10-28",
    status: "coming",
  },
];

// Experiments over the same snapshot. They carry no week number and are not posts.
export const FREE_PLAY = [
  { name: "MARVEL-OS 303", href: "os/" },
  { name: "Hero Trumps", href: "trumps/" },
  { name: "Hidden Districts", href: "os/?app=communities" },
  { name: "Walk / Listen", href: "sound/" },
  { name: "Keep It Together", href: "creature/" },
  { name: "Inside the Articles", href: "os/?app=notepad" },
  { name: "Word Finder", href: "os/?app=search" },
];

// Prediction ids that were filed under invented weeks 3–8 before this manifest existed.
export const FREE_PLAY_PREDICTIONS = new Set([
  "w3-coverage",
  "w4-communities",
  "w5-walk",
  "w6-repairs",
  "w7-mutant",
  "w8-search",
]);

export const liveWeeks = () => WEEKS.filter((w) => w.status === "live");
export const currentWeek = () => liveWeeks().at(-1);
export const weekLabel = (n) =>
  Number.isInteger(n) && n >= 1 ? `W${String(n).padStart(2, "0")}` : "FREE PLAY";

const MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");
export const shortDate = (iso) => {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};
