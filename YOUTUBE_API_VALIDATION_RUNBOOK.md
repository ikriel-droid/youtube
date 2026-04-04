# YouTube API Validation Runbook

Use this when validating the Google OAuth and direct private-upload flow against a real YouTube channel.

## Required Environment Variables

Set these in your shell before starting LocalTube:

```powershell
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:LOCALTUBE_BASE_URL="http://127.0.0.1:3000"
```

Optional:

```powershell
$env:YOUTUBE_OAUTH_REDIRECT_URI="http://127.0.0.1:3000/api/youtube/oauth/callback"
```

## Google Cloud Setup

1. Create or select a Google Cloud project.
2. Enable `YouTube Data API v3`.
3. Create an OAuth client for a web application.
4. Add the LocalTube callback URL:

```text
http://127.0.0.1:3000/api/youtube/oauth/callback
```

## Validation Steps

1. Start LocalTube.
2. Open `/studio/youtube`.
3. Click `Connect YouTube`.
4. Complete Google consent.
5. Return to LocalTube and confirm the channel is connected.
6. Click `Upload Launch-01 As Private`.
7. Open the returned YouTube watch link.
8. Open the returned YouTube Studio link.

## Success Criteria

- OAuth completes without error
- a private video is created on the real channel
- the video has the generated title, description, tags, and thumbnail
- the video plays correctly on YouTube

## Notes

- the current API flow uploads `launch-01` as `private`
- manual-first upload is still the preferred default release path
- this API path exists to validate direct upload feasibility before deciding whether to keep it
