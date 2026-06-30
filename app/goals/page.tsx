import { GoalsClient } from "@/components/goals/goals-client";
import { getWealthRepository } from "@/lib/repository";

export default async function GoalsPage() {
  const repo = await getWealthRepository();
  return <GoalsClient goal={repo.goal} mode={repo.mode} updatedAt={repo.operational.updatedAt} />;
}
