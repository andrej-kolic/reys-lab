/**
 * Run the gate.
 *
 *   pnpm --filter @reys-lab/scale gate
 *
 * Exits non-zero on a failure, so it can be a build step. A pair that is
 * below its floor on purpose is declared in gate.ts and reported without
 * failing — the point is that it stays visible, not that it stays quiet.
 */

import { gate } from "./gate.ts";

const result = gate();
console.log(result.text);
process.exit(result.failures === 0 ? 0 : 1);
