# Nano Banana 2 (Google, via kie.ai)

Everyday images. Cheap, fast, strong with reference images. The default image model. Confirmed from docs.kie.ai/market/google/nanobanana2.

| Field | Value |
|---|---|
| Model ID | nano-banana-2 |
| Provider | kie.ai |
| Method | Async (submit, then poll) |
| Type | Image |
| API key | .env -> KIE_API_KEY |
| Docs | https://docs.kie.ai/market/google/nanobanana2 |
| Cost | about $0.04 per 1K image (verify on kie pricing) |

## Endpoint

POST https://api.kie.ai/api/v1/jobs/createTask

## Auth

Authorization: Bearer {KIE_API_KEY}

## Request body

```json
{
  "model": "nano-banana-2",
  "input": {
    "prompt": "your detailed image prompt",
    "image_input": [],
    "aspect_ratio": "9:16",
    "resolution": "1K",
    "output_format": "png"
  }
}
```

- aspect_ratio: use "9:16" for vertical social. "auto" lets the model choose.
- resolution: "1K" for drafts, "2K" for a final.
- image_input: array of reference image URLs (a product shot, a logo, a style ref). Leave empty for pure text-to-image.

## Response handling

- Success returns `code: 200` with `data.taskId`.
- Poll the unified query endpoint (Get Task Details) with the taskId until status is complete, then read the result image URL. Poll every 10 to 15 seconds.
- The query endpoint is `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}`.
- Save the returned image locally, and keep the returned hosted URL, because the animate step needs a public image URL.

## Notes

- Max reference image 10MB.
- Model ids change when providers ship new versions. If a call returns model not found, open the docs page and copy the id fresh.
