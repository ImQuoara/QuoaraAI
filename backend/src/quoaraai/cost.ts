export interface CostEstimate {
  provider: string;
  model: string;
  estimatedUsd: number;
  basis: string;
}

export function chooseLowerCostRoute(estimates: CostEstimate[]) {
  return [...estimates].filter((x) => x.estimatedUsd >= 0).sort((a, b) => a.estimatedUsd - b.estimatedUsd)[0] ?? null;
}
