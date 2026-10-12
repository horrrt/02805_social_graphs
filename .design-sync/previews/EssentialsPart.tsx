import { EssentialsPart, Plot } from "log-log-legends-kit";

// The Week 6 essentials page's eight explorables, each in its Plot as the page
// shows it; each loads its own JSON from the live site.

export const Weights = () => (
  <Plot title="A page's words by raw count and by TF-IDF">
    <EssentialsPart part="weights" />
  </Plot>
);

export const Cosine = () => (
  <Plot title="Two pages' cosine, word by word">
    <EssentialsPart part="cosine" />
  </Plot>
);

export const Contrast = () => (
  <Plot title="Every word's frequency rank on women's and men's pages">
    <EssentialsPart part="contrast" />
  </Plot>
);

export const Topics = () => (
  <Plot title="The topics of one fit, and one page's mixture">
    <EssentialsPart part="topics" />
  </Plot>
);

export const Contexts = () => (
  <Plot title="One word's row of the word-context matrix">
    <EssentialsPart part="contexts" />
  </Plot>
);

export const Pmi = () => (
  <Plot title="One word's neighbours by count, PMI and PPMI">
    <EssentialsPart part="pmi" />
  </Plot>
);

export const Vectors = () => (
  <Plot title="Nearest words under PPMI, skip-gram and CBOW">
    <EssentialsPart part="vectors" />
  </Plot>
);

export const Glove = () => (
  <Plot title="Nearest words in GloVe and in the Marvel skip-gram">
    <EssentialsPart part="glove" />
  </Plot>
);
