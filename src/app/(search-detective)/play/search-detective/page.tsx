import { PostTopbar } from "@/components/site/PostTopbar";
import { SearchDetective } from "@/features/search-detective/SearchDetective";

// Semantic Search Detective: the Week 7 game on document embeddings and
// semantic search. The cases and scoring are in src/features/search-detective/rounds.ts.
export default function Page() {
  return (
    <>
      <PostTopbar
        root="../../"
        tools={
          <nav className="cr-rounds" aria-label="Game tools">
            <a href="../week07/">Campaign</a>
          </nav>
        }
      />
      <div className="cr-shell">
        <main id="main">
          <p className="cr-h">Week 7 · Search by meaning</p>
          <h1 className="cr-title">
            Semantic Search <span>Detective</span>
          </h1>
          <SearchDetective />
        </main>
        <footer className="cr-foot">
          <p>
            Semantic Search Detective · Week 7 · <a href="../../">Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
