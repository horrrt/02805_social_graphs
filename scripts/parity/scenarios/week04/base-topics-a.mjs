// P0b base scenario for Week 4's topics, part a: the first three
// details.rx-topic boxes opened in turn from the catalogue's topic heads (the
// topic summaries are display: none), each closed again by its back link
// (#cut) so the catalogue shows for the next one (one topic open at a time; opening one
// also opens its first panel), with a snapshot after each.
const TOPICS = ["topic-where", "topic-jobs", "topic-outsourcing"];

export default [
  {
    name: "w4-topics-a",
    url: "weeks/week04/",
    steps: TOPICS.flatMap((id) => [{ click: `a.rx-tcard-head[href="#${id}"]`, label: `open ${id}` }, { snap: true }, { click: `#${id} a.rx-back`, label: "back to the catalogue" }]),
  },
];
