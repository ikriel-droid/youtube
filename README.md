# LocalTube

LocalTube is a local-first video product sandbox that now leans toward a creator-tool workflow for sports channels.

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
If the immediate goal is a real sleep-music YouTube release, use
[YOUTUBE_SLEEP_GO_LIVE_CHECKLIST.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_SLEEP_GO_LIVE_CHECKLIST.md).

The current product decision is:

- creator-tool product, not just a clone sandbox
- primary audience: sports channels
- best niche fit: football and baseball creators testing packaging ideas before real upload flows
- sleep-music publishing path: manual-first YouTube upload for the first real launch validation

## Run

```powershell
cd c:\Users\Administrator\.vscode\cli\localtube
cmd /c npm install
cmd /c npm run dev
```

Open `http://127.0.0.1:3000`.

Sleep music generator:

- `http://127.0.0.1:3000/studio/sleep-lab`
- generate a track, then use `Save To LocalTube` if you want it to stay in the library after refresh
- saved sleep-audio posts can be revisited at `http://127.0.0.1:3000/studio/sleep-library`
- `Render YouTube Bundle` now creates a publishable MP4, thumbnail, and metadata manifest under `public/generated-video`, `public/generated-thumbnails`, and `public/generated-manifests`
- `Download Upload Bundle` packages the MP4, thumbnail, metadata JSON, and a plain-text upload checklist into one ZIP for manual YouTube upload
- channel launch plan: [SLEEP_CHANNEL_LAUNCH_PLAN.md](c:\Users\Administrator\.vscode\cli\localtube\SLEEP_CHANNEL_LAUNCH_PLAN.md)
- API upload validation: [YOUTUBE_API_VALIDATION_RUNBOOK.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_API_VALIDATION_RUNBOOK.md)

## YouTube API Validation Env

```powershell
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:LOCALTUBE_BASE_URL="http://127.0.0.1:3000"
```

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
- this is still local-only and does not upload to real YouTube yet
