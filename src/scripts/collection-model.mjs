// Expected distinct cards in independent draws with replacement.
export function expectedDistinct(probabilities, draws) {
  return probabilities.reduce(
    (total, p) =>
      total +
      (p === 1 ? Number(draws > 0) : -Math.expm1(draws * Math.log1p(-p))),
    0,
  );
}
