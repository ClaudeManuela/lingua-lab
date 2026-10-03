# Avatar Sprite Guide

## Frame size
Recommended: 128×128 pixels per frame (or any square power-of-2)

## Format
PNG with transparency. Horizontal strip per animation.

## Naming convention
Each state is a single file:

- `avatar-idle.png`        (2–4 frames) — default breathing state
- `avatar-slouch.png`      (2–4 frames) — tired, hunched
- `avatar-energetic.png`   (2–4 frames) — bouncing, upright
- `avatar-headache.png`    (2–4 frames) — wincing, head pulsing
- `avatar-sleepy.png`      (2–4 frames) — yawning
- `avatar-excited.png`     (2–4 frames) — stars in eyes
- `avatar-frustrated.png`  (2–4 frames) — steam, arms crossed
- `avatar-focused.png`     (2–4 frames) — writing at desk

## Example strip (4 frames, horizontal)
┌────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │  → 512×128 total
└────┴────┴────┴────┘

## Brain map (optional override)
- `brain-map.png` — static brain background (128×128 or larger)
- If not provided, the CSS-drawn brain will be used.

## Lab background
- `lab-bg.png` — ambient background image (any size)