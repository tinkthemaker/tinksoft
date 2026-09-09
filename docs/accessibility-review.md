# Accessibility and responsive review

Reviewed on 2026-09-09 against the production output served by `npm run preview`.

## Coverage and results

- Chromium 153 via Playwright 1.63.0 and axe-core 4.13.0.
- All 41 HTML pages scanned at 320px and 1280px widths, in both light and dark
  mode: 164 page/theme/viewport combinations. The WCAG 2 A/AA, WCAG 2.1 AA,
  and best-practice axe rules reported no violations after the fixes below.
- No document-level horizontal overflow in those 164 combinations. Additional
  layout checks passed at 390px and 768px for the home, projects, post,
  About, and demo pages in both themes.
- Screenshot review covered the home, projects, post, releases, and demo
  layouts, plus keyboard focus on the mobile code block and pause control.
- With page JavaScript disabled, keyboard checks confirmed that the skip link
  becomes visible, Enter jumps to the main content, and the following Tab stays
  in the content on the home, About, post, and project pages in both themes.
  Focused content links retain a visible 2px outline.
- The About code sample is reachable with Tab and scrolls with ArrowRight at
  320px. The demo checkbox is reachable with Tab; Space pauses/resumes all four
  animations, including the plasma pseudo-element, without JavaScript.
- Emulating reduced motion removes all demo animations and disables smooth
  scrolling, regardless of the pause checkbox state.

The axe pass used a separate browser context with CSP bypass enabled only to
inject the audit library. Keyboard and motion checks used the site's normal
CSP with page JavaScript disabled. The production site does not include the
audit tools or executable scripts.

## Issues fixed

| Finding | Change |
| --- | --- |
| Light-mode teal text on panels measured 4.37:1, below 4.5:1 | Darkened the shared light-mode accent token |
| Amber headings on panels measured 4.27:1; active-project badges measured 4.14:1 | Darkened the light-mode heading and work-in-progress tokens |
| Site status text was outside a landmark | Moved it inside the existing site header |
| About page's code sample could overflow without a keyboard focus target | Added a named, focusable region and extended the visible focus rule to all controls |
| Continuous demo motion had no on-page pause control | Added a labeled native checkbox that pauses every animation using CSS |

## Repeat the review

1. Run `npm run validate`, then `npm run preview`.
2. Scan every generated HTML route using axe's `wcag2a`, `wcag2aa`, `wcag21aa`,
   and `best-practice` tags in light/dark mode at desktop and 320px widths.
   Check that the document's scroll width does not exceed its viewport width.
3. Inspect representative templates at mobile, tablet, and desktop widths.
4. Disable page JavaScript. Use Tab, Shift+Tab, and Enter to check navigation
   and focus visibility. On About, Tab to the code sample and use ArrowRight.
   On the demo page, Tab to the pause checkbox and use Space to pause/resume.
5. Enable the browser's reduced-motion emulation and confirm that the demo
   remains still even with the checkbox unchecked.

This is a Chromium review with emulated viewport and media settings, not a
screen-reader or physical-device certification. Safari, Firefox, screen-reader
output, and touch interactions remain separate review work. Automated scans
cannot establish complete WCAG conformance.
