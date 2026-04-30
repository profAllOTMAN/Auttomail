import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-documentation2',
  imports: [CommonModule],
  templateUrl: './documentation2.component.html',
})
export class Documentation2Component {
  private router = inject(Router);

  activeSection = signal<string>('overview');

  sections = [
    { id: 'overview', label: 'Overview', icon: 'menu_book' },
    { id: 'onboarding', label: 'Onboarding (3-step wizard)', icon: 'rocket_launch' },
    { id: 'pm-page', label: 'Process Monitor — Page', icon: 'monitoring' },
    { id: 'pm-wizard', label: 'Process Monitor — Wizard (7 steps)', icon: 'edit_document' },
    { id: 'pm-edit', label: 'Process Monitor — Edit drawer', icon: 'edit' },
    { id: 'rwatcher-page', label: 'rWatcher — Page', icon: 'desktop_windows' },
    { id: 'rwatcher-drawer', label: 'rWatcher — Add drawer', icon: 'add_box' },
    { id: 'schedule-page', label: 'Schedule — Page', icon: 'calendar_month' },
    { id: 'schedule-drawer', label: 'Schedule — Add drawer', icon: 'event_note' },
    { id: 'schedule-priority', label: 'Schedule — Priority drag', icon: 'drag_indicator' },
    { id: 'reports-page', label: 'Reports — Page', icon: 'analytics' },
    { id: 'reports-drawer', label: 'Reports — Create drawer', icon: 'description' },
    { id: 'help-center', label: 'Help Center', icon: 'help' },
    { id: 'smart-add', label: 'Smart Add Process (chat)', icon: 'smart_toy' },
    { id: 'live-monitor', label: 'Live Test Monitor', icon: 'speed' },
    { id: 'product-switcher', label: 'Product Switcher', icon: 'swap_horiz' },
  ];

  scrollTo(id: string) {
    this.activeSection.set(id);
    document.getElementById('doc2-' + id)?.scrollIntoView({ behavior: 'smooth' });
  }

  back() {
    this.router.navigate(['/help']);
  }
}
