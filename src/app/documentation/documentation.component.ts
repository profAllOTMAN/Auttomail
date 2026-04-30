import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './documentation.component.html',
  styles: [`
    .doc-section { scroll-margin-top: 80px; }
    .code-block {
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
    }
    .code-block .token-tag { color: #7dd3fc; }
    .code-block .token-attr { color: #c4b5fd; }
    .code-block .token-string { color: #86efac; }
    .code-block .token-comment { color: #64748b; }
    .swatch { width: 48px; height: 48px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); }

    @media print {
      aside, .doc-export-toolbar { display: none !important; }
      main { overflow: visible !important; }
      section { page-break-inside: avoid; break-inside: avoid; }
      h2 { page-break-after: avoid; break-after: avoid; }
      .doc-section { scroll-margin-top: 0; }
      body { background: white !important; }
    }
  `]
})
export class DocumentationComponent {
  @ViewChild('docContent', { static: false }) docContent?: ElementRef<HTMLElement>;

  activeSection = signal<string>('overview');
  exportMenuOpen = signal<boolean>(false);

  sections = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'colors', label: 'Colors', icon: 'palette' },
    { id: 'typography', label: 'Typography', icon: 'text_fields' },
    { id: 'buttons', label: 'Buttons', icon: 'smart_button' },
    { id: 'inputs', label: 'Inputs & Forms', icon: 'text_format' },
    { id: 'cards', label: 'Cards', icon: 'dashboard' },
    { id: 'app-components', label: 'App Components', icon: 'widgets' },
    { id: 'badges', label: 'Badges & Status', icon: 'label' },
    { id: 'modals', label: 'Modals & Drawers', icon: 'web_asset' },
    { id: 'icons', label: 'Icons', icon: 'emoji_symbols' },
    { id: 'nav', label: 'Navigation', icon: 'menu' },
    { id: 'kpi', label: 'KPI Cards', icon: 'analytics' },
    { id: 'tables', label: 'Tables & Lists', icon: 'table_rows' },
    { id: 'chat', label: 'Chat Agent', icon: 'smart_toy' },
    { id: 'spacing', label: 'Spacing & Layout', icon: 'grid_on' },
    { id: 'migration', label: 'Old vs New Design', icon: 'compare' },
  ];

  scrollTo(id: string) {
    this.activeSection.set(id);
    document.getElementById('doc-' + id)?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleExportMenu() {
    this.exportMenuOpen.update(v => !v);
  }

  exportPdf() {
    this.exportMenuOpen.set(false);
    // Native browser print — user chooses "Save as PDF"
    window.print();
  }

  exportDocx() {
    this.exportMenuOpen.set(false);
    const root = this.docContent?.nativeElement;
    if (!root) return;
    const htmlBody = this.cleanHtmlForExport(root);
    const docHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Automai Watcher — Documentation</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
  h1 { font-size: 22pt; color: #335A85; margin-top: 24pt; }
  h2 { font-size: 16pt; color: #335A85; margin-top: 18pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt; }
  h3 { font-size: 12pt; color: #475569; margin-top: 12pt; }
  h4 { font-size: 11pt; color: #475569; }
  p { line-height: 1.6; margin: 6pt 0; }
  code { font-family: Consolas, monospace; background: #f1f5f9; padding: 1pt 4pt; border-radius: 3pt; font-size: 10pt; }
  pre { background: #1e293b; color: #e2e8f0; padding: 10pt; font-family: Consolas, monospace; font-size: 10pt; }
  ul, ol { margin: 6pt 0 6pt 20pt; }
  li { margin: 3pt 0; }
  table { border-collapse: collapse; margin: 8pt 0; }
  th, td { border: 1px solid #cbd5e1; padding: 6pt 10pt; font-size: 10pt; }
  th { background: #f1f5f9; font-weight: bold; }
  .screenshot-placeholder { border: 2px dashed #94a3b8; padding: 16pt; text-align: center; color: #64748b; margin: 10pt 0; }
</style>
</head>
<body>
<h1>Automai Watcher — Design System Documentation</h1>
<p><em>Exported ${new Date().toLocaleDateString()}</em></p>
${htmlBody}
</body>
</html>`;
    this.downloadBlob(docHtml, 'automai-watcher-docs.doc', 'application/msword');
  }

  exportMarkdown() {
    this.exportMenuOpen.set(false);
    const root = this.docContent?.nativeElement;
    if (!root) return;
    const md = `# Automai Watcher — Design System Documentation\n\n_Exported ${new Date().toLocaleDateString()}_\n\n` +
      this.htmlToMarkdown(root);
    this.downloadBlob(md, 'automai-watcher-docs.md', 'text/markdown;charset=utf-8');
  }

  private downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  // Strip Tailwind utility noise; keep semantic HTML for Word
  private cleanHtmlForExport(root: HTMLElement): string {
    const clone = root.cloneNode(true) as HTMLElement;
    // Replace color swatches with a text note since Word won't show utility classes
    clone.querySelectorAll('.swatch').forEach(el => {
      const next = el.nextElementSibling;
      const hex = next?.querySelector?.('.font-mono')?.textContent?.trim() || '';
      el.replaceWith(`[color swatch ${hex}]`);
    });
    // Drop icon spans
    clone.querySelectorAll('.material-symbols-outlined').forEach(el => el.remove());
    // Insert placeholders where screenshots would fit (after each h2)
    clone.querySelectorAll('h2').forEach(h => {
      const p = document.createElement('p');
      p.className = 'screenshot-placeholder';
      p.textContent = '📷 Add screenshot here';
      h.parentElement?.insertBefore(p, h.nextSibling);
    });
    return clone.innerHTML;
  }

  // Minimal HTML → Markdown converter focused on the tags this doc uses
  private htmlToMarkdown(root: HTMLElement): string {
    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent || '').replace(/\s+/g, ' ');
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Skip decorative / icon nodes
      if (el.classList.contains('material-symbols-outlined')) return '';
      if (el.classList.contains('swatch')) {
        const hex = el.parentElement?.querySelector('.font-mono')?.textContent?.trim() || '';
        return `![swatch](color:${hex})`;
      }

      const children = () => Array.from(el.childNodes).map(walk).join('').trim();

      switch (tag) {
        case 'section': {
          const id = el.id?.replace(/^doc-/, '') || '';
          return `\n\n<!-- section:${id} -->\n\n> 📷 _Add screenshot here_\n\n${children()}\n\n`;
        }
        case 'h1': return `\n\n# ${children()}\n\n`;
        case 'h2': return `\n\n## ${children()}\n\n`;
        case 'h3': return `\n\n### ${children()}\n\n`;
        case 'h4': return `\n\n#### ${children()}\n\n`;
        case 'p': return `\n\n${children()}\n\n`;
        case 'br': return '\n';
        case 'hr': return '\n\n---\n\n';
        case 'strong': case 'b': return `**${children()}**`;
        case 'em': case 'i': return `*${children()}*`;
        case 'code': {
          const isBlock = el.closest('pre') !== null;
          return isBlock ? children() : `\`${children()}\``;
        }
        case 'pre': {
          return `\n\n\`\`\`\n${(el.textContent || '').trim()}\n\`\`\`\n\n`;
        }
        case 'ul': {
          return '\n\n' + Array.from(el.children).filter(c => c.tagName === 'LI')
            .map(li => `- ${walk(li).trim().replace(/\n+/g, ' ')}`).join('\n') + '\n\n';
        }
        case 'ol': {
          return '\n\n' + Array.from(el.children).filter(c => c.tagName === 'LI')
            .map((li, i) => `${i + 1}. ${walk(li).trim().replace(/\n+/g, ' ')}`).join('\n') + '\n\n';
        }
        case 'li': return children();
        case 'a': {
          const href = el.getAttribute('href') || '';
          return href ? `[${children()}](${href})` : children();
        }
        case 'table': {
          const rows = Array.from(el.querySelectorAll('tr'));
          if (!rows.length) return '';
          const cells = (row: Element) =>
            Array.from(row.querySelectorAll('th, td')).map(c => (c.textContent || '').trim().replace(/\|/g, '\\|'));
          const header = cells(rows[0]);
          const body = rows.slice(1).map(cells);
          if (!header.length) return '';
          let out = '\n\n| ' + header.join(' | ') + ' |\n';
          out += '| ' + header.map(() => '---').join(' | ') + ' |\n';
          for (const r of body) out += '| ' + r.join(' | ') + ' |\n';
          return out + '\n';
        }
        default:
          return children();
      }
    };
    return walk(root)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
