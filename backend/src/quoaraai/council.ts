export type CouncilRole = 'builder' | 'critic' | 'researcher' | 'verifier' | 'security';

export interface CouncilSeat {
  role: CouncilRole;
  objective: string;
}

export const DEFAULT_COUNCIL: CouncilSeat[] = [
  { role: 'builder', objective: 'Propose the strongest practical implementation.' },
  { role: 'critic', objective: 'Find flaws, edge cases, and unnecessary complexity.' },
  { role: 'researcher', objective: 'Identify facts that need outside verification or documentation.' },
  { role: 'verifier', objective: 'Check whether claims and outputs are actually supported.' },
  { role: 'security', objective: 'Check permissions, secrets, destructive actions, and abuse paths.' },
];

export function buildCouncilBrief(task: string, seats = DEFAULT_COUNCIL) {
  return seats.map((seat) => ({ ...seat, task }));
}
