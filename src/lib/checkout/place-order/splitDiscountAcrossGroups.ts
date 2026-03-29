export function splitDiscountAcrossGroups(
  groups: Array<{ baseAmount: number }>,
  totalDiscount: number,
) {
  if (groups.length === 0 || totalDiscount <= 0) {
    return groups.map(() => 0);
  }

  const totalBase = groups.reduce((sum, group) => sum + group.baseAmount, 0);
  if (totalBase <= 0) {
    return groups.map(() => 0);
  }

  const rawDiscounts = groups.map(
    (group) => (group.baseAmount / totalBase) * totalDiscount,
  );
  const floored = rawDiscounts.map((value) => Math.floor(value * 100) / 100);
  const flooredTotal = floored.reduce((sum, value) => sum + value, 0);
  let remainder = Math.round((totalDiscount - flooredTotal) * 100);

  const sortedIndexes = rawDiscounts
    .map((value, index) => ({ index, frac: value - floored[index] }))
    .sort((a, b) => b.frac - a.frac)
    .map((entry) => entry.index);

  for (let i = 0; i < remainder; i += 1) {
    const idx = sortedIndexes[i % sortedIndexes.length];
    floored[idx] += 0.01;
  }

  return floored;
}
