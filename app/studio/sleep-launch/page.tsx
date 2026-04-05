import Link from "next/link";

import {
  firstSleepVideoConcepts,
  getFirstPublishReadyConcept,
  sleepChannelIdentity
} from "@/lib/sleep-launch-plan";

export default function SleepLaunchPage() {
  const primaryConcept = getFirstPublishReadyConcept();

  return (
    <>
      <section className="hero">
        <span className="pill">first channel launch</span>
        <h1>We are launching the sleep-music workflow as a manual-first YouTube channel.</h1>
        <p>
          This page keeps the first channel identity, the first three concepts, and the first
          publish-ready target in one place so we can move without re-deciding the basics every time.
        </p>
        <div className="inlineActions">
          <Link className="secondaryButton" href="/studio/sleep-lab">
            Open Sleep Lab
          </Link>
          <Link className="primaryButton" href="/studio/sleep-library">
            Open Sleep Library
          </Link>
          <Link className="secondaryButton" href="/studio/youtube">
            Open YouTube Upload
          </Link>
        </div>
      </section>

      <section className="summaryGrid">
        <article className="summaryCard">
          <h2>{sleepChannelIdentity.channelName}</h2>
          <p>First channel identity</p>
        </article>
        <article className="summaryCard">
          <h2>Manual-first</h2>
          <p>Upload path chosen for the first real validation loop</p>
        </article>
        <article className="summaryCard">
          <h2>{firstSleepVideoConcepts.length}</h2>
          <p>Launch concepts ready</p>
        </article>
      </section>

      <section className="panel stack">
        <div className="panelHeader">
          <h2>Channel Identity</h2>
          <span>chosen niche</span>
        </div>
        <p>
          <strong>Name:</strong> {sleepChannelIdentity.channelName}
        </p>
        <p>
          <strong>Slug:</strong> {sleepChannelIdentity.channelSlug}
        </p>
        <p>
          <strong>Niche:</strong> {sleepChannelIdentity.niche}
        </p>
        <p>
          <strong>Tagline:</strong> {sleepChannelIdentity.tagline}
        </p>
      </section>

      <section className="panel stack">
        <div className="panelHeader">
          <h2>First Publish-Ready Target</h2>
          <span>{primaryConcept.id}</span>
        </div>
        <p>
          <strong>Title:</strong> {primaryConcept.title}
        </p>
        <p>
          <strong>Hook:</strong> {primaryConcept.hook}
        </p>
        <p>
          <strong>Angle:</strong> {primaryConcept.angle}
        </p>
        <p className="sidebarText">
          Scenic-first is now the chosen main direction. Black-screen stays as a utility fallback for
          overnight validation and niche search intent.
        </p>
        <div className="inlineTags">
          <span className="tagPill">{primaryConcept.preset}</span>
          <span className="tagPill">{primaryConcept.releasePreset}</span>
          <span className="tagPill">{primaryConcept.minutes} minutes</span>
        </div>
      </section>

      <section className="sleepTemplateGrid">
        {firstSleepVideoConcepts.map((concept) => (
          <article key={concept.id} className="studioCard">
            <div className="panelHeader">
              <h3>{concept.id}</h3>
              <span>{concept.minutes} min</span>
            </div>
            <p>
              <strong>{concept.title}</strong>
            </p>
            <p>{concept.hook}</p>
            <p className="sidebarText">{concept.angle}</p>
            <div className="inlineTags">
              <span className="tagPill">{concept.preset}</span>
              <span className="tagPill">{concept.releasePreset}</span>
              {concept.tags.map((tag) => (
                <span key={tag} className="tagPill">
                  {tag}
                </span>
              ))}
            </div>
            <Link
              className="secondaryButton"
              href={`/studio/sleep-lab?concept=${concept.id}`}
            >
              Open In Sleep Lab
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
