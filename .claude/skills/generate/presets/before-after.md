# Preset: before-after

One format: one subject, two states, and the transformation is the hook. This is a starter you edit and reuse so every before and after clip looks like the same channel. It is one preset among many, not the whole skill. You can generate any format with no preset at all; presets just keep a series consistent.

## Locked prompt fragment (always included)

A cinematic, photoreal vertical clip of a single subject in one state. Make the format as a matched pair of stills, the before and the after, with the same framing, camera, and lighting so the only difference between them is the state. Natural lighting. No text baked into the scene, with one exception: if a screen or label is shown, generate that frame on GPT Image so the text stays legible, and keep every other surface text free.

## Technique

Single frame, no morph. Make two stills in the same style, the before and the after, animate each one on its own (one animate run per still), and cut or cross-fade between the two clips in your editor. The model animates one still at a time; the before-to-after transition happens in the edit, not in the model. Keep the two stills identical except the state so the cut reads as one transformation.

## Params

- aspect_ratio: 9:16
- image resolution: draft at 2K for detail; the skill downsizes to 1080 x 1920 before animating (the clip inherits the still's dimensions)
- video resolution: 1080p
- duration: 10

## Refs (optional)

- generations/refs/character.png  (a character sheet, if you want the same subject every time)

## Usage

- "/generate using the before-after preset: a cluttered desk, then the same desk clean and minimal."
- "/generate using the before-after preset: a blank landing page, then a finished, polished one."
- "/generate using the before-after preset: a wilted plant, then the same plant lush and green."

## Motion prompt for the animate step

Subtle handheld motion, a gentle beat of life in the frame, 10 seconds, no added text. Run once on the before still and once on the after still.
