import { Component, signal } from '@angular/core';
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
  `]
})
export class DocumentationComponent {
  activeSection = signal<string>('overview');

  sections = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'colors', label: 'Colors', icon: 'palette' },
    { id: 'typography', label: 'Typography', icon: 'text_fields' },
    { id: 'buttons', label: 'Buttons', icon: 'smart_button' },
    { id: 'inputs', label: 'Inputs & Forms', icon: 'text_format' },
    { id: 'cards', label: 'Cards', icon: 'dashboard' },
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
}
