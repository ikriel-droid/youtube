# YouTube Audio And Design Checklist

This checklist tracks the next quality layer after the upload pipeline is already working.

The focus here is:

- better real audio sources
- better scenic video design
- less reliance on synthetic placeholder audio

## 1. External Audio Quality

- [x] Add a licensed-audio import route
- [x] Add an imported-audio library page
- [x] Let Sleep Lab render scenic bundles from imported audio assets
- [x] Import the first real licensed sleep-audio source
- [x] Render the first scenic bundle from imported audio instead of generated audio

Reference:

- [LICENSED_AUDIO_SOURCE_LOG.md](c:\Users\Administrator\.vscode\cli\localtube\LICENSED_AUDIO_SOURCE_LOG.md)

## 2. Scenic Visual Design

- [x] Create a scenic visual guide for ocean, rain-window, and future night-sky variants
- [x] Reduce text density on scenic thumbnails
- [x] Define a cleaner first-frame design for scenic uploads
- [x] Decide whether scenic uploads should keep title text on video frames or only on thumbnails

Current design call:

- scenic uploads keep a light headline on the video frame
- thumbnails carry the stronger packaging signal
- black-screen remains the only format allowed to stay more utility-text-forward

## 3. Quality Lock Before More Uploads

- [x] Produce one imported-audio scenic upload end to end
- [x] Review whether the imported audio meaningfully improves perceived quality
- [x] Update LocalTube defaults if imported audio becomes the standard path

Current locked decision:

- imported licensed audio is now the standard path for publish-ready scenic uploads
- generated audio remains the ideation and fallback path
- first imported-audio scenic upload completed privately as `LK_6_Quqffo`

Reference:

- [YOUTUBE_IMPORTED_AUDIO_REVIEW.md](c:\Users\Administrator\.vscode\cli\localtube\YOUTUBE_IMPORTED_AUDIO_REVIEW.md)
