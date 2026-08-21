# Seedance 2.5 Image-to-Video (ByteDance, via kie.ai) — EXPLICIT USE ONLY

NOT the default. Use only when you explicitly ask for Seedance 2.5. The default video model is Seedance 1.0 Pro (models/seedance-1-0-pro-image-to-video.md).

| Field | Value |
|---|---|
| Model ID | bytedance/seedance-2-5 |
| Provider | kie.ai |
| Method | Async (submit, then poll) |
| Type | Video (image-to-video) |
| API key | .env -> KIE_API_KEY |
| Docs | https://docs.kie.ai (Models Market, ByteDance Seedance) |
| Cost | Quote Seedance 2.5 from kie's live 1080p rate at request time. |

## Endpoint

POST https://api.kie.ai/api/v1/jobs/createTask

## Auth

Authorization: Bearer {KIE_API_KEY}

## Request body (VERIFIED 2026-08-12)

```json
{
  "model": "bytedance/seedance-2-5",
  "input": {
    "prompt": "short motion prompt: slow push in, subtle parallax, no text",
    "first_frame_url": "https://durable-host/the-approved-still.jpg",
    "aspect_ratio": "adaptive",
    "resolution": "1080p",
    "duration": 8
  }
}
```

- **first_frame_url** (NOT `image_urls`): a single public image URL, the approved still. First-frame tasks read the orientation FROM this image.
- **aspect_ratio** MUST be `"adaptive"` for first-frame/first-last-frame tasks. Passing `"9:16"` returns `422: only support adaptive aspect ratio`. A 9:16 still therefore yields a 9:16 clip via adaptive.
- **duration**: seconds, as a NUMBER (`8`), not a string.
- **resolution**: send `"1080p"` (skill floor). The API also accepts 480p and 720p; this skill does not use them.

### Hosting the still (important)

Do NOT pass the temporary `tempfile.aiquickdraw.com` PNG link from the draft step — kie.ai re-hosts it and it can come back as an unsupported format (`400: Input material format is unsupported`). Instead host a durable **JPEG**: convert with `sips -s format jpeg`, upload via Blotato's presigned URL (image host only, not publishing), and pass that `publicUrl` as `first_frame_url`.

## Check remaining credits (no spend)

`GET https://api.kie.ai/api/v1/chat/credit` with the Bearer key returns `{"data": <credits>}`. Use `balance.sh`, or the pre-flight gate in `animate.sh` which refuses to submit if the balance is below the clip cost.

## Cost gate (required)

Before submitting, compute and quote:
- credits = credits_per_second x duration, at kie's live 1080p rate (verify at request time).
- dollars at $5 per 1,000 credits.
Wait for explicit approval. One approval equals one run.

## Response handling

- Success returns `code: 200` with `data.taskId`.
- Poll `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}` every 15 seconds. Read `data.state` (`waiting`/`success`/`fail`); on success parse `data.resultJson` for `resultUrls[0]`.
- On `state: fail`, read `data.failMsg` (e.g. unsupported material) — the job cost 0 credits, so fix and resubmit.
- Result URLs can expire in hours. Download the mp4 immediately into the generations folder, then write the log.

## Notes

- Keep the point of view identical to the still. Do not let the camera swing to a third person shot.
- If Seedance is unavailable or errors, fall back to models/wan-2-6-image-to-video.md.
