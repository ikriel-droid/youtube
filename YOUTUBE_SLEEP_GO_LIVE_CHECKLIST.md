# YouTube Sleep Music Go-Live Checklist

This checklist is the practical path for shipping the current sleep-music workflow to a real YouTube channel.

It is intentionally narrower than [PRODUCT_CHECKLIST.md](c:\Users\Administrator\.vscode\cli\localtube\PRODUCT_CHECKLIST.md).
Use this file when the goal is "publish sleep content on YouTube soon", not "finish the whole LocalTube product."

## 1. Minimum Content Pipeline

- [x] Generate loop-friendly sleep-audio WAV exports from Sleep Lab
- [x] Support longer 30 to 60 minute sleep tracks
- [x] Save generated sleep tracks into LocalTube so they survive refresh and restart
- [x] Add 2 to 3 export presets specifically for publish-ready sleep uploads
- [x] Let the creator set final title, channel, and publish state directly inside Sleep Lab
- [x] Add a reusable sleep-track library page for previously generated audio posts

## 2. Video Packaging For YouTube

- [ ] Render a publishable MP4 from audio plus a static or animated sleep visual
- [ ] Add at least one black-screen export mode
- [ ] Add at least one ambient animated background export mode
- [ ] Generate a thumbnail image sized for YouTube uploads
- [ ] Generate a metadata package: title, description, tags, pinned comment, and filename

## 3. Real YouTube Upload Path

- [ ] Decide the upload path: manual upload first or YouTube API integration
- [ ] If manual-first, add a one-click export bundle for upload assets
- [ ] If API-based, implement Google OAuth and YouTube upload flow
- [ ] Validate one private test upload on a real channel

## 4. First Channel Launch

- [ ] Decide the first channel identity and niche
- [ ] Create the first 3 video concepts
- [ ] Produce the first 1 publish-ready sleep video end to end
- [ ] Upload the first video as private or unlisted
- [ ] Review playback quality on desktop and mobile
- [ ] Publish the first public sleep upload

## 5. First Validation Loop

- [ ] Record the first 48-hour metrics: views, click-through rate, average view duration
- [ ] Compare thumbnail and title performance against at least one alternative
- [ ] Capture what to improve in the next batch: duration, visual style, title style, or noise preset

## Blocking Reality Check

If we are serious about publishing to real YouTube soon, the blocking items are:

1. render MP4, because YouTube needs a video file, not just WAV audio
2. package metadata and thumbnail cleanly
3. upload one private test video to a real channel

Everything else can follow after the first test upload.
