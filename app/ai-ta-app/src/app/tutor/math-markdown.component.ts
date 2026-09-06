import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  inject,
} from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { sanitizeMathHtml } from '../services/math-html';

/**
 * Renders an assistant message as markdown with KaTeX math.
 *
 * We cannot use <markdown katex> directly: it runs the output through Angular's
 * sanitizer, which allows neither MathML nor the inline `style` attributes that
 * carry KaTeX's layout, so every formula arrives mangled. Instead we parse with
 * ngx-markdown's sanitizer disabled and clean the result with DOMPurify, which
 * keeps the math while still stripping scripts, event handlers and bad URLs.
 */
@Component({
  selector: 'app-math-markdown',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MathMarkdownComponent implements OnChanges {
  @Input({ required: true }) data = '';

  private readonly markdownService = inject(MarkdownService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  async ngOnChanges() {
    const parsed = await this.markdownService.parse(this.data, {
      katex: true,
      disableSanitizer: true, // DOMPurify below is the gate instead
      decodeHtml: false,
      inline: false,
      emoji: false,
      mermaid: false,
    });
    this.host.nativeElement.innerHTML = sanitizeMathHtml(parsed);
  }
}
