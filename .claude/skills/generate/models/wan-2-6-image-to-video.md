# Wan 2.6 Image-to-Video (via kie.ai)

Fallback video model. Confirmed request shape from docs.kie.ai/market/wan/2-6-image-to-video. Use when Seedance is unavailable or you want a different look.

| Field | Value |
|---|---|
| Model ID | wan/2-6-image-to-video |
| Provider | kie.ai |
| Method | Async (submit, then poll) |
| Type | Video (image-to-video) |
| API key | .env -> KIE_API_KEY |
| Docs | https://docs.kie.ai/market/wan/2-6-image-to-video |
| Cost | verify on kie pricing (per second) |

## Endpoint

POST https://api.kie.ai/api/v1/jobs/createTask

## Auth

Authorization: Bearer {KIE_API_KEY}

## Request body (confirmed)

```json
{
  "model": "wan/2-6-image-to-video",
  "input": {
    "prompt": "short motion prompt",
    "image_urls": ["https://the-hosted-still.png"],
    "duration": "5",
    "resolution": "1080p",
    "multi_shots": false,
    "nsfw_checker": false
  }
}
```

- image_urls: single image, JPEG, PNG, or WebP, max 10MB.
- duration: seconds as a string.
- resolution: "1080p" available. Lower to reduce cost.

## Cost gate (required)

Same rule as the default video model. Compute credits_per_second x duration, quote it, wait for the go.

## Response handling

- Success returns `code: 200` with `data.taskId` (for example task_wan_...).
- Poll the unified query endpoint (Get Task Details) with the taskId until complete, then download the result video immediately.
- The query endpoint is `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}`.
