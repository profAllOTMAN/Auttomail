import {Routes} from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', data: { tab: 'dashboard' }, children: [] },
  { path: 'process-monitors', data: { tab: 'process-monitor' }, children: [] },
  { path: 'rwatchers', data: { tab: 'rwatchers' }, children: [] },
  { path: 'schedules', data: { tab: 'schedules' }, children: [] },
  { path: 'projects', data: { tab: 'projects' }, children: [] },
  { path: 'reports', data: { tab: 'reports' }, children: [] },
  { path: 'help/new', data: { tab: 'help-new' }, children: [] },
  { path: 'help/new2', data: { tab: 'help-new2' }, children: [] },
  { path: 'help/new3', data: { tab: 'help-new3' }, children: [] },
  { path: 'help', data: { tab: 'help' }, children: [] },
  { path: '**', redirectTo: 'dashboard' }
];
