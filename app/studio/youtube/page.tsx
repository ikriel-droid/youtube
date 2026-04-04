import { YouTubeUploadPanel } from "@/components/youtube-upload-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface YouTubeStudioPageProps {
  searchParams?: {
    status?: string;
    message?: string;
  };
}

export default function YouTubeStudioPage({ searchParams }: YouTubeStudioPageProps) {
  return (
    <>
      <section className="hero">
        <span className="pill">youtube api path</span>
        <h1>Connect Google OAuth and test a real private YouTube upload.</h1>
        <p>
          This is the experimental API path. The product still prefers manual-first for the first release,
          but this page lets us validate the direct upload flow against a real channel.
        </p>
      </section>

      <YouTubeUploadPanel
        initialStatus={searchParams?.status}
        initialMessage={searchParams?.message}
      />
    </>
  );
}
