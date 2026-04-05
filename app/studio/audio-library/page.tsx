import Link from "next/link";

import { listImportedAudioRecords } from "@/lib/imported-audio-library";

export default async function AudioLibraryPage() {
  const records = await listImportedAudioRecords();

  return (
    <>
      <section className="hero">
        <span className="pill">audio library</span>
        <h1>Keep licensed sleep audio in one place before turning it into scenic uploads.</h1>
        <p>
          This page is the shelf for imported audio beds that came from real packs, licensed sources,
          or tracks we want to reuse across multiple scenic uploads.
        </p>
        <div className="inlineActions">
          <Link className="secondaryButton" href="/studio/sleep-lab">
            Back To Sleep Lab
          </Link>
          <Link className="primaryButton" href="/studio/sleep-library">
            Open Sleep Library
          </Link>
        </div>
      </section>

      {records.length === 0 ? (
        <section className="emptyState">
          No imported audio has been saved yet. Use the imported-audio mode in Sleep Lab to bring in
          licensed sleep tracks first.
        </section>
      ) : (
        <section className="sleepTemplateGrid">
          {records.map((record) => (
            <article key={record.id} className="studioCard">
              <div className="panelHeader">
                <h3>{record.title}</h3>
                <span>{record.durationLabel}</span>
              </div>
              <p>
                <strong>Source:</strong> {record.sourceName}
              </p>
              <p className="sidebarText">{record.licenseNote}</p>
              <div className="inlineTags">
                {record.tags.map((tag) => (
                  <span key={tag} className="tagPill">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="inlineActions">
                <a className="secondaryButton" href={record.fileUrl} target="_blank" rel="noreferrer">
                  Open Audio
                </a>
                <Link
                  className="primaryButton"
                  href={`/studio/sleep-lab`}
                >
                  Use In Sleep Lab
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
