import Link from "next/link";

import { listImportedFootageRecords } from "@/lib/imported-footage-library";

export default async function FootageLibraryPage() {
  const records = await listImportedFootageRecords();

  return (
    <>
      <section className="hero">
        <span className="pill">footage library</span>
        <h1>Keep real scenic motion clips ready for sleep uploads.</h1>
        <p>
          This page is the shelf for licensed ocean, waterfall, rain, or night-motion footage that
          can replace the static scenic background in Sleep Lab renders.
        </p>
        <div className="inlineActions">
          <Link className="secondaryButton" href="/studio/sleep-lab">
            Back To Sleep Lab
          </Link>
          <Link className="secondaryButton" href="/studio/audio-library">
            Open Audio Library
          </Link>
        </div>
      </section>

      {records.length === 0 ? (
        <section className="emptyState">
          No scenic footage has been saved yet. Import a licensed waterfall, wave, or rain clip in
          Sleep Lab first.
        </section>
      ) : (
        <section className="sleepTemplateGrid">
          {records.map((record) => (
            <article key={record.id} className="studioCard">
              <div className="panelHeader">
                <h3>{record.title}</h3>
                <span>moving scenic</span>
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
                  Open Footage
                </a>
                <Link className="primaryButton" href="/studio/sleep-lab">
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
