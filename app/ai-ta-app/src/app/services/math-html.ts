import DOMPurify from 'dompurify';

/**
 * KaTeX renders math as MathML plus spans whose inline `style` carries the
 * entire layout (fraction bars, superscript offsets, glyph heights). Angular's
 * built-in sanitizer allows neither, so it strips them and the formula collapses
 * into unreadable symbols. We bypass that sanitizer and use DOMPurify instead,
 * which understands MathML and sanitizes CSS rather than discarding it.
 */
export function sanitizeMathHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    // MathML and SVG are part of KaTeX's output, not optional extras.
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    // The mathMl profile omits these two; without them DOMPurify unwraps the
    // <annotation> and its raw TeX source leaks into the MathML as loose text,
    // which screen readers then read out.
    ADD_TAGS: ['semantics', 'annotation'],
    ADD_ATTR: ['style', 'encoding'],
  });
}
