import { describe, expect, it } from "vitest";
import { buildAssetSnapshot, buildHoldingViews, convertToCny, projectGoal, requiredMonthlyContribution } from "@/lib/calculations";
import { accounts, fxRates, goal, holdings, instruments, quotes } from "@/lib/mock-data";

const input = { accounts, holdings, instruments, quotes, fxRates };

describe("wealth calculations", () => {
  it("converts currencies to CNY", () => {
    expect(convertToCny(100, "USD", fxRates)).toBeCloseTo(718);
    expect(convertToCny(100, "HKD", fxRates)).toBeCloseTo(92);
  });

  it("summarizes net worth and investable assets separately", () => {
    const snapshot = buildAssetSnapshot(input);
    expect(snapshot.netWorthCny).toBeGreaterThan(7_000_000);
    expect(snapshot.netWorthCny).toBeLessThan(8_300_000);
    expect(snapshot.investableAssetsCny).toBeGreaterThan(900_000);
    expect(snapshot.investableAssetsCny).toBeLessThan(1_200_000);
  });

  it("calculates position ratio from investable base", () => {
    const views = buildHoldingViews(input);
    const qqqm = views.find((view) => view.instrument.id === "qqqm");
    expect(qqqm?.investableRatio).toBeGreaterThan(0);
    expect(views.find((view) => view.instrument.id === "home")?.investableRatio).toBeGreaterThan(1);
  });

  it("projects goal scenarios and required monthly contribution", () => {
    const snapshot = buildAssetSnapshot(input);
    const activeGoal = { ...goal, currentAmountCny: snapshot.investableAssetsCny };
    const scenarios = projectGoal(activeGoal);
    expect(scenarios).toHaveLength(3);
    expect(scenarios[1].points).toHaveLength(10);
    expect(requiredMonthlyContribution(activeGoal, 0.07)).toBeGreaterThan(activeGoal.monthlyContributionCny);
  });
});
