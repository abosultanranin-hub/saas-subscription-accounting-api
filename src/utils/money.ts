export function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

export function centsToDollars(value: number) {
  return value / 100;
}
