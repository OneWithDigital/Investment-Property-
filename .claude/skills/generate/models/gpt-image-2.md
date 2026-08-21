# GPT Image 2 (OpenAI, via kie.ai)

Use this ONLY when the frame has readable text, a sign, a poster, packaging, or an app UI mockup. It is the strongest model at text inside an image, which is exactly the case when a faceless video markets an app.

| Field | Value |
|---|---|
| Model ID | gpt-image-2-text-to-image |
| Provider | kie.ai |
| Method | Async (submit, then poll) |
| Type | Image |
| API key | .env -> KIE_API_KEY |
| Docs | https://docs.kie.ai (Models Market, GPT Image) |
| Cost | about $0.05 per image at medium (verify on kie pricing) |

## Endpoint

POST https://api.kie.ai/api/v1/jobs/createTask

## Auth

Authorization: Bearer {KIE_API_KEY}

## Request body

```json
{
  "model": "gpt-image-2-text-to-image",
  "input": {
    "prompt": "your prompt, include the exact on-screen text in quotes",
    "aspect_ratio": "9:16",
    "resolution": "2K"
  }
}
```

- Input fields are `prompt`, `aspect_ratio` (use `9:16`), and `resolution` (`1K`, `2K`, or `4K`). Use `2K` so on-screen text stays crisp.
- Put any on-screen copy in quotes inside the prompt so it renders exactly.

## Response handling

- Success returns `code: 200` with `data.taskId`. Poll `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}` every 12s; on `data.state: success` parse `data.resultJson.resultUrls[0]`. Save the image and keep its hosted URL for the animate step.
