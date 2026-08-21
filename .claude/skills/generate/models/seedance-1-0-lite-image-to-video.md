# Seedance 1.0 Lite Image-to-Video (ByteDance, via kie.ai) — BUDGET OPTION

The cheapest publishable video route. Same schema as 1.0 Pro, lower cost, lighter motion quality. Verified against docs.kie.ai/market/bytedance/v1-lite-image-to-video (2026-08-15).

| Field | Value |
|---|---|
| Model ID | `bytedance/v1-lite-image-to-video` |
| Provider | kie.ai |
| Method | Async (submit, then poll) |
| Type | Video (image-to-video) |
| API key | .env -> KIE_API_KEY |
| Cost | 1080p: 10 credits/sec. 5s = 50 credits (~$0.25), 10s = 100 credits (~$0.50) |

## Endpoint

POST https://api.kie.ai/api/v1/jobs/createTask  ·  Auth: `Authorization: Bearer {KIE_API_KEY}`

## Request body (VERIFIED — same field names as 1.0 Pro)

```json
{
  "model": "bytedance/v1-lite-image-to-video",
  "input": {
    "prompt": "short motion prompt, subtle steady motion, keep the screen readable, no added text",
    "image_url": "https://durable-host/the-approved-still.jpg",
    "resolution": "1080p",
    "duration": "5",
    "camera_fixed": false
  }
}
```

- **`image_url`** (single string). NO `aspect_ratio` field — orientation derives from the still (feed 9:16 → 1080x1920).
- **`resolution`**: `"1080p"` only here (floor).
- **`duration`**: STRING, `"5"` or `"10"` only. No 8-second option. **Default 10.** Round other values to 5 or 10 (>=7.5 -> 10, else 5) and say what you did — do not fail.
- Optional: `camera_fixed` (default false), `seed`.

## Hosting + response handling

Identical to 1.0 Pro: host a durable JPEG (Blotato presigned, host-only), poll `recordInfo`, read `resultJson.resultUrls[0]` and `creditsConsumed`. kie bills only on success.
