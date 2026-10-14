---
name: Pro League Analytics
colors:
  surface: '#11131b'
  surface-dim: '#11131b'
  surface-bright: '#373942'
  surface-container-lowest: '#0c0e16'
  surface-container-low: '#191b24'
  surface-container: '#1d1f28'
  surface-container-high: '#282a32'
  surface-container-highest: '#33343e'
  on-surface: '#e2e1ee'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e2e1ee'
  inverse-on-surface: '#2e3039'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffecad'
  on-tertiary: '#3a3000'
  tertiary-container: '#f4ce00'
  on-tertiary-container: '#695800'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#11131b'
  on-background: '#e2e1ee'
  surface-variant: '#33343e'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  container-max: 1440px
  density: tight
---

## Brand & Style

The design system is engineered to evoke the high-octane energy of prime-time sports broadcasting. It targets professional analysts and high-stakes fans who require split-second data clarity paired with a premium, cinematic aesthetic.

The visual style is a sophisticated evolution of **Glassmorphism**, specifically tailored for high-density data. By layering translucent surfaces over deep, atmospheric backgrounds, the system creates a sense of immense depth and focus. Every element is treated as a physical light-emitting object—utilizing inner glows, neon accents, and vibrant blurs to mimic the electrified atmosphere of a stadium under floodlights. The emotional response is one of authority, speed, and precision.

## Colors

The palette is anchored in a "Stadium Night" foundation, using deep navy and near-black tones to ensure the accent colors achieve maximum luminosity.

- **Primary (Electric Blue):** Used for critical action paths, active states, and primary data threads. It represents connectivity and modern technology.
- **Secondary (Vibrant Purple):** Used for depth, branding elements, and secondary data categories. It adds a premium, royal "IPL-style" flair.
- **Tertiary (Gold Highlights):** Reserved for "Winner" states, MVP callouts, and premium achievement indicators.
- **Surface Neutrals:** A range of semi-transparent blacks and navy tones that allow the background blur to bleed through while maintaining text legibility.

## Typography

This design system utilizes a high-contrast typographic pairing to balance broadcast energy with data readability.

- **Headings:** **Space Grotesk** provides a geometric, futuristic feel. Its tight tracking and bold weights mirror the "lower-third" graphics seen in live cricket broadcasts.
- **Body & Data:** **Lexend** is chosen for its specific engineering for readability. In a high-density environment, Lexend ensures that player stats and match metrics are absorbed instantly without fatigue.
- **Data Display:** Numerical values should prioritize uppercase-style figures and, where possible, use the "Data-Mono" style for tabular alignment in scorecards.

## Layout & Spacing

The layout philosophy follows a **high-density fluid grid** model. It is designed to maximize information "above the fold," mimicking a mission control center.

- **Grid:** A 12-column grid system with tight gutters (16px) to allow for more data modules per row.
- **Rhythm:** A 4px base unit controls all internal padding, ensuring elements feel compact and "engineered."
- **Modules:** Use a "Dashboard First" approach where information is grouped into functional bento-style boxes. Each box is a glass container that scales fluidly based on viewport width.

## Elevation & Depth

Depth in this design system is achieved through light and transparency rather than traditional shadows.

- **The "Glass" Stack:** Surfaces use a background blur (12px to 20px) and a background color of 40-60% opacity.
- **Inner Glows:** Every container features a subtle 1px inner border (top and left) with a higher opacity to simulate light hitting the edge of a glass pane.
- **Neon Elevations:** Higher-level elements (like active modals or floating stats) do not use black shadows; instead, they use a soft, colored outer glow (bloom effect) matching their primary accent color.
- **Z-Axis Hierarchy:** 
    - Level 0: Deep navy background.
    - Level 1: Main content containers (Subtle glass).
    - Level 2: Interactive elements/cards (Higher transparency, brighter borders).
    - Level 3: Modals and tooltips (High blur, vibrant accent glow).

## Shapes

The shape language is "Precision-Soft." While the design system uses `rounded-sm` (4px) as a baseline for most data containers to maintain a serious, professional edge, it transitions to `rounded-lg` for primary buttons and interactive chips to make them more tactile and inviting.

- **Containers:** 4px radius for a structured, architectural look.
- **Buttons/Badges:** 8px to 12px radius to contrast against the rigid grid.
- **Visual Interest:** Use 45-degree angled corners (clipped corners) occasionally on decorative "Broadcast Tags" to reinforce the sports-tech aesthetic.

## Components

- **Buttons:** Primary buttons feature a solid electric blue gradient with a "neon pulse" animation on hover. Secondary buttons are "Ghost-Glass" with a 1px vibrant purple border.
- **Neon Progress Bars:** Use a dual-layered approach—a semi-transparent track and a glowing, high-saturation fill. Add a small "glow-head" at the leading edge of the progress to simulate energy movement.
- **Scorecards:** Use the glassmorphism effect with a vertical primary-color accent bar on the left to indicate the "leading" team or active state.
- **Data Visualizations:** Charts should avoid solid fills. Use glow-lines for line charts and frosted-glass segments for pie/donut charts.
- **Live Indicators:** A pulsating gold or red dot with a soft radial blur to signify "LIVE" status, mimicking broadcast tally lights.
- **Chips/Badges:** Small, pill-shaped elements with semi-transparent fills and high-contrast text for player positions or match status.