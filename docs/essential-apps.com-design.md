---
version: alpha
name: Stripe Modern
description: A clean, airy financial brand system with bold violet accents and editorial-scale typography.
colors:
  primary: "#533AFD"
  secondary: "#000EFF"
  tertiary: "#B9B9F9"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#0A2540"
  text: "#0A2540"
  accent: "#000EFF"
  border: "#E6E8F0"
  muted: "#627A96"
  error: "#D92D20"
typography:
  headline-display:
    fontFamily: "sohne-var"
    fontSize: "48px"
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "sohne-var"
    fontSize: "32px"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline-md:
    fontFamily: "sohne-var"
    fontSize: "26px"
    fontWeight: 300
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  headline-sm:
    fontFamily: "sohne-var"
    fontSize: "16px"
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: "0em"
  body-lg:
    fontFamily: "sohne-var"
    fontSize: "18px"
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  body-md:
    fontFamily: "sohne-var"
    fontSize: "16px"
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  body-sm:
    fontFamily: "sohne-var"
    fontSize: "14px"
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label-lg:
    fontFamily: "sohne-var"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"
  label-md:
    fontFamily: "sohne-var"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"
  label-sm:
    fontFamily: "sohne-var"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"
rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xs: 6px
  sm: 14px
  md: 24px
  lg: 36px
  xl: 80px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 16px 24px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 16px 24px
    height: 48px
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 16px 24px
    height: 48px
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: 0px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 8px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 14px 16px
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 6px 12px
---

# Stripe Modern

## Overview
Stripe reads as polished, confident, and highly modern, with a strong emphasis on clarity and scale. The experience feels spacious and premium rather than dense, using large editorial headlines, restrained navigation, and a vivid color flourish to signal energy without losing trust. It is aimed at business users and product teams, so the tone should stay professional, crisp, and conversion-oriented.

## Colors
- **Primary (#533AFD):** The signature violet action color used for primary buttons, important links, and high-attention accents. It should feel energetic and product-forward, not playful.
- **Secondary (#000EFF):** A saturated electric blue used for emphasis in body copy and supporting accents. It helps create the brand’s sharp, digital tone.
- **Tertiary (#B9B9F9):** A pale lavender used for borders, subtle outlines, and secondary UI states. It softens the palette without reducing contrast.
- **Neutral (#FFFFFF):** The dominant base color for page backgrounds, cards, and button surfaces. It keeps the layout airy and lets color accents stand out.
- **Surface (#FFFFFF):** Use the same white surface treatment for panels and containers so the interface stays clean and layered primarily through spacing rather than shading.
- **On-surface (#0A2540):** A deep navy text color that carries most headlines, navigation, and supporting UI. It is less stark than pure black and feels more refined.
- **Text (#0A2540):** Primary reading color for all long-form and UI text where strong readability is needed.
- **Border (#E6E8F0):** A faint cool-gray line used for separators, header rules, and subtle component boundaries.
- **Muted (#627A96):** A softer blue-gray for secondary copy, metadata, and less prominent labels.
- **Error (#D92D20):** Reserved for destructive states and validation feedback; it should remain rare and highly visible.

## Typography
The system is built on the custom `sohne-var` family, with a light, modern grotesk feel and very tight optical refinement. Headlines use weight 300 to create the signature airy, editorial look, while labels and buttons step up to 400 for clarity and affordance. Large text relies on negative letter-spacing for a polished, brand-led presence, while body copy stays open and readable with generous line height.

`headline-display`, `headline-lg`, and `headline-md` are the main storytelling levels for marketing pages and hero sections. `body-lg`, `body-md`, and `body-sm` handle descriptive content, supporting narratives, and fine print. `label-lg`, `label-md`, and `label-sm` are best for buttons, nav items, metadata, and small UI affordances. Uppercase treatment is not a core pattern here; the brand relies more on size, spacing, and weight than on caps styling.

## Layout
The layout is wide, centered, and intentionally breathable, with a strong preference for large white margins and minimal chrome. Content typically sits in a fixed max-width marketing column while hero art and background treatments extend more fluidly across the page. Vertical rhythm follows a small set of generous spacing steps, using `6px`, `14px`, `24px`, `36px`, and `80px` as the main cadence.

Section padding should feel generous, with large top/bottom breathing room around headlines and supporting copy. Cards and smaller containers should use minimal internal padding so the composition stays light rather than boxed-in. Align content to a clear grid and let whitespace do most of the work of separation.

## Elevation & Depth
The visual language is intentionally flat. Instead of relying on heavy shadows or stacked surfaces, hierarchy is established through contrast, color, typography scale, and occasional thin borders. Subtle separators and pale outlines are preferred over dramatic elevation, which keeps the interface feeling premium and uncluttered.

When depth is needed, use restrained tonal layering and thin strokes rather than blur-heavy shadow systems. Cards may use a very light shadow only when necessary, but the default should be near-flat.

## Shapes
The shape language is softly rectilinear, with small radii and clean edges. Interactive elements should favor `4px` to `6px` corners, giving the UI a precise but approachable feel. Avoid pill-shaped controls except for special chips or tags where a fully rounded form improves scanability.

Overall, the system feels architectural and controlled rather than organic. Rounded corners should support hierarchy, not become a dominant decorative feature.

## Components
Buttons are the most visible interactive element and should remain compact, crisp, and highly legible. `button-primary` uses the violet fill, white text, `rounded.sm`, and 48px height for the main call to action. `button-secondary` inverts the treatment with a white background, violet text, and a pale border for lower-priority actions. `button-tertiary` should look like a text link with no container chrome. Hover states can deepen or shift toward `secondary` while preserving the same geometry and padding.

Cards should feel like quiet white panels with minimal decoration. Use `card` with `rounded.md`, white background, and very subtle depth only when a container needs separation from the page. Avoid large shadows or heavy borders unless the content density requires it.

Inputs should follow the same restrained language: white fill, soft border, and small-radius corners. Labels and helper text should remain clear but unobtrusive, using `body-md` or `label-md` rather than heavy emphasis. Focus states should be visible through color and border change, not through thick outlines or shadows.

Chips can be fully rounded and lightly outlined, especially for filtering or metadata. They should use the primary color for text or accent, with a quiet surface fill. Navigation links and utility text should stay simple and low-friction, matching the brand’s preference for clarity over ornament.

## Do's and Don'ts
- Do keep the page spacious, with generous margins and clear hierarchy.
- Do use `sohne-var` consistently for both headlines and UI text.
- Do reserve `button-primary` for the single strongest action in a view.
- Do use the violet `primary` color as the main call-to-action signal.
- Don't introduce heavy shadows, glass effects, or decorative depth.
- Don't use loud gradients or saturated color blocks as routine UI chrome.
- Don't over-round controls; keep the geometry crisp and modest.
- Don't make body text overly bold; the system depends on light, elegant typography.