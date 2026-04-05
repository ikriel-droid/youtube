# Moving Scenic Candidate

This document tracks the first publish-ready sleep render that uses both:

- imported licensed audio
- imported licensed moving scenic footage

## Candidate Source Stack

- Audio source:
  - `Faroe Ocean Drift Ambient Sleep`
  - log: [LICENSED_AUDIO_SOURCE_LOG.md](c:\Users\Administrator\.vscode\cli\localtube\LICENSED_AUDIO_SOURCE_LOG.md)
- Scenic footage source:
  - `Sgwd Gwladus Waterfall Motion`
  - log: [LICENSED_SCENIC_FOOTAGE_LOG.md](c:\Users\Administrator\.vscode\cli\localtube\LICENSED_SCENIC_FOOTAGE_LOG.md)

## Candidate Packaging

- Title:
  - `Waterfall Ambient Sleep | 30 Minutes Cascading Nature Drift`
- Release preset:
  - `ocean-drift`
- Channel:
  - `Midnight Tide Sleep`
- Visual mode:
  - imported moving footage

## Final Render Verification

- Verified on `2026-04-05`
- MP4:
  - `http://127.0.0.1:3000/api/generated-assets/generated-video/midnight-tide-sleep-waterfall-ambient-sleep-30-minutes-cascading-nature-drift-oc.mp4`
- Thumbnail SVG:
  - `http://127.0.0.1:3000/api/generated-assets/generated-thumbnails/midnight-tide-sleep-waterfall-ambient-sleep-30-minutes-cascading-nature-drift-oc.svg`
- Manifest:
  - `http://127.0.0.1:3000/api/generated-assets/generated-manifests/midnight-tide-sleep-waterfall-ambient-sleep-30-minutes-cascading-nature-drift-oc.json`

Verified results:

- moving waterfall footage is visible in the rendered MP4
- imported audio remains the sound bed
- the bundle is ready to use as the next motion-first upload candidate

## Current Call

- Motion-first scenic uploads are now the quality target.
- Static scenic designs are acceptable for fallback, but they are no longer the ideal public-facing default when licensed footage is available.
