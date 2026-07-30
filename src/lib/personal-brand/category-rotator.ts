import {
  PERSONAL_BRAND_CATEGORY_WEIGHTS,
  type PersonalBrandCategoryId,
} from "@/lib/knowledge/personal-brand";

const CATEGORY_IDS = Object.keys(
  PERSONAL_BRAND_CATEGORY_WEIGHTS
) as PersonalBrandCategoryId[];

/**
 * Weighted random category. When recent categories are provided, prefer one
 * that has not appeared recently (still respects relative weights among candidates).
 */
export function pickPersonalBrandCategory(
  recentCategories: PersonalBrandCategoryId[] = []
): PersonalBrandCategoryId {
  const recentSet = new Set(recentCategories.slice(0, 8));
  const unused = CATEGORY_IDS.filter((id) => !recentSet.has(id));
  const pool = unused.length > 0 ? unused : CATEGORY_IDS;

  const totalWeight = pool.reduce(
    (sum, id) => sum + PERSONAL_BRAND_CATEGORY_WEIGHTS[id],
    0
  );
  let roll = Math.random() * totalWeight;

  for (const id of pool) {
    roll -= PERSONAL_BRAND_CATEGORY_WEIGHTS[id];
    if (roll <= 0) return id;
  }

  return pool[pool.length - 1] ?? "education";
}

/** Light heuristic when the user steers with a topic. */
export function inferCategoryFromTopic(
  topic: string
): PersonalBrandCategoryId | undefined {
  const t = topic.toLowerCase();
  if (!t.trim()) return undefined;

  if (
    /\b(feature|release|shipped|launch|update|milestone|user feedback|beta|demo)\b/.test(
      t
    ) ||
    t.includes("advisorpilot")
  ) {
    return "product-updates";
  }
  if (
    /\b(father|dad|family|wife|kids|health|habit|book|faith|conference|travel|community)\b/.test(
      t
    )
  ) {
    return "personal";
  }
  if (
    /\b(founder|startup|hiring|fundraising|developer|built|building|saas|leadership lesson|mistake)\b/.test(
      t
    )
  ) {
    return "founder-journey";
  }
  if (
    /\b(retirement|roth|annuity|tax|social security|medicare|client|practice|ai |prospect|compliance)\b/.test(
      t
    )
  ) {
    return "education";
  }

  return undefined;
}
