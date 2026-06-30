import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { getWealthRepository } from "@/lib/repository";

export default function PortfolioPage() {
  return <PortfolioClient repo={getWealthRepository()} />;
}
