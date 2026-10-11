import { Auditions, Draw, Foot, Null, Receipts, Rig, Snap, Tail, Vitals } from "@/features/screen-test/Sheet";

export default function Page() {
  return (
    <>
      <div className="sheet">
        <header className="masthead">
          <p className="lbl crumbs">
            <a href="../../">Log–Log Legends</a>
            {" "}
            /
            {" "}
            <a href="../../weeks/week02/">Week 2: Marvel Transit Authority</a>
          </p>
          <p className="lbl">02805 Social graphs &amp; interactions · Week 2 · Models &amp; null models</p>
          <h1>
            Screen
            <br />
            Test
          </h1>
          <p className="deck">
            Three famous models audition for the part of the Marvel network. Each one nails a scene and fluffs the rest. Then we stop asking which model looks right and start asking what chance could have produced.
          </p>
          <div className="billing">
            <span className="lbl">Log–Log Legends</span>
            {" "}
            <span className="lbl">Àngela · Gyula · Niklas</span>
            {" "}
            <Snap />
          </div>
        </header>
        <section className="act">
          <div className="rail">
            <div className="no">00</div>
            <p className="lbl tag">The part</p>
          </div>
          <div className="act-body">
            <h2>One network, cast decades ago</h2>
            <p>
              The role is the connected core of the Marvel Wikipedia snapshot: every article that can reach every other by following links in either direction. These are the numbers a candidate has to reproduce.
            </p>
            <Vitals />
            <p>
              Network science began by asking whether a simple mechanism could manufacture a structure like this. Three attempts follow, in the order the field made them, each fixing what the last one missed.
            </p>
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">01</div>
            <p className="lbl tag">The auditions</p>
          </div>
          <div className="act-body">
            <h2>Three candidates, three scenes</h2>
            <p>
              Every candidate is built to the same size as Marvel and handed the same three scenes to play:
              {" "}
              <em className="key">short paths</em>
              ,
              {" "}
              <em className="key">clustering</em>
              , and
              {" "}
              <em className="key">hubs</em>
              . Pick one and watch it try.
            </p>
            <Auditions />
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">02</div>
            <p className="lbl tag">The tail</p>
          </div>
          <div className="act-body">
            <h2>Where the candidates give themselves away</h2>
            <p>
              The share of articles with at least
              {" "}
              <em className="key">k</em>
              {" "}
              links, on log axes, with no binning. A heavy tail runs straight and far. A coin-flip tail falls off a cliff. This is a visual read, not a fitted power law: no distribution was fit to these tails.
            </p>
            <Tail />
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">03</div>
            <p className="lbl tag">The turn</p>
          </div>
          <div className="act-body">
            <h2>Stop casting. Start testing.</h2>
            <p>
              No model wins, so the question changes. Instead of building a network that looks like Marvel, keep Marvel's own degrees exactly and scramble only
              {" "}
              <em className="key">who is wired to whom</em>
              . Swap the ends of two links at a time, over and over. Everyone keeps their link count. The neighbourhoods dissolve.
            </p>
            <Rig />
            <p>
              One shuffle proves nothing, so we ran many and kept the score. Marvel's real value sits against the whole distribution of what scrambling produces.
            </p>
            <Null />
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">04</div>
            <p className="lbl tag">The negative</p>
          </div>
          <div className="act-body">
            <h2>The result that went against us</h2>
            <p>
              Draw a character at random, then one of their neighbours at random. The neighbour usually has more links, because popular articles sit in many neighbour lists. That is the friendship paradox, and it is real here. Pull the handle a few times and watch it appear.
            </p>
            <Draw />
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">05</div>
            <p className="lbl tag">Receipts</p>
          </div>
          <div className="act-body">
            <h2>How every number here was made</h2>
            <Receipts />
          </div>
        </section>
        <footer>
          <Foot />
          <p className="lbl foot-links">
            <a href="../../weeks/week02/">← Back to the Week 2 post</a>
            {" "}
            ·
            {" "}
            <a href="../../">Log–Log Legends</a>
          </p>
        </footer>
      </div>
    </>
  );
}
