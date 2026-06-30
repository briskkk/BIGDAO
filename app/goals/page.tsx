import { GoalsClient } from "@/components/goals/goals-client";
import { getWealthRepository } from "@/lib/repository";

export default function GoalsPage() {
  return <GoalsClient goal={getWealthRepository().goal} />;
}
