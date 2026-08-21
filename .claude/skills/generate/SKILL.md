---
name: generate
description: Generate faceless video content cheaply and consistently. Draft a still on a cheap model, run a pre-animate quality check, then animate the approved still through kie.ai, always routing to the lowest cost model. Enforces a running spend cap with a cost ledger, applies reusable style and character presets so a whole channel stays consistent, and outputs a publish-ready clip that hands off to Blotato for scheduling. Triggers on /generate, generate image, generate video, make a POV clip, animate this.
allowed-tools: Read, Write, Edit, Bash, Glob
---

# /generate

Make faceless video content for pennies, keep a channel visually consistent, and never blow the budget. Draft a cheap still, check it before you spend on animation, then animate only the still you approve. Output lands publish-ready.

Built for vertical social video (9:16), with a running budget ceiling, reusable presets, and a quality gate plus a Blotato publish hand-off.

## Models

| Task | Default model | Provider | Recipe |
|---|---|---|---|
| Image (default) | nano-banana-2 | kie.ai | models/nano-banana-2.md |
| Image (text or UI in frame) | gpt-image-2-text-to-image | kie.ai | models/gpt-image-2.md |
| Video (DEFAULT) | Seedance 1.0 Pro `bytedance/v1-pro-image-to-video` | kie.ai | models/seedance-1-0-pro-image-to-video.md |
| Video (budget) | Seedance 1.0 Lite `bytedance/v1-lite-image-to-video` | kie.ai | models/seedance-1-0-lite-image-to-video.md |
| Video (newest, EXPLICIT ONLY) | Seedance 2.5 `bytedance/seedance-2-5` | kie.ai | models/seedance-2-5-image-to-video.md |

Read the recipe file before every generation. Use gpt-image-2-text-to-image whenever the frame has readable text, a sign, a poster, or an app UI mockup. Use nano-banana-2 for everything else.

**Video model routing.** Default every standard short vertical clip to **Seedance 1.0 Pro**. Use **Seedance 1.0 Lite** as the budget option. Use **Seedance 2.5 only** when I explicitly ask for it.

**Duration.** Seedance 1.0 accepts **5 or 10 second clips only** — there is no 8-second option. **Default to 10 seconds.** If any other value is requested, **round to 5 or 10 and tell me what you did** (do not fail silently, do not stop).

**Aspect ratio / dimensions.** The clip inherits the input still's exact dimensions. So **the still IS the aspect ratio and the resolution**: generate the still at **1080x1920** (9:16). If the still isn't 1080x1920 the clip won't be either. Seedance 1.0 has no aspect ratio parameter. Do not send one.

**Resolution floor: 1080p. This is hard.** Default vertical output is **1080x1920**. Lower resolutions are not offered — do not quote them or fall back to them to save credits. A sub-1080p clip is unpublishable on TikTok (min 540x960) / Instagram Reels, so it is wasted money, not a saving. If a request cannot be served at 1080p, STOP and say so rather than dropping resolution.

## Provider routing

1. Default to the LOWEST COST provider that runs the model well. kie.ai first.
2. If the cheapest route lacks the model, fails auth, or errors, fall back to fal.ai, then WaveSpeed AI.
3. Never hide a provider swap. Say which route ran and why.

## Presets (channel consistency)

A preset is a saved style so every clip in a series looks like it came from the same channel. Presets live in `presets/`, one markdown file each. A preset holds:
- a locked prompt fragment (the character, the look, the era),
- the aspect ratio and resolution,
- pinned reference images in `generations/refs/` (a character sheet, your app logo, a watermark).

Invoke with a preset: "/generate using the pov preset: you wake up as a Roman senator." Load the preset, merge its locked fragment and its refs into the prompt, and never drift from them across the series.

Ship with these starters (edit them to your channel):
- `presets/pov.md` the POV wake-up format.
- `presets/app-watermark.md` pins your product logo as a reference so it rides on every frame.
- `presets/brand-style.md` your channel look, colours, grade, aspect ratio.

## The workflow

1. Load preset (if named). Merge its locked fragment, aspect ratio, and refs.
2. Draft the still (cheap). nano-banana-2, or gpt-image-2-text-to-image if the frame has text or a UI. Save the file and its prompt. Show me the still. Do not animate yet.
3. Pre-animate QA gate (see below). If any check fails, stop and report. Do not spend on video.
4. Budget gate (see below). Quote the credits, the dollars, and the remaining session budget. Wait for my explicit go.
5. Animate the approved still. Poll, download the mp4, write the log line with the real cost, append to the ledger.
6. Publish-ready hand-off (see below).

## Budget and ledger (never blow the spend)

Keep a running ledger at `generations/ledger.json`. Every generation appends one line: timestamp, model, type, cost_credits, cost_usd, description.

Two caps, editable here:
- SESSION_CAP: $10 per run of work.
- MONTHLY_CAP: $50 per calendar month.

Before ANY paid generation:
1. Sum the ledger for this session and this month.
2. If this run would cross a cap, STOP and tell me how far over, do not generate.
3. Otherwise, quote it like this: "This clip is 140 credits, about $0.70. Spent this session $4.10, remaining $5.90 of the $10 cap. Go?"

One approval equals one run. Never batch paid videos past the cap without a fresh go.

## Pre-animate QA gate (stop wasting video spend)

Video is the expensive lane, so check the still BEFORE animating. These are the real failure modes (wrong ratio gives black bars, drift breaks the illusion):
- Aspect ratio is vertical 9:16.
- Still dimensions are exactly 1080 x 1920 (the clip inherits them).
- No text baked into the image, unless it was made on gpt-image-2-text-to-image on purpose.
- Subject and point of view match the concept and the preset. First person stays first person.
- Requested duration fits the platform (TikTok, Reels, Shorts all take 5 or 10 seconds comfortably).

If any check fails, stop, say which one, and offer to re-draft the still (cheap) rather than animate a broken frame.

## Publish-ready hand-off (close the loop to Blotato)

After the mp4 is saved, write a publish sidecar next to it, `{basename}.publish.json`:

```json
{
  "video": "the mp4 path",
  "hook_overlay": "POV: You Wake Up as a Roman Senator",
  "caption": "",
  "hashtags": ["#pov", "#ai"],
  "platforms": ["tiktok", "instagram", "youtube"],
  "aspect": "9:16",
  "duration": 10
}
```

Then hand off to publishing:
- If the Blotato MCP tools are available in this agent, offer to schedule through Blotato. Confirm the target account is warmed up first (see the warmup playbook). Blotato handles per-platform formatting and scheduling. Blotato is publishing only, it does not generate.
- If Blotato is not connected, tell me the publish-ready file path and the sidecar so I can upload it, and remind me I can add Blotato with `claude mcp add`.

## Rules

- Enforce the budget gate and the QA gate before any paid video. No exceptions.
- Draft on a cheap image model first. Only animate a still I approved.
- Never describe a logo, face, or product UI in words. Pass the real file as a reference (Seedance 1.0 takes image_url as a single string), or via a preset. If it is missing, stop and ask.
- Run generations one at a time. kie.ai allows 20 new requests per 10 seconds, so serialize and poll patiently.
- Save every output FLAT into the generations folder ($GENERATIONS_DIR, default ~/faceless/generations). No subfolders. Refs live in that folder's refs/ subfolder. Presets live in the skill's presets/ folder.
- Naming: {project}_{description}_{timestamp}.{ext}
- After every save, write the sidecar log AND append to the ledger.
- Default video resolution is 1080p vertical, 1080 x 1920.

## Cost reference (verify at run, prices move)

1 credit = half a cent. $5 buys 1,000 credits.

- Still on GPT Image: 10 credits (~$0.05).
- **Seedance 1.0 Pro (DEFAULT), 1080p: 14 credits/sec.** 5s = 70 credits (~$0.35), 10s = 140 credits (~$0.70).
- **Seedance 1.0 Lite (budget), 1080p: 10 credits/sec.** 5s = 50 credits (~$0.25), 10s = 100 credits (~$0.50).
- **Finished 10s 1080p Pro clip = still + video = 10 + 140 = 150 credits (~$0.75).** Lite = 10 + 100 = 110 credits (~$0.55).
- Seedance 2.5 (explicit only): quote Seedance 2.5 from kie's live 1080p rate at request time.
- kie.ai credits do not expire.

## Logging

After every save, write a JSON file next to the media, same basename, .json extension, and append the same cost to `generations/ledger.json`:

```json
{
  "model": "the model id used",
  "prompt": "the full prompt sent",
  "preset": "pov",
  "refs": ["refs/app-logo.png"],
  "params": { "aspect_ratio": "9:16", "resolution": "1080p", "duration": 10 },
  "cost_credits": 140,
  "cost_usd": 0.70,
  "created": "set at runtime"
}
```

## What NOT to do

- Do not animate before the QA gate and the budget gate both pass.
- Do not cross the session or monthly cap without a fresh explicit go.
- Do not animate a still I have not approved.
- Do not drift from the preset. Same character, same look, across the series.
- Do not change the point of view between the still and the clip.
- Do not log success without the output path, the real cost, and the ledger append.
