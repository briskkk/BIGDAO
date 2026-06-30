import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { getWealthRepository } from "@/lib/repository";

export default async function PortfolioPage() {
  return <PortfolioClient repo={await getWealthRepository()} />;
}
