# Preset: listicle

One format: a ranked countdown, "5 X for Y", with your product at number 1. This is a starter you edit and reuse so every countdown looks like the same channel. It is one preset among many, not the whole skill. You can generate any format with no preset at all; presets just keep a series consistent.

Note: a countdown is several scenes, so this is more than one generation. Make one still per item in the same card style, then stitch them in order in your editor, or animate each and cut them together. This preset keeps the card style identical across the set.

## Locked prompt fragment (always included)

A clean, cinematic vertical card in a consistent style across the whole set. Each card shows one big rank number and a short label, with a single hero subject. The style, colors, layout, and type stay identical from card to card so the countdown reads as one series. There is text on these cards, so generate every card on GPT Image so the numbers and labels stay legible. Put your product as the hero on the number 1 card.

## Params

- aspect_ratio: 9:16
- image resolution: draft at 2K for detail; the skill downsizes to 1080 x 1920 before animating (the clip inherits the still's dimensions)
- video resolution: 1080p
- duration: 5 per card

## Refs (required for consistency)

- generations/refs/card-style.png  (one approved card as the style anchor for the rest)
- generations/refs/app-logo.png  (your product, passed in as a reference for the number 1 card)

## Usage

- "/generate using the listicle preset: 5 tools for faceless video, my product at number 1. Card 3 of 5."
- "/generate using the listicle preset: 5 morning habits, card 1 of 5."
- "/generate using the listicle preset: 5 apps every founder needs, my product at number 1. Card 5 of 5."

## Motion prompt for the animate step

Subtle push in on the card, gentle number pop, 5 seconds, keep the text still and readable.
