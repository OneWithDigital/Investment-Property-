# /generate skill (faceless video, image then animate)

A Claude skill that makes faceless video content cheaply: draft a still on a cheap image model, then animate the one you approve through kie.ai. Quotes the cost before any paid video, enforces a 1080p publishable floor, and files every output plus its prompt in one flat folder.

## Install

1. Drop the `generate/` folder into `.claude/skills/` in your Claude Code workspace.
2. Copy `.env.example` to `.env` and paste your kie.ai key (from kie.ai/api-key). fal.ai and WaveSpeed keys are optional fallbacks. Optionally set `GENERATIONS_DIR`; it defaults to `~/faceless/generations`.
3. Start Claude Code and type `/generate` or "make me a POV clip."

## How it works

- Step 1, draft the still: cheap image model (Nano Banana 2, or GPT Image 2 if there is text or an app UI in frame). You review before anything is animated. The final still is 1080x1920, because the clip inherits the still's dimensions.
- Step 2, animate: the approved still goes to Seedance 1.0 Pro image-to-video on kie.ai at 1080p. The skill quotes the credit and dollar cost and waits for your go. Then it polls, downloads the mp4, and logs the prompt and the real cost.

## What makes this build useful

1. A running budget ceiling. A cost ledger at `<generations>/ledger.json`, plus a session cap and a monthly cap the skill refuses to cross. Every cost quote shows what you have spent and what is left. Both spend caps are defaults. Edit them in SKILL.md.
2. Reusable presets (`presets/`). Save a format, a character, your app watermark, and your brand look once, and every clip in the series stays consistent. Ships with `pov`, `before-after`, `problem-solution`, `story`, `listicle`, `app-watermark`, and `brand-style` to edit.
3. A quality gate plus a Blotato hand-off. The skill checks the still before spending on animation (1080x1920 dimensions, no baked-in text, point of view holds), then writes a publish-ready clip and a `.publish.json` sidecar and hands off to Blotato for scheduling. Blotato publishes, it does not generate.

## Cost, at a glance

- Still: 10 credits, about $0.05.
- 10 second 1080p Seedance 1.0 Pro clip: 140 credits, about $0.70 at $5 per 1,000 credits. With its still, the finished clip is 150 credits, about $0.75.
- Seedance 1.0 Lite (budget): a 10 second 1080p clip is 100 credits, about $0.50.
- kie.ai credits do not expire.

## Models wired

- Image: nano-banana-2 (default), gpt-image-2-text-to-image (text and UI)
- Video: bytedance/v1-pro-image-to-video (default), bytedance/v1-lite-image-to-video (budget), bytedance/seedance-2-5 (explicit only)
- Add fal.ai or WaveSpeed recipes later if you want more models or a provider backup.
