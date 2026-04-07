# LocalTube Product Checklist

This checklist is the working plan for turning the current LocalTube MVP into a more complete creator product.

If the immediate goal is "publish sleep music to a real YouTube channel", use
[YOUTUBE_SLEEP_GO_LIVE_CHECKLIST.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_SLEEP_GO_LIVE_CHECKLIST.md)
first. This file is the broader product backlog.

## 1. Current MVP Baseline

- [x] Home feed with search and category filters
- [x] Watch page with playable videos
- [x] Channel page with per-channel listings
- [x] Local upload studio
- [x] Local comments
- [x] View and like tracking
- [x] Trending and most-liked sorting
- [x] Direct MP4 playback
- [x] YouTube URL embed playback
- [x] Local JSON persistence

## 2. Playback And Feed UX

- [x] Add dedicated Shorts vertical feed
- [x] Add autoplay next-video toggle
- [x] Add watch history strip on home
- [x] Add playlist or watch-later collection
- [x] Add video deletion from studio
- [x] Add video editing for title, description, category, and source URL

## 3. Creator Studio

- [x] Add thumbnail upload or thumbnail override URL
- [x] Add tags field and tag-based filtering
- [x] Add draft vs published state
- [x] Add channel profile editing
- [x] Add bulk import for seeded or external video links
- [x] Add duplicate-link detection on upload

## 4. AI Features

- [x] AI title generator
- [x] AI description generator
- [x] AI hook and thumbnail-copy generator
- [x] AI Shorts script generator
- [x] AI category recommendation on upload
- [x] AI related-video ranking instead of simple heuristics

## 5. Reliability And Dev UX

- [x] Stabilize dev startup so hot-reload cache issues happen less often
- [x] Add clearer API error messages across upload, comments, and engagement
- [x] Add API route tests for upload, comments, and engagement
- [x] Add a seed reset script for `data/library.json`
- [x] Add production start helper script
- [x] Add basic logging for upload and engagement actions

## 6. Product Direction

- [x] Decide whether LocalTube is a YouTube clone sandbox or a creator-tool product
- [x] Pick one primary audience: creators, sports channels, finance channels, or AI tutorial channels
- [x] Shape the first paid or portfolio-worthy use case around that audience
- [x] Add sample channels and content around the chosen niche

## 7. Immediate Next Steps

- [x] Build Shorts feed
- [x] Add edit/delete in studio
- [x] Add thumbnail override support
- [x] Add AI title and description helper

## 8. Sleep Content Tools

- [x] Add a local sleep-audio generator with preview and WAV export
- [x] Add longer loop stitching for 30 to 60 minute sleep tracks
- [x] Add basic background visual or visualizer support for sleep uploads
- [x] Add sleep-channel-specific packaging templates
- [x] Save generated sleep tracks into LocalTube so they survive refresh and restart

## 9. Nature Healing Series

- [x] Lock a 10-theme natural-healing lineup
- [x] Add the 10 concepts into the launch plan UI
- [x] Include rain as a core theme instead of treating it as a side format
- [ ] Import licensed audio for each of the 10 themes
- [ ] Import licensed footage for each of the 10 themes
- [ ] Produce the first full 10-video nature batch
