# Preset: pov

One format: first person point of view, where the camera is your eyes. This is a starter you edit and reuse so every POV clip in your channel looks like the same channel. It is ONE preset among many, not the whole skill. You can generate any format with no preset at all; presets just keep a series consistent.

The most viral POV variation is the wake-up, "POV: you wake up as X", but the same preset covers any first person moment.

## Locked prompt fragment (always included)

First person point of view. The camera is my eyes, so I only see what I would really see: my own hands, my legs, or whatever is in front of me. Never my own face. Cinematic, photoreal, shot on a phone. Natural lighting. Vertical. No text baked into the scene, with one exception below.

If a phone or device is in the shot, I am looking forward or toward a window, never straight up, and the device is held at a natural angle off to one side with the screen visible. Never lying flat with the device held overhead. When a screen shows a UI, generate that frame on GPT Image so the on screen text stays legible, and keep every other surface text free.

## Params

- aspect_ratio: 9:16
- image resolution: draft at 2K for detail; the skill downsizes to 1080 x 1920 before animating (the clip inherits the still's dimensions)
- video resolution: 1080p
- duration: 10

## Refs (optional)

- generations/refs/character.png  (a character sheet, if you want the same person every time)

## Usage

Give the skill a concept. It merges the locked fragment above, keeps the point of view fixed, and never drifts across the series.

- "/generate using the pov preset: you wake up as a Roman senator."
- "/generate using the pov preset: you wake up and your app ran itself overnight, phone on the nightstand."
- "/generate using the pov preset: you are a barista and the morning rush just hit."
- "/generate using the pov preset: you find a hidden door behind your bookshelf."
- "/generate using the pov preset: you are holding the keys to your first apartment."

## Motion prompt for the animate step

Slow push in, subtle parallax, gentle light shift, 10 seconds, no text.
