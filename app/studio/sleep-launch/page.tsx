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
        <h1>We are now running a 10-video natural healing series through the sleep-music workflow.</h1>
        <p>
          This page keeps the channel identity, the current 10-theme lineup, and the next
          publish-ready target in one place so we can keep shipping without re-deciding the series.
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
          <p>Nature series concepts ready</p>
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
          <strong>Theme:</strong> {primaryConcept.themeLabel}
        </p>
        <p>
          <strong>Hook:</strong> {primaryConcept.hook}
        </p>
        <p>
          <strong>Angle:</strong> {primaryConcept.angle}
        </p>
        <p>
          <strong>Audio direction:</strong> {primaryConcept.audioDirection}
        </p>
        <p>
          <strong>Visual direction:</strong> {primaryConcept.visualDirection}
        </p>
        <p className="sidebarText">
          Scenic-first is now the chosen main direction. The lineup deliberately mixes forest, sea,
          rain, waterfall, wind, and dusk themes so the channel feels broader than a one-format test.
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
              <h3>{concept.themeLabel}</h3>
              <span>{concept.minutes} min</span>
            </div>
            <p>
              <strong>{concept.title}</strong>
            </p>
            <p>{concept.hook}</p>
            <p className="sidebarText">{concept.angle}</p>
            <p className="sidebarText">
              <strong>Audio:</strong> {concept.audioDirection}
            </p>
            <p className="sidebarText">
              <strong>Visual:</strong> {concept.visualDirection}
            </p>
            <div className="inlineTags">
              <span className="tagPill">{concept.id}</span>
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
