---
name: Cricket Editorial System
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#414943'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3b6751'
  primary: '#001b0f'
  on-primary: '#ffffff'
  primary-container: '#013220'
  on-primary-container: '#6f9c84'
  inverse-primary: '#a2d1b7'
  secondary: '#5e604d'
  on-secondary: '#ffffff'
  secondary-container: '#e1e1c9'
  on-secondary-container: '#636451'
  tertiary: '#745b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cda729'
  on-tertiary-container: '#4e3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bdedd2'
  primary-fixed-dim: '#a2d1b7'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#234f3b'
  secondary-fixed: '#e4e4cc'
  secondary-fixed-dim: '#c8c8b0'
  on-secondary-fixed: '#1b1d0e'
  on-secondary-fixed-variant: '#474836'
  tertiary-fixed: '#ffe089'
  tertiary-fixed-dim: '#eac243'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  display-lg:
    fontFamily: notoSerif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: notoSerif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: notoSerif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  section-gap: 80px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system establishes an authoritative and intellectual atmosphere for high-level cricket analysis. It draws inspiration from heritage sports journalism and premium broadsheets, blending the prestige of the "gentleman's game" with a modern, data-driven edge. 

The visual style is **Minimalist Editorial**. It prioritizes legibility, generous whitespace (breathability), and a sophisticated hierarchy that treats every statistical insight like a headline story. The aesthetic response should be one of quiet confidence, reliability, and timelessness, moving away from the high-energy, neon aesthetics common in T20 broadcasting in favor of a "long-form" literary experience.

## Colors

The palette is rooted in the traditional elements of the sport: the deep green of a pristine outfield, the warm cream of vintage flannels, and subtle gold accents representing championship excellence.

- **Deep Forest Green (#013220):** Used for primary branding, headings, and high-emphasis UI elements. It acts as our "black" for text to maintain a softer, more organic contrast.
- **Cream/Off-white (#F5F5DC, #FAF9F6):** These colors form the foundation of the interface. Use the lighter #FAF9F6 for the main canvas and #F5F5DC for structural sections or card backgrounds to create subtle depth.
- **Gold (#C5A021):** Reserved for highlights, active states, and "Premium" signifiers. It should be used sparingly—as an accent rather than a primary container color.

## Typography

The typography strategy relies on the tension between the traditional, authoritative **Noto Serif** and the functional, neutral **Inter**. 

- **Headlines:** Use Noto Serif for all editorial titles. For feature articles, use "Display" sizing with tighter letter-spacing to evoke a magazine masthead feel.
- **Body Text:** Inter is utilized for long-form analysis and data points to ensure maximum readability on digital screens. 
- **Labels:** Small caps with increased letter-spacing should be used for metadata (e.g., "BYLINE," "DATE," "STATISTIC") to provide a clear secondary hierarchy without cluttering the page.

## Layout & Spacing

The design system utilizes a **fixed grid** approach for desktop to maintain the disciplined structure of a printed journal. 

- **Grid Model:** A 12-column grid with a maximum width of 1280px. 
- **Rhythm:** Generous vertical rhythm is essential. Use large section gaps (80px+) to separate different analysis modules. 
- **Whitespace:** Never crowd the content. Analysis of complex statistics requires significant negative space to allow the reader to focus on one "insight" at a time.
- **Margins:** Intentional "asymmetric" whitespace can be used in editorial layouts, such as pushing the main body text to an 8-column span while leaving 4 columns for pull-quotes or side-bar data.

## Elevation & Depth

This design system avoids heavy shadows and floating effects, favoring a grounded, tactile feel. 

- **Tonal Layering:** Depth is primarily communicated through the subtle shift between the cream hues (#FAF9F6 to #F5F5DC).
- **Ambient Shadows:** Where cards are used, they should feature extremely soft, diffused shadows with a low opacity (e.g., 5% Forest Green tint). The goal is to lift the card just enough to distinguish it from the background without making it feel "digital" or "app-like."
- **Hairline Borders:** Use 1px borders in a transparent version of the Forest Green (10-15% opacity) to define boundaries within tables and card structures.

## Shapes

The shape language is conservative and structural. 

- **Corner Radius:** A "Soft" (0.25rem / 4px) radius is the standard for cards and buttons. This provides a hint of modernity while remaining formal enough for a journal. 
- **Table Structure:** Keep table corners sharp (0px) to reinforce a data-driven, precise architectural feel.
- **Graphic Elements:** Any decorative lines or "rules" should be thin (1px or 2px) and terminate with sharp edges.

## Components

### Top Navigation Bar
A minimalist, high-contrast bar. Use the Forest Green for the text and a transparent or cream background. The navigation links should use the `label-caps` style for a refined, sorted appearance. The logo should always be set in Noto Serif.

### Card-Based Sections
Editorial cards used for article previews or featured stats. 
- **Style:** Cream background (#F5F5DC), a 1px Forest Green border (low opacity), and the `label-caps` for category tags at the top.
- **Padding:** Internal padding should be generous (minimum 32px) to maintain the editorial feel.

### Tables (Data Analysis)
The core of the analysis journal.
- **Header:** Deep Forest Green background with Gold or Off-white text.
- **Rows:** Alternating subtle cream tints (zebra striping) are permitted, but prefer simple 1px horizontal dividers.
- **Typography:** Use Inter for numbers; ensure they are tabular-lined for easy comparison of statistics.

### Buttons
- **Primary:** Deep Forest Green background with Off-white text. 
- **Secondary:** Transparent background with a 1px Forest Green border and Green text. 
- **Tertiary:** Text-only with a subtle Gold underline for "Read More" links.

### Inputs & Selects
Used for filtering match data.
- **Style:** Underlined style (1px border on the bottom only) or a very subtle outlined box. Avoid heavy fills. Use Inter for input text.