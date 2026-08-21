# Preset: problem-solution

One format: a short clip that shows a pain, then your product as the fix. This is a starter you edit and reuse so every problem-solution clip looks like the same channel. It is one preset among many, not the whole skill. You can generate any format with no preset at all; presets just keep a series consistent.

Made as two clips you cut together: beat 1 the problem, beat 2 the relief.

## Locked prompt fragment (always included)

A cinematic, photoreal vertical clip of one beat. Make the format as two matched stills: the problem, a frustrating everyday moment shown honestly, and the relief, the same person or scene once the product has solved it. Same framing and lighting so only the state changes. Natural lighting. No text baked into the scene, with one exception: if a screen or product UI is shown, generate that frame on GPT Image so the UI stays legible, and keep every other surface text free.

## Technique

Single frame, no morph. Make the problem still and the solution still separately, animate each one on its own (one animate run per still), then cut from the problem clip to the solution clip in your editor. Cutting in this order keeps the payoff out of the opening frame. The model animates one still at a time; the problem-to-relief transition happens in the edit, not in the model.

## Params

- aspect_ratio: 9:16
- image resolution: draft at 2K for detail; the skill downsizes to 1080 x 1920 before animating (the clip inherits the still's dimensions)
- video resolution: 1080p
- duration: 10

## Refs (optional)

- generations/refs/app-logo.png  (pass your product in as a reference, never described in words)

## Usage

- "/generate using the problem-solution preset: 20 browser tabs of scattered notes, then one clean dashboard."
- "/generate using the problem-solution preset: a cold dark gym at 5am, then the same person mid workout, energized."
- "/generate using the problem-solution preset: a messy inbox at 3am, then inbox zero at sunrise."

## Motion prompt for the animate step

Subtle handheld motion, a gentle beat of life in the frame, 10 seconds, no added text. Run once on the problem still and once on the solution still.
