# Accessibility and responsive review

## 2026-11-19: Grimoire theme

Reviewed on 2026-11-19 against the dev server (`npm run dev`) after the
Grimoire retheme, in Chromium with emulated light and dark color schemes at
1280px, 700px, 375px and 320px widths.

### Results

- **Contrast.** `tests/theme.test.mjs` checks 22 text/background token pairs
  in both schemes against WCAG AA (4.5:1 for text, 3:1 for the rubric initials,
  which are large text only). All 44 pass. The lowest text pair is 5.64:1 at
  night and 4.61:1 by day. The link highlight is 8.5:1 at night and 13.1:1 by
  day. Code-block syntax colours are at least 5.9:1 on both code backgrounds.
- **Keyboard.** Tab order is unchanged: skip link, wordmark, site nav, path,
  content, footer. Every focused link gets the highlight fill plus a 2px ink
  ring. The wordmark instead gets a 2px dashed ember outline. Code blocks and
  the demo pause checkbox get a 2px ember outline. Checked by tabbing on the
  home, tags and project pages in both schemes.
- **Block links.** A script checked every link on 13 routes for descendants
  with their own background, and for link pseudo-elements carrying text. It
  found none, so the global highlight rule (children inherit the highlight
  colour) covers them. Real hover and focus on tag cards, project actions
  (including their `small` host label), list titles and footer links stayed
  readable in both schemes.
- **Fonts blocked.** Pointing the display and plate fonts at their fallbacks
  shows a serif wordmark with the same banded fill, and bold mono uppercase
  plates. Both read cleanly.
- **Small screens.** No document-level horizontal overflow on 13 routes at
  375px and 320px, after the fix below. The corridor stays 240×160 above the
  title, and the projects roster turns into blocks under 30rem.
- **Motion.** Only the night torch flicker moves, with stepped timing on 1.9s
  and 2.3s cycles. It is hidden by day and set to `animation: none` under
  `prefers-reduced-motion: reduce` (pinned by `tests/theme-source.test.mjs`).
  The demo pause checkbox still stops all three demo animations.
- **Forced colours.** Under `forced-colors: active`, the wordmark switches to
  a plain text fill with no gradient and no filter, including on hover, on
  focus and for its initial. The glow is hidden. Pinned by
  `tests/theme-source.test.mjs`.
- **Semantics.** The wordmark is real link text ("TinkSoft", with the initial
  in a plain span). The corridor viewport is `aria-hidden`. The roster is a
  real table with column headers and a visually hidden caption. Each page
  still has exactly one `<h1>`.

### Issues fixed

| Finding | Change |
| --- | --- |
| Day "shipped" green measured 4.37:1 on the page background | Darkened to `#1a3913` |
| 404 error label in rubric measured 4.39:1 by day | Uses the ember token instead |
| A post's code block widened the page to 338px at 320px (its grid column grew to the longest code line) | `min-width: 0` on the post's prose column, so the block scrolls inside itself |
| Project prose headings were uppercased, in blackletter | Removed the page's old heading override |
| Two pages recoloured link children on hover | Removed them; the global rule makes children inherit the highlight |

### Open items

- Reduced motion and forced colours were checked by CSS rule and source tests
  only. This browser session could not emulate them. Confirm with DevTools →
  Rendering emulation, and in a Windows contrast theme.
- No axe scan this pass. Run the repeat steps below against `npm run preview`.
- Screen-reader output of the wordmark wasn't heard on a real screen reader.
- Grenze Gotisch's "fi"/"fl" ligature puts both letters in the red initial of
  an `<h1>` that starts with them (seen on the 404 page). Cosmetic.

## 2026-09-09: baseline review

Reviewed on 2026-09-09 against the production output served by `npm run preview`.

### Coverage and results

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

### Issues fixed

| Finding | Change |
| --- | --- |
| Light-mode teal text on panels measured 4.37:1, below 4.5:1 | Darkened the shared light-mode accent token |
| Amber headings on panels measured 4.27:1; active-project badges measured 4.14:1 | Darkened the light-mode heading and work-in-progress tokens |
| Site status text was outside a landmark | Moved it inside the existing site header |
| About page's code sample could overflow without a keyboard focus target | Added a named, focusable region and extended the visible focus rule to all controls |
| Continuous demo motion had no on-page pause control | Added a labeled native checkbox that pauses every animation using CSS |

### Repeat the review

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
