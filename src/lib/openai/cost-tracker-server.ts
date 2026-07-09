import { AsyncLocalStorage } from "async_hooks";
import { CostTracker, type GenerationCostDelta } from "./cost-tracker";

const costTrackerStorage = new AsyncLocalStorage<CostTracker>();

export function getActiveCostTracker(): CostTracker | undefined {
  return costTrackerStorage.getStore();
}

export async function withCostTracking<T>(
  fn: () => Promise<T>
): Promise<{ value: T; cost: GenerationCostDelta }> {
  const tracker = new CostTracker();
  const value = await costTrackerStorage.run(tracker, fn);
  return { value, cost: tracker.toDelta() };
}
