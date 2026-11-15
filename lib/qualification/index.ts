import {
  scoreBusinessFit,
  scoreDiscoveryQuality,
  scoreIcpFit,
  scoreNeedSignal,
  scoreReachability,
} from "./rules.ts";
import type { DiscoveredCompany } from "../discovery/types.ts";
import type { QualificationContext } from "./types.ts";

export * from "./types.ts";
export * from "./service-fit.ts";
export * from "./calculator.ts";

export {
  scoreBusinessFit,
  scoreDiscoveryQuality,
  scoreIcpFit,
  scoreNeedSignal,
  scoreReachability,
} from "./rules.ts";

export function qualifyCompany(
  company: DiscoveredCompany,
  context: QualificationContext
): { score: number; status: "new" | "qualified"; reasons: string[] } {
  const parts = [
    scoreIcpFit(company, context),
    scoreBusinessFit(company),
    scoreDiscoveryQuality(company),
    scoreNeedSignal(company),
    scoreReachability(company),
  ];

  const score = Math.min(
    100,
    Math.max(
      0,
      parts.reduce((sum, part) => sum + part.points, 0)
    )
  );
  const reasons = parts.flatMap((part) => part.reasons);

  return {
    score,
    status: score >= 60 ? "qualified" : "new",
    reasons,
  };
}
