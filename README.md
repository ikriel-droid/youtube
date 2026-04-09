# LocalTube

LocalTube is a local-first video product sandbox that, on the `sleepmusic` branch, is being used as a sleep-channel production workflow.

## Stack

- Next.js App Router
- TypeScript
- Local JSON storage in `data/library.json`

## What It Does

- home feed with search, category, and tag filtering
- watch pages with MP4 or YouTube playback
- shorts feed
- watch-later and watch-history rails
- creator studio for upload, edit, delete, draft/published state, tags, and bulk import
- channel profile editing
- local AI helper for title, description, hook, thumbnail copy, category recommendation, and shorts script
- browser-based Sleep Lab for previewing ambient audio, exporting loop-stitched 30 to 60 minute WAV files, and mocking sleep-video visuals
- Sleep Lab can now save generated WAV tracks into LocalTube as persistent local audio posts under `public/generated-audio`

## Direction

See [PRODUCT_DIRECTION.md](c:\Users\Administrator\.vscode\cli\localtube\PRODUCT_DIRECTION.md).
If the immediate goal is a real sleep-music YouTube release, use:

- [YOUTUBE_SLEEP_GO_LIVE_CHECKLIST.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_SLEEP_GO_LIVE_CHECKLIST.md)
- [YOUTUBE_SCENIC_BATCH_CHECKLIST.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_SCENIC_BATCH_CHECKLIST.md)
- [YOUTUBE_48_HOUR_METRICS_TRACKER.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_48_HOUR_METRICS_TRACKER.md)
- [YOUTUBE_TITLE_THUMBNAIL_EXPERIMENT.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_TITLE_THUMBNAIL_EXPERIMENT.md)
- [YOUTUBE_NEXT_BATCH_PLAN.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_NEXT_BATCH_PLAN.md)
- [YOUTUBE_SCENIC_PACKAGING_GUIDE.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_SCENIC_PACKAGING_GUIDE.md)
- [YOUTUBE_SCENIC_REVIEW.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_SCENIC_REVIEW.md)
- [YOUTUBE_AUDIO_AND_DESIGN_CHECKLIST.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_AUDIO_AND_DESIGN_CHECKLIST.md)
- [YOUTUBE_SCENIC_VISUAL_GUIDE.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_SCENIC_VISUAL_GUIDE.md)
- [LICENSED_AUDIO_SOURCE_LOG.md](c:\Users\Administrator\.vscode\cli\localtube\LICENSED_AUDIO_SOURCE_LOG.md)
- [LICENSED_SCENIC_FOOTAGE_LOG.md](c:\Users\Administrator\.vscode\cli\localtube\LICENSED_SCENIC_FOOTAGE_LOG.md)
- [YOUTUBE_IMPORTED_AUDIO_REVIEW.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_IMPORTED_AUDIO_REVIEW.md)
- [YOUTUBE_IMPORTED_PUBLIC_CANDIDATE.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_IMPORTED_PUBLIC_CANDIDATE.md)
- [YOUTUBE_MOVING_SCENIC_CANDIDATE.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_MOVING_SCENIC_CANDIDATE.md)
- [YOUTUBE_NATURE_SERIES_PLAN.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_NATURE_SERIES_PLAN.md)
- [YOUTUBE_NATURE_SERIES_CHECKLIST.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_NATURE_SERIES_CHECKLIST.md)
- [YOUTUBE_RAIN_CANDIDATE.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_RAIN_CANDIDATE.md)
- [YOUTUBE_CREEK_CANDIDATE.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_CREEK_CANDIDATE.md)
- [YOUTUBE_FOREST_CANDIDATE.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_FOREST_CANDIDATE.md)

The current product decision is:

- creator-tool product, not just a clone sandbox
- primary audience on this branch: sleep / ambience channel operators
- best niche fit on this branch: repeatable YouTube sleep uploads
- sleep-music publishing path: validated real YouTube upload workflow
- next content direction: a 10-video natural-healing series with rain included in the core lineup

## Run

```powershell
cd c:\Users\Administrator\.vscode\cli\localtube
cmd /c npm install
cmd /c npm run dev
```

Open `http://127.0.0.1:3000`.

Sleep music generator:

- `http://127.0.0.1:3000/studio/sleep-lab`
- imported licensed audio can now be brought into Sleep Lab and reviewed at `http://127.0.0.1:3000/studio/audio-library`
- licensed scenic footage can now be brought into Sleep Lab and reviewed at `http://127.0.0.1:3000/studio/footage-library`
- if imported licensed audio exists, Sleep Lab now defaults to that scenic path instead of the generated-audio path
- if imported scenic footage exists, Sleep Lab now prefers that moving-footage path over the static scenic graphic path
- generate a track, then use `Save To LocalTube` if you want it to stay in the library after refresh
- saved sleep-audio posts can be revisited at `http://127.0.0.1:3000/studio/sleep-library`
- `Render YouTube Bundle` now creates a publishable MP4, thumbnail, and metadata manifest under `public/generated-video`, `public/generated-thumbnails`, and `public/generated-manifests`
- `Download Upload Bundle` packages the MP4, thumbnail, metadata JSON, and a plain-text upload checklist into one ZIP for manual YouTube upload
- `/studio/youtube` now prefers imported-audio scenic uploads first and keeps generated scenic uploads as the fallback path
- channel launch plan: [SLEEP_CHANNEL_LAUNCH_PLAN.md](c:\Users\Administrator\.vscode\cli\localtube\SLEEP_CHANNEL_LAUNCH_PLAN.md)
- API upload validation: [YOUTUBE_API_VALIDATION_RUNBOOK.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_API_VALIDATION_RUNBOOK.md)
- first public upload review: [YOUTUBE_FIRST_PUBLIC_REVIEW.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_FIRST_PUBLIC_REVIEW.md)
- current metrics tracking: [YOUTUBE_48_HOUR_METRICS_TRACKER.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_48_HOUR_METRICS_TRACKER.md)
- imported-audio scenic uploads now run a self-verification pass before YouTube upload:
  - render duration check
  - post-5-minute audio sample check
  - tail audio sample check
- reusable helper scripts:
  - `npm run import:remote-scenic -- --source-url ...` for licensed outdoor A/V imports
  - `npm run import:remote-scenic -- --local-file ...` for scenic files you already downloaded locally
  - `npm run upload:imported-scenic -- --audio-id ... --footage-id ... --title ...` for verified YouTube uploads

## YouTube API Validation Env

```powershell
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:LOCALTUBE_BASE_URL="http://127.0.0.1:3000"
```

If you want CTR and average view duration inside LocalTube, also enable `YouTube Analytics API` in Google Cloud and reconnect the channel so the token includes `yt-analytics.readonly`.

If `next dev` gets into a bad hot-reload state, use the clean starter:

```powershell
cd c:\Users\Administrator\.vscode\cli\localtube
powershell -ExecutionPolicy Bypass -File .\start-localtube.ps1
```

`start-localtube.ps1` now uses the more stable production-style runner so the app comes up reliably.

## Build

```powershell
cd c:\Users\Administrator\.vscode\cli\localtube
cmd /c npm run build
cmd /c npm run start
```

## Production Helper

```powershell
cd c:\Users\Administrator\.vscode\cli\localtube
powershell -ExecutionPolicy Bypass -File .\start-localtube-production.ps1
```

## Tests

```powershell
cd c:\Users\Administrator\.vscode\cli\localtube
cmd /c npm test
```

## Seed Reset

```powershell
cd c:\Users\Administrator\.vscode\cli\localtube
powershell -ExecutionPolicy Bypass -File .\reset-localtube-seed.ps1
```

This restores `data/library.json` from the curated seed in `data/library.seed.json`.

## Notes

- uploaded videos are stored in `data/library.json`
- duplicate video links are blocked
- drafts stay out of the public feed until you publish them
- the `sleepmusic` branch now has a validated real YouTube upload path
