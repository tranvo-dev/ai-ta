import { describe, expect, it } from 'vitest';
import { normalizeLatexDelimiters } from './latex';

describe('normalizeLatexDelimiters', () => {
  it('rewrites inline \\(...\\) to $...$', () => {
    expect(normalizeLatexDelimiters('Ta co \\(x = \\frac{1}{2}\\) nen...')).toBe(
      'Ta co $x = \\frac{1}{2}$ nen...'
    );
  });

  it('rewrites display \\[...\\] to a $$ block', () => {
    expect(normalizeLatexDelimiters('Ket qua:\n\\[ x^2 + 2x = 0 \\]')).toBe(
      'Ket qua:\n\n\n$$\nx^2 + 2x = 0\n$$\n\n'
    );
  });

  it('keeps multi-line display math on its own lines', () => {
    expect(normalizeLatexDelimiters('\\[\na = b \\\\\nc = d\n\\]')).toBe(
      '\n\n$$\na = b \\\\\nc = d\n$$\n\n'
    );
  });

  it('blank-line separates display math that follows text on the same line', () => {
    // A single newline does not end a markdown paragraph, so the $$ block would
    // stay inline and never be recognised as display math.
    expect(normalizeLatexDelimiters('Cong thuc: \\[ a = b \\]')).toBe(
      'Cong thuc: \n\n$$\na = b\n$$\n\n'
    );
  });

  it('leaves existing $ math alone', () => {
    const src = 'Gia tri $x^2$ la so duong.';
    expect(normalizeLatexDelimiters(src)).toBe(src);
  });

  it('does not touch delimiters inside inline code', () => {
    const src = 'Go `\\(x\\)` de viet cong thuc.';
    expect(normalizeLatexDelimiters(src)).toBe(src);
  });

  it('does not touch delimiters inside fenced code', () => {
    const src = '```tex\n\\[ x = 1 \\]\n```';
    expect(normalizeLatexDelimiters(src)).toBe(src);
  });

  it('handles empty and undefined-ish input', () => {
    expect(normalizeLatexDelimiters('')).toBe('');
  });
});
