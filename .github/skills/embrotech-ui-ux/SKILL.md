---
name: embrotech-ui-ux
description: "Use when designing, implementing, or reviewing frontend pages and components for the Embrotech website, including responsive layouts, visual design systems, navigation, forms, and accessibility."
---

# Embrotech UI/UX

Design and implement clear, accessible frontend experiences for Embrotech's bilingual company website. Use the existing project as the source of truth, and explain implementation choices in simple language.

## Project context

- Embrotech provides machine embroidery for promotional and work textiles.
- This is an informational company website, not a shop or price calculator.
- The site supports Slovak and English with localized `/sk/...` and `/en/...` routes.
- The project uses Vite, React with plain JavaScript, React Router, Tailwind CSS, and react-i18next.
- Visible interface text belongs in `src/i18n/sk.json` and `src/i18n/en.json`.
- Examples and news content belongs in `src/data/`, not in page components.
- The site should be mobile-first, accessible, fast, and easy for a beginner to maintain.

## Workflow

1. **Inspect before designing.** Read the relevant page, shared components, routes, translations, assets, and existing styles. Reuse established patterns and brand assets instead of introducing a competing visual language.
2. **Understand the page goal.** Identify its audience, purpose, primary information, and next action. Keep the content and layout appropriate for a Slovak embroidery company.
3. **Choose a coherent design direction.** Define the page structure, visual style, colors, typography, spacing, and interaction behavior before implementing. Prefer a small, consistent set of design tokens or Tailwind utilities over one-off decoration.
4. **Respect the brand.** Do not invent company facts, testimonials, customer logos, prices, or brand colors. If existing assets do not establish an important brand choice, ask the user or make the uncertainty explicit before committing to a distinctive direction.
5. **Implement in small pieces.** Use functional React components and hooks. Keep components focused, use clear names, and place reusable components in separate files. Use semantic HTML and the project's existing libraries.
6. **Keep both languages complete.** Add matching translation keys and natural Slovak and English copy together. Do not hardcode user-facing text in JSX, attributes, validation messages, or accessible labels.
7. **Check the experience.** Consider narrow mobile screens, keyboard-only use, focus visibility, browser zoom, and long translated text. Use meaningful alt text for informative images and empty alt text for decorative images.
8. **Verify the result.** Run the smallest relevant lint, test, or build command. For visual changes, inspect the rendered page at mobile and desktop widths when browser tools are available. Fix issues caused by the change and report any validation that could not be performed.
9. **Explain briefly.** Summarize what changed and why in beginner-friendly language. Keep to the requested component or page and do not modify unrelated files.

## Visual and interaction guidance

- Make hierarchy obvious: one clear page heading, scannable sections, readable body text, and a visible primary action when the page needs one.
- Use restrained, professional styling that supports the embroidery work and its photography. Do not add gradients, animation, decorative icons, or card grids without a clear purpose.
- Use real links for navigation and buttons for actions. Provide descriptive link text, visible keyboard focus, and accessible names for controls.
- Maintain sufficient text contrast, responsive text wrapping, and usable touch targets. Do not communicate meaning through color alone.
- Respect reduced-motion preferences and avoid motion that delays or obstructs interaction.
- Keep imagery optimized and appropriately sized; lazy-load below-the-fold images when suitable.
- Do not add ecommerce patterns, checkout language, invented pricing, or a price calculator.

## Sources and inspiration

- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) informs the design-system-first workflow: reason about the product and audience, then choose a suitable page pattern, visual style, palette, typography, effects, and UX checks. This skill adapts that approach to Embrotech rather than reproducing its catalogs or content.
- [Claude Code](https://github.com/anthropics/claude-code) is a reference for an agentic coding workflow that works directly with a codebase. Apply the general inspect, implement, and verify discipline; this file does not install or configure Claude Code.
