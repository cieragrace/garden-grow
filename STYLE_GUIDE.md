# Garden Grow — Style Guide

A friendly, modern botanical design system. Warm, natural, and approachable.
Tailwind v4 (CSS-first) — all tokens live in `src/app/globals.css` under `@theme`.
There is no `tailwind.config.*` file.

---

## Color Tokens

Every token is available as a Tailwind utility (`bg-*`, `text-*`, `border-*`).

### Greens (brand)

| Token        | Hex       | Utility example  | Use                              |
| ------------ | --------- | ---------------- | -------------------------------- |
| `garden`     | `#2F6B3D` | `bg-garden`      | Primary brand, headings, buttons |
| `leaf`       | `#4A7C59` | `text-leaf`      | Links, secondary green           |
| `leaf-bright`| `#6FA86B` | `bg-leaf-bright` | Hover states, accents on green   |
| `sage`       | `#A9C4A0` | `border-sage`    | Soft fills, borders, tags        |
| `sage-soft`  | `#D4E2CD` | `bg-sage-soft`   | Subtle surfaces, hover washes    |

### Neutrals (earthy / cream)

| Token        | Hex       | Utility example   | Use                       |
| ------------ | --------- | ----------------- | ------------------------- |
| `cream`      | `#F7F4EC` | `bg-cream`        | Page background           |
| `cream-deep` | `#EFE9DC` | `bg-cream-deep`   | Cards, raised surfaces    |
| `soil`       | `#27201A` | `text-soil`       | Primary text              |
| `soil-soft`  | `#5A5147` | `text-soil-soft`  | Muted / secondary text    |
| `line`       | `#E3DCCC` | `border-line`     | Hairline borders on cream |

### Accent (warm)

| Token         | Hex       | Utility example     | Use                       |
| ------------- | --------- | ------------------- | ------------------------- |
| `carrot`      | `#E08A4B` | `bg-carrot`         | CTAs, highlights, accents |
| `carrot-deep` | `#C5713A` | `hover:bg-carrot-deep` | Accent hover / active  |

### Semantic aliases

`background` → cream · `foreground` → soil · `primary` → garden · `accent` → carrot.

---

## Typography

Loaded via `next/font` in `src/app/layout.tsx` (no `<link>` tags).

| Role     | Font       | Token / class    | Notes                                  |
| -------- | ---------- | ---------------- | -------------------------------------- |
| Display  | Fraunces   | `font-display`   | Characterful serif. Headings, hero.    |
| Body     | Inter      | `font-body` / `font-sans` | Clean sans. UI + paragraphs.  |

- `h1`–`h4` default to Fraunces, weight 600, garden green, balanced wrapping — set globally in `globals.css`.
- Body text defaults to Inter on `soil`.
- For display flourish, Fraunces ships its `opsz`, `SOFT`, and `WONK` axes.

### Scale (suggested)

| Element | Classes                                            |
| ------- | -------------------------------------------------- |
| H1      | `text-4xl md:text-5xl font-display`                |
| H2      | `text-3xl font-display`                            |
| H3      | `text-2xl font-display`                            |
| Body    | `text-base leading-relaxed text-soil`              |
| Muted   | `text-sm text-soil-soft`                           |

---

## Component Conventions

### Buttons

- **Primary:** `bg-garden text-cream hover:bg-leaf rounded-lg px-5 py-2.5 font-medium transition-colors`
- **Accent (CTA):** `bg-carrot text-soil hover:bg-carrot-deep rounded-lg px-5 py-2.5 font-medium transition-colors`
- **Secondary / outline:** `border border-sage text-garden hover:bg-sage-soft rounded-lg px-5 py-2.5 font-medium transition-colors`
- Rounded and friendly (`rounded-lg`); always include `transition-colors`.

### Cards

- `bg-cream-deep border border-line rounded-xl p-6`
- Optional soft lift: `shadow-sm`. Keep decoration minimal — no heavy rings or stacked washes.

### Inputs

- `bg-cream border border-line rounded-lg px-3 py-2 text-soil placeholder:text-soil-soft`
- Focus: `focus:outline-none focus:border-leaf focus:ring-2 focus:ring-sage-soft`

### Tags / badges

- `bg-sage-soft text-garden rounded-full px-3 py-1 text-sm`

---

## Radius

Friendly, rounded. Tokens: `--radius-md` (0.625rem), `--radius-lg` (1rem), `--radius-xl` (1.5rem)
→ `rounded-md`, `rounded-lg`, `rounded-xl`. Prefer `rounded-lg`/`rounded-xl` for surfaces.

---

## Principles

- Warm and natural over clinical — cream backgrounds, never stark white.
- Green leads; carrot is the spark, used sparingly for the single most important action.
- Minimal decoration: one border + one surface tint is usually enough.
- Fraunces for personality in headings; Inter keeps the UI clean and legible.
