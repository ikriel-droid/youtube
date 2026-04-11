# Licensed Scenic Footage Log

This log tracks real scenic footage sources that we are allowed to use in the `sleepmusic` branch.

## 1. Sgwd Gwladus Waterfall Motion

- Imported on: `2026-04-05`
- LocalTube footage record id: `footage-1775397592131-704`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/sgwd-gwladus-waterfall-motion-1775397592032.webm`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:Sgwd_Gwladus_2014-07-30.webm`
- Direct media URL:
  - `https://upload.wikimedia.org/wikipedia/commons/4/41/Sgwd_Gwladus_2014-07-30.webm`
- Creator:
  - `Prolineserver`
- License:
  - `CC BY-SA 3.0`
- License note used in LocalTube:
  - `CC BY-SA 3.0 waterfall clip from Wikimedia Commons.`
- Visual fit:
  - waterfall ambience
  - nature sleep videos
  - ocean-adjacent water ambience when we want visible motion instead of static scenic art

## Current Call

- Real moving scenic footage is now preferred over static scenic graphics when we have a licensed clip that matches the audio theme.
- Static scenic graphics stay in the product as the fallback path.
- This source page is now also the basis of the verified 1-hour waterfall public upload:
  `https://www.youtube.com/watch?v=wc_OhY9jmOk`

## 2. Rain Clip Motion

- Imported on: `2026-04-08`
- LocalTube footage record id: `footage-1775655812932-rain`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/rain-clip-cc0-1775655812932.ogv`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:Rain_clip.theora.ogv`
- Import URL used:
  - `https://commons.wikimedia.org/wiki/Special:Redirect/file/Rain%20clip.theora.ogv`
- Creator:
  - `PB`
- License:
  - `CC0 1.0`
- License note used in LocalTube:
  - `CC0 1.0 rain clip from Wikimedia Commons.`
- Visual fit:
  - rain ambience
  - gentle healing uploads
  - window-rain and outdoor-rain themed sleep videos

## 3. Lost Lake Forest Rain Motion

- Imported on: `2026-04-08`
- LocalTube footage record id: `footage-1775659573420-682`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/lost-lake-forest-rain-motion-1775659572611.webm`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:Lost_Lake_(33586039086).webm`
- Import URL used:
  - `https://commons.wikimedia.org/wiki/Special:Redirect/file/Lost%20Lake%20%2833586039086%29.webm`
- Creator:
  - `BLM Oregon & Washington / Greg Shine`
- License:
  - `Public domain in the United States`
  - also mirrored on Wikimedia Commons with `CC BY 2.0` attribution context
- License note used in LocalTube:
  - `Public domain in the United States as a U.S. Bureau of Land Management work; also mirrored on Wikimedia Commons with CC BY 2.0 attribution context.`
- Visual fit:
  - natural outdoor rain
  - forest and lakeside healing uploads
  - calmer environmental rain than the earlier generic rain clip

## 4. South Fork Creek Valley Motion

- Imported on: `2026-04-09`
- LocalTube footage record id: `footage-1775661819489-234`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/south-fork-creek-valley-motion-1775661819099.webm`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:South_Fork_Clackamas_Wild_and_Scenic_River_(28287735390).webm`
- Import source:
  - local scenic file downloaded from Wikimedia Commons and then imported into LocalTube
- Creator:
  - `BLM Oregon & Washington`
- License:
  - `Public domain in the United States`
  - also mirrored on Wikimedia Commons with `CC BY 2.0` attribution context
- License note used in LocalTube:
  - `Public domain in the United States as a U.S. Bureau of Land Management work; also mirrored on Wikimedia Commons with CC BY 2.0 attribution context.`
- Visual fit:
  - valley stream
  - forest gorge creek
  - wider scenic creek uploads where we want visible depth instead of a close pebble-water macro

## 5. Foggy Forest Motion

- Imported on: `2026-04-09`
- LocalTube footage record id: `footage-1775741289778-589`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/foggy-forest-motion-1775741289679.webm`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:Foggy_day_of_hyrcanian_forest_of_iran.webm`
- Import source:
  - local scenic file downloaded from Wikimedia Commons and then imported into LocalTube
- Creator:
  - `Reza Rafizadeh`
- License:
  - `CC BY 3.0`
- License note used in LocalTube:
  - `CC BY 3.0 forest footage from Wikimedia Commons (Attribution: Reza Rafizadeh).`
- Visual fit:
  - foggy forest
  - calm tree-line motion
  - birdsong-led forest ambience uploads

## Important Note

- The Commons page currently carries a `license review needed` notice for the video.
- We trimmed the usable section to start after `45s` so the rendered upload avoids the earlier person-visible section.
- For a stricter long-term release policy, this forest footage should eventually be replaced with a forest clip that has a fully settled Commons review status.

## 6. Sunny Day Ocean Shore Motion

- Imported on: `2026-04-09`
- LocalTube footage record id: `footage-1775743470128-79`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/sunny-day-ocean-shore-motion-1775743467908.webm`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:Sunny_waves_at_Cattle_Point_(40789227201).webm`
- Import source:
  - local scenic file downloaded from Wikimedia Commons and then imported into LocalTube
- Creator:
  - `BLM Oregon & Washington / Nick Teague`
- License:
  - `Public domain in the United States`
  - also mirrored on Wikimedia Commons with `CC BY 2.0` attribution context
- License note used in LocalTube:
  - `Public domain in the United States as a U.S. Bureau of Land Management work; also mirrored on Wikimedia Commons with CC BY 2.0 attribution context.`
- Visual fit:
  - bright daytime ocean
  - shoreline wave motion
  - sunlit coastal healing uploads

## Day Ocean Verification Note

- frame checks at source `2.2s` vs rendered `1s` and source `4.2s` vs rendered `3s` stayed extremely close
  - `16x16 grayscale mean absolute difference: 0.75`
  - `16x16 grayscale mean absolute difference: 0.63`
- that confirms the rendered upload is using the intended sunny shoreline footage rather than falling back to an unrelated scenic background

## 7. Steens Mountain Wind Motion

- Imported on: `2026-04-11`
- LocalTube footage record id: `footage-1775886683511-795`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/steens-mountain-wind-motion-1775886682801.webm`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:Steens_Mountain,_East_Side_(33056947434).webm`
- Import source:
  - local scenic file downloaded from Wikimedia Commons and then imported into LocalTube
- Creator:
  - `BLM Oregon & Washington / Greg Shine`
- License:
  - `Public domain in the United States`
  - page also carries mirrored `CC BY 2.0` and `Flickr review needed` context
- License note used in LocalTube:
  - `Public domain in the United States as a U.S. Bureau of Land Management work; also mirrored on Wikimedia Commons with CC BY 2.0 attribution context.`
- Visual fit:
  - mountain ridge
  - dry highland valley
  - open-sky mountain wind ambience

## Mountain Verification Note

- frame checks at source `2.2s` vs rendered `1s` and source `6.2s` vs rendered `5s` stayed close
  - `16x16 grayscale mean absolute difference: 1.43`
  - `16x16 grayscale mean absolute difference: 1.54`
- manual frame review confirmed the rendered upload keeps the same trail-edge slope, ridge line, and open blue-sky mountain scene
- the Commons page includes `Flickr review needed`, so this source is usable for the current branch but should eventually be replaced with a cleaner long-term mountain clip if we want stricter release hygiene

## 8. Night Sea Shore Motion

- Imported on: `2026-04-11`
- LocalTube footage record id: `footage-1775896119426-608`
- LocalTube asset URL:
  - `http://127.0.0.1:3000/api/generated-assets/imported-footage/night-sea-shore-motion-1775896117340.webm`
- Source page:
  - `https://commons.wikimedia.org/wiki/File:McAbee_Beach_1_2024-01-11.webm`
- Import source:
  - local scenic file downloaded from Wikimedia Commons and then imported into LocalTube
- Creator:
  - `Wikimedia Commons contributor`
- License:
  - `Needs follow-up on the exact file page before long-term catalog use`
- License note used in LocalTube:
  - `Wikimedia Commons night beach footage; verify source-page attribution before long-term catalog use.`
- Visual fit:
  - night sea
  - dark shoreline
  - low-light coastal ambience

## Night Sea Verification Note

- frame checks at source `2.2s` vs rendered `1s` and source `6.2s` vs rendered `5s` stayed reasonably close for a very dark clip
  - `16x16 grayscale mean absolute difference: 5.9`
  - `16x16 grayscale mean absolute difference: 5.39`
- watch page returned `200`
- manual frame review confirmed the rendered upload keeps the same dark shoreline, sea horizon, and distant coastal lights as the source clip
- this footage works for the current branch, but we should replace it later with a night-sea clip that has cleaner attribution metadata and less visible shoreline lighting
