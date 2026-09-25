# Style lock: Tarry

Mood: warm / approachable (Italian consumer AI assistant with a mascot). Palette hand-built around the fixed brand mark, because the generated warm palette (seed 41) put a terracotta primary next to the yellow/violet mascot.

## Palette (runtime light/dark toggle, `.dark` class on `<html>`)

| Role | Light | Dark |
|---|---|---|
| text | #1c1a14 | #f5f3ec |
| text-secondary | #57534a | #b8b3a6 |
| text-tertiary | #6f6a5e | #a09b8e |
| bg | #fbfaf6 | #131209 |
| surface | #ffffff | #1f1f1f |
| bg-secondary | #f3f1ea | #1f1f1f |
| bg-tertiary | #e9e6dc | #272727 |
| border | #d9d4c5 | #313131 |
| brand (mascot yellow) | #eab308 | #eab308 |
| cta fill / label | #1c1a14 / #ffffff | #eab308 / #131209 |
| accent-text (links, active) | #8a6100 | #eab308 |
| violet (focus, secondary accent) | #6d28d9 | #a78bfa |

## Color contract (verified with scripts/check_contrast.py)
- Text-safe light: text/bg 16.66, text/surface 17.40, text-secondary/bg 7.33, text-tertiary/bg 5.16, text-tertiary/bg-secondary 4.77, accent-text/bg 5.30, violet/bg 6.80, ink cta label 17.40, text on brand yellow 9.07.
- Text-safe dark: text/bg, text-secondary/bg 8.98, text-tertiary/bg-tertiary 5.39, brand/bg-tertiary 7.79, violet/bg-tertiary 5.49, bg on brand 9+.
- Not legal: brand yellow as a fill against the light bg (1.84:1). Yellow never carries a light-mode button shape; light CTAs are ink. White text never sits on yellow.

## Typography
- One family: Manrope Variable, self-hosted via @fontsource-variable (no Google Fonts request, GDPR-friendly).
- Weights 400/500/600/700 only. No italics. Sizes on the Tailwind scale only.
- Hero h1: text-4xl mobile, text-6xl desktop. Section h2: text-3xl mobile, text-4xl desktop (60% of hero).

## Density & spacing
- Spacing values only from 2/4/8/12/16/24/32/40/48/64/80/96 px.
- Landing sections py-24 (96px) top and bottom, so section boundaries read as ~192px. Connective bands py-16.
- Content cards p-6 minimum, showcase panels p-8. App shell stays compact (p-3/p-4).

## Shape
- Radius: rounded-full for buttons and the nav pill, rounded-2xl (16px) for cards and chat panels, rounded-lg (8px) for elements nested 8px inside a card.
- Borders all around or none. No background gradients.

## Icons
- Phosphor (@phosphor-icons/react), regular weight, 1.5 stroke look; one family across landing and app.

## Motion
- Interactive states: 150-200ms on named properties with cubic-bezier(0.2, 0, 0, 1); press scale(0.96).
- Scroll reveals: translate-y 64px + blur 12px + opacity 0 -> rest, 800ms cubic-bezier(0.32, 0.72, 0, 1), IntersectionObserver, off under prefers-reduced-motion.
- No transition: all anywhere.

## Structure (landing)
- Macrostructure: Product Demo / Workbench.
- Nav N3 floating pill · Hero H2 split demo (left-bias, live chat) · Problem before/after pair · Features F3 sticky stack · Tagline reveal · Proof P1-style capability wall (real formats and connectors) · Pricing F6 spec-sheet · FAQ · Close C2 · Footer Ft2.

## Assets
- No photography (nothing physical to show). No unDraw library available; the mascot SVG is the only illustration and is kept byte-for-byte.
