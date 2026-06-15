import type { Metadata } from "next";
import ResultsView from "./ResultsView";

interface PageProps {
  params: Promise<{ zip: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { zip } = await params;
  return {
    title: `What to grow in ${zip}`,
    description: `Your USDA hardiness zone for ZIP ${zip} and the vegetables and herbs that grow best there.`,
  };
}

export default async function ResultsPage({ params }: PageProps) {
  const { zip } = await params;
  return <ResultsView zip={zip} />;
}
