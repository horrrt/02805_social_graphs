import { ColdReadRoot, Frame, LEVELS } from "log-log-legends-kit";

// The practice menu: the game's frame around one card per round, built from
// LEVELS as /play/cold-read/practice/ builds it.
export const PracticeMenu = () => (
  <ColdReadRoot>
    <Frame page="practice" home="./">
      <ol className="cr-menu">
        {LEVELS.map((l: { id: string; name: string; topic: string; blurb: string }, i: number) => (
          <li key={l.id}>
            <div className="cr-menu-card">
              <span className="cr-menu-n">{i + 1}</span>
              <span className="cr-menu-name">{l.name}</span>
              <span className="cr-menu-topic">{l.topic}</span>
              <p>{l.blurb}</p>
              <button type="button" className="cr-go">Play {l.name}</button>
            </div>
          </li>
        ))}
      </ol>
    </Frame>
  </ColdReadRoot>
);
