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
        <h1>Connect Google OAuth and push a real scenic sleep upload to YouTube.</h1>
        <p>
          This is the direct upload path. Imported licensed audio is now the preferred scenic workflow,
          while generated scenic concepts remain available as the fallback path.
        </p>
      </section>

      <YouTubeUploadPanel
        initialStatus={searchParams?.status}
        initialMessage={searchParams?.message}
      />
    </>
  );
}
