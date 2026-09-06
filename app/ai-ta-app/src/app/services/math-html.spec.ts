import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { sanitizeMathHtml } from './math-html';

describe('sanitizeMathHtml', () => {
  const math = katex.renderToString('\\frac{x^2+1}{2}', { throwOnError: false });

  it('keeps the inline styles that carry KaTeX layout', () => {
    const before = (math.match(/style="/g) ?? []).length;
    const after = (sanitizeMathHtml(math).match(/style="/g) ?? []).length;
    expect(before).toBeGreaterThan(0);
    expect(after).toBe(before);
  });

  it('keeps MathML elements', () => {
    expect(sanitizeMathHtml(math)).toMatch(/<math\b/);
    expect(sanitizeMathHtml(math)).toMatch(/<semantics\b/);
  });

  it('keeps Vietnamese glyphs inside \\text{}', () => {
    const vi = katex.renderToString('\\text{Diện tích}', { throwOnError: false, strict: 'ignore' });
    expect(sanitizeMathHtml(vi)).toContain('ệ');
  });

  it('strips script tags', () => {
    expect(sanitizeMathHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });

  it('strips event handler attributes', () => {
    const out = sanitizeMathHtml('<img src=x onerror="alert(1)">');
    expect(out).not.toContain('onerror');
  });

  it('strips javascript: URLs', () => {
    const out = sanitizeMathHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('keeps ordinary markdown output intact', () => {
    const out = sanitizeMathHtml('<p>Xin chào <strong>bạn</strong></p>');
    expect(out).toBe('<p>Xin chào <strong>bạn</strong></p>');
  });
});

describe('sanitizeMathHtml — TeX annotation', () => {
  it('does not leak raw TeX source as loose text in the MathML', () => {
    const math = katex.renderToString('\\frac{x^2+1}{2}', { throwOnError: false });
    const out = sanitizeMathHtml(math);
    expect(out).toMatch(/<annotation[^>]*>\\frac\{x\^2\+1\}\{2\}<\/annotation>/);
  });
});
