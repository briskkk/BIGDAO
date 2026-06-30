import type { Goal, WealthGoal } from "@/types/domain";
import { projectGoal, requiredAnnualReturn, requiredMonthlyContribution } from "@/lib/calculations";

export function toLegacyGoal(goal: WealthGoal, currentAmount: number): Goal {
  return {
    id: goal.id,
    name: goal.name,
    targetAmountCny: goal.targetAmount,
    currentAge: goal.currentAge,
    targetAge: goal.targetAge,
    monthlyContributionCny: goal.monthlyContribution,
    currentAmountCny: currentAmount
  };
}

export function calculateGoalStatus(goal: WealthGoal, currentAmount: number) {
  const legacy = toLegacyGoal(goal, currentAmount);
  const scenarios = projectGoal(legacy, [
    Math.max(0, goal.expectedAnnualReturn - 0.03),
    goal.expectedAnnualReturn,
    goal.expectedAnnualReturn + 0.03
  ]);
  const finalBase = scenarios[1].points.at(-1)?.amountCny ?? currentAmount;
  return {
    legacy,
    scenarios,
    progress: goal.targetAmount === 0 ? 0 : currentAmount / goal.targetAmount,
    requiredMonthlyContribution: requiredMonthlyContribution(legacy, goal.expectedAnnualReturn),
    requiredAnnualReturn: requiredAnnualReturn(legacy),
    path: finalBase >= goal.targetAmount * 1.03 ? "above" : finalBase >= goal.targetAmount * 0.97 ? "near" : "below"
  };
}
