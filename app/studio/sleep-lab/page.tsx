import { SleepTrackLab } from "@/components/sleep-track-lab";

interface SleepLabPageProps {
  searchParams?: {
    concept?: string;
  };
}

export default function SleepLabPage({ searchParams }: SleepLabPageProps) {
  return <SleepTrackLab initialConceptId={searchParams?.concept} />;
}
