import {ChangeDetectionStrategy, Component, signal, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, NavigationEnd, RouterLink} from '@angular/router';
import {filter} from 'rxjs/operators';
import {AddWatcherDrawerComponent} from './drawers/add-watcher.component';
import {AddScheduleDrawerComponent} from './drawers/add-schedule.component';
import {CreateProcessMonitorDrawerComponent} from './drawers/create-process-monitor.component';
import {DocumentationComponent} from './documentation/documentation.component';
import {Documentation2Component} from './documentation/documentation2.component';

export interface SubProcess {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration?: string;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration?: string;
  message?: string;
}

export interface ProcessMonitor {
  id: string;
  name: string;
  status: 'running' | 'pending' | 'disabled';
  lastRun: string;
  successRate: string;
  resources: string;
  message?: string;
  scenarioAssigned?: string;
  projectLinked?: string;
  assignedRWatcherIds?: string[];
  scheduleId?: string;
  subProcesses?: SubProcess[];
}

export interface Schedule {
  id: string;
  name: string;
  timezone: string;
  lastRun: string;
  nextRun: string;
  status: 'active' | 'deactivated';
  cadence: string;
  processOrder: string[]; // ProcessMonitor ids in execution priority (first → last)
}

export interface RWatcher {
  id: string;
  alias: string;
  description: string;
  status: 'online' | 'offline' | 'busy';
  ipAddress: string;
  lastPing: string;
  botManager: string;
  resolution: string;
  colorDepth: string;
  username: string;
  domain: string;
  assignedMonitors: number;
  uptime: string;
  totalChecks?: number;
  successCount?: number;
  failureCount?: number;
  avgResponseTime?: string;
  trendData?: number[];
  screenUrl?: string;
  groups?: string[];
}

export interface Notification {
  id: string;
  type: 'success' | 'failure' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  processName?: string;
}

export interface LatestUpdate {
  id: string;
  type: 'success' | 'failure' | 'executed';
  title: string;
  detail: string;
  timestamp: string;
  icon: string;
}

export interface TestRun {
  id: string;
  name: string;
  project: string;
  status: 'running' | 'queued' | 'completed' | 'failed' | 'disabled';
  rLoadersActive: number;
  rLoadersTotal: number;
  vUsers: number;
  duration: string;
  elapsed: string;
  progress: number; // 0..100
  responseTime: number; // ms
  successRate: number; // 0..100
  iterations: number;
  errors: number;
  startedAt: string;
  processes: string[];
}

export interface TestPlan {
  id: string;            // human ID e.g. AL-4857
  name: string;
  description: string;
  project: string;
  modifiedDate: string;
  modifiedBy: string;
  active: boolean;       // toggle
}

export interface Report {
  id: string;
  type: 'summary' | 'raw' | 'transaction';
  name: string;
  fileName: string;
  outputPath: string;
  processMonitorIds: string[];
  emails: string;
  scheduled: boolean;
  duration: string;
  timeInterval?: string;
  separator?: string;
}

export interface BotManager {
  id: string;
  name: string;
  status: 'connected' | 'available' | 'busy' | 'offline';
  launcher: string;
  hostname: string;
  rdpAccess: string;
  rLoaderGroup: string;
  connectedRLoaders: number;
  availableRLoaders: number;
  index: number;
  lastStatusMessage: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterLink,
    AddWatcherDrawerComponent,
    AddScheduleDrawerComponent,
    CreateProcessMonitorDrawerComponent,
    DocumentationComponent,
    Documentation2Component
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  constructor(private router: Router) {}
  activeDrawer = signal<'watcher' | 'schedule' | 'monitor' | null>(null);
  drawerMode = signal<'onboarding' | 'standalone'>('standalone');
  completedSteps = signal<string[]>(['notifications', 'watcher', 'schedule', 'monitor']);
  activeTab = signal<string>('dashboard');

  // Product switcher
  appMode = signal<'watcher' | 'loader'>('watcher');
  productSwitcherOpen = signal<boolean>(false);

  readonly products: readonly {
    id: 'watcher' | 'loader' | 'worker' | 'tester';
    label: string;
    icon: string;
    description: string;
    available: boolean;
  }[] = [
    { id: 'watcher', label: 'Watcher', icon: 'visibility', description: 'Process monitoring & rWatcher agents', available: true },
    { id: 'loader',  label: 'Loader',  icon: 'speed',      description: 'Load testing with rLoader desktops', available: true },
    { id: 'worker',  label: 'Worker',  icon: 'precision_manufacturing', description: 'Background job orchestration', available: false },
    { id: 'tester',  label: 'Tester',  icon: 'science',    description: 'End-to-end test automation', available: false }
  ];

  currentProduct() {
    return this.products.find(p => p.id === this.appMode()) ?? this.products[0];
  }

  toggleProductSwitcher() {
    this.productSwitcherOpen.update(v => !v);
  }
  closeProductSwitcher() {
    this.productSwitcherOpen.set(false);
  }

  selectProduct(id: 'watcher' | 'loader' | 'worker' | 'tester') {
    const product = this.products.find(p => p.id === id);
    if (!product || !product.available) return;
    this.closeProductSwitcher();
    if (id !== 'watcher' && id !== 'loader') return;
    if (this.appMode() === id) return;
    this.appMode.set(id);
    if (id === 'loader') {
      this.navigate('/test-runs');
    } else {
      this.navigate('/dashboard');
    }
  }

  setAppMode(mode: 'watcher' | 'loader') {
    this.selectProduct(mode);
  }

  ngOnInit() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      const url = e.urlAfterRedirects;
      // Check for multi-segment paths first
      if (url.startsWith('/help/documentation2')) {
        this.activeTab.set('help-documentation2');
        return;
      }
      if (url.startsWith('/help/new4')) {
        this.activeTab.set('help-new4');
        return;
      }
      if (url.startsWith('/help/new3')) {
        this.activeTab.set('help-new3');
        return;
      }
      if (url.startsWith('/help/new')) {
        this.activeTab.set('help-new');
        return;
      }
      const path = url.split('/')[1]?.split('?')[0] || 'dashboard';
      const tabMap: Record<string, string> = {
        'dashboard': 'dashboard',
        'process-monitors': 'process-monitor',
        'rwatchers': 'rwatchers',
        'schedules': 'schedules',
        'projects': 'projects',
        'reports': 'reports',
        'test-plans': 'test-plans',
        'test-runs': 'test-runs',
        'botmanagers': 'botmanagers',
        'help': 'help',
        'documentation': 'documentation'
      };
      const nextTab = tabMap[path] || 'dashboard';
      this.activeTab.set(nextTab);
      // Auto-sync mode only for tabs exclusive to one environment.
      // dashboard / schedules / projects / help exist in both — leave mode alone.
      if (['test-plans', 'test-runs', 'botmanagers'].includes(nextTab)) {
        this.appMode.set('loader');
      } else if (['process-monitor', 'reports', 'rwatchers'].includes(nextTab)) {
        this.appMode.set('watcher');
      }
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
  showNotifications = signal<boolean>(false);
  tourSkipped = signal<boolean>(true);
  editingMonitorId = signal<string | null>(null);
  monitorToDelete = signal<string | null>(null);
  seeItRunChecked = signal<boolean>(false);
  exportReportsChecked = signal<boolean>(false);
  onboardingDismissed = signal<boolean>(true);
  card2Steps = signal<string[]>([]);
  card3Steps = signal<string[]>([]);
  selectedMonitorId = signal<string | null>(null);
  selectedHelpCard = signal<'process' | 'rwatchers' | 'calendar' | 'reports' | 'notifications' | null>('process');
  installSteps = signal<string[]>(['download', 'login', 'botmanager', 'record']);

  allStepsComplete() {
    return this.completedSteps().includes('monitor') && this.seeItRunChecked();
  }

  card1CompletedCount() {
    let count = 4; // Download, Login, BotManager, Record — always pre-done
    if (this.completedSteps().includes('notifications')) count++;
    if (this.completedSteps().includes('watcher')) count++;
    if (this.completedSteps().includes('schedule')) count++;
    if (this.completedSteps().includes('monitor')) count++;
    if (this.seeItRunChecked()) count++;
    return count;
  }

  card2CompletedCount() {
    const prereq = (this.card2Steps().includes('prereq') || this.completedSteps().includes('monitor')) ? 1 : 0;
    const steps = ['threshold', 'recipients', 'test', 'history'].filter(s => this.card2Steps().includes(s)).length;
    return prereq + steps;
  }

  toggleCard2Step(step: string) {
    this.card2Steps.update(steps =>
      steps.includes(step) ? steps.filter(s => s !== step) : [...steps, step]
    );
  }

  toggleCard3Step(step: string) {
    this.card3Steps.update(steps =>
      steps.includes(step) ? steps.filter(s => s !== step) : [...steps, step]
    );
  }

  monitors = signal<ProcessMonitor[]>(this.getDemoMonitors());

  // --- Test Runs (Loader mode) ---
  testRuns = signal<TestRun[]>(this.getDemoTestRuns());
  testRunsSearch = signal<string>('');
  testRunsStatusFilter = signal<'all' | 'running' | 'queued' | 'completed' | 'failed' | 'disabled'>('all');

  filteredTestRuns() {
    const search = this.testRunsSearch().toLowerCase();
    const statusFilter = this.testRunsStatusFilter();
    return this.testRuns().filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!search) return true;
      return t.name.toLowerCase().includes(search) || t.project.toLowerCase().includes(search);
    });
  }

  testRunsCountByStatus(status: TestRun['status']) {
    return this.testRuns().filter(t => t.status === status).length;
  }

  totalActiveRLoaders() {
    return this.testRuns()
      .filter(t => t.status === 'running')
      .reduce((sum, t) => sum + t.rLoadersActive, 0);
  }

  avgResponseTime() {
    const active = this.testRuns().filter(t => t.status === 'running' || t.status === 'completed');
    if (!active.length) return 0;
    return Math.round(active.reduce((sum, t) => sum + t.responseTime, 0) / active.length);
  }

  totalVUsersRunning() {
    return this.testRuns()
      .filter(t => t.status === 'running')
      .reduce((sum, t) => sum + t.vUsers, 0);
  }

  avgSuccessRate() {
    const arr = this.testRuns().filter(t => t.status === 'completed' || t.status === 'running');
    if (!arr.length) return 0;
    return Math.round(arr.reduce((sum, t) => sum + t.successRate, 0) / arr.length);
  }

  totalErrorsToday() {
    return this.testRuns().reduce((sum, t) => sum + t.errors, 0);
  }

  runTestRun(id: string) {
    this.testRuns.update(runs => runs.map(r =>
      r.id === id ? { ...r, status: 'running' as const, progress: 1, elapsed: '00:00:05' } : r
    ));
  }

  stopTestRun(id: string) {
    this.testRuns.update(runs => runs.map(r =>
      r.id === id ? { ...r, status: 'completed' as const, progress: 100 } : r
    ));
  }

  toggleTestRunDisabled(id: string) {
    this.testRuns.update(runs => runs.map(r => {
      if (r.id !== id) return r;
      if (r.status === 'disabled') return { ...r, status: 'queued' as const };
      return { ...r, status: 'disabled' as const };
    }));
  }

  retryTestRun(id: string) {
    this.testRuns.update(runs => runs.map(r =>
      r.id === id ? { ...r, status: 'queued' as const, progress: 0, elapsed: '00:00:00', errors: 0 } : r
    ));
  }

  testRunStatusColor(status: TestRun['status']): string {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'queued': return 'bg-amber-100 text-amber-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'disabled': return 'bg-slate-200 text-slate-600';
    }
  }

  testRunStatusIcon(status: TestRun['status']): string {
    switch (status) {
      case 'running': return 'play_circle';
      case 'queued': return 'schedule';
      case 'completed': return 'check_circle';
      case 'failed': return 'error';
      case 'disabled': return 'pause_circle';
    }
  }

  getDemoTestRuns(): TestRun[] {
    return [
      {
        id: 'tr-1',
        name: 'Peak Hour Login Load',
        project: 'Customer Portal',
        status: 'running',
        rLoadersActive: 8,
        rLoadersTotal: 10,
        vUsers: 240,
        duration: '30m',
        elapsed: '00:12:48',
        progress: 42,
        responseTime: 285,
        successRate: 98,
        iterations: 1420,
        errors: 12,
        startedAt: '12 min ago',
        processes: ['Login Flow', 'Dashboard Load']
      },
      {
        id: 'tr-2',
        name: 'Checkout Stress Test',
        project: 'E-Commerce',
        status: 'running',
        rLoadersActive: 5,
        rLoadersTotal: 5,
        vUsers: 150,
        duration: '45m',
        elapsed: '00:28:03',
        progress: 62,
        responseTime: 412,
        successRate: 94,
        iterations: 2180,
        errors: 48,
        startedAt: '28 min ago',
        processes: ['Add to Cart', 'Checkout', 'Payment']
      },
      {
        id: 'tr-3',
        name: 'Nightly Regression',
        project: 'Core Banking',
        status: 'queued',
        rLoadersActive: 0,
        rLoadersTotal: 4,
        vUsers: 100,
        duration: '60m',
        elapsed: '00:00:00',
        progress: 0,
        responseTime: 0,
        successRate: 0,
        iterations: 0,
        errors: 0,
        startedAt: 'Scheduled for 02:00',
        processes: ['Account Open', 'Transfer', 'Statement']
      },
      {
        id: 'tr-4',
        name: 'API Smoke Test',
        project: 'Integrations',
        status: 'completed',
        rLoadersActive: 0,
        rLoadersTotal: 2,
        vUsers: 50,
        duration: '10m',
        elapsed: '00:10:00',
        progress: 100,
        responseTime: 148,
        successRate: 100,
        iterations: 500,
        errors: 0,
        startedAt: '2h ago',
        processes: ['Health Check', 'Auth API']
      },
      {
        id: 'tr-5',
        name: 'Report Generation Load',
        project: 'Analytics',
        status: 'failed',
        rLoadersActive: 0,
        rLoadersTotal: 6,
        vUsers: 120,
        duration: '20m',
        elapsed: '00:07:21',
        progress: 36,
        responseTime: 892,
        successRate: 42,
        iterations: 320,
        errors: 186,
        startedAt: '4h ago',
        processes: ['Generate PDF', 'Export CSV']
      },
      {
        id: 'tr-6',
        name: 'Search Endurance 8h',
        project: 'Marketplace',
        status: 'disabled',
        rLoadersActive: 0,
        rLoadersTotal: 3,
        vUsers: 80,
        duration: '8h',
        elapsed: '00:00:00',
        progress: 0,
        responseTime: 0,
        successRate: 0,
        iterations: 0,
        errors: 0,
        startedAt: 'Last run 3d ago',
        processes: ['Search Query', 'Filter Results']
      }
    ];
  }

  // --- Test Plans (Loader mode) ---
  testPlans = signal<TestPlan[]>([
    { id: 'AL-4857', name: 'test$', description: '', project: 'myproject', modifiedDate: '2026-04-29 01:15', modifiedBy: 'admin', active: true },
    { id: 'AL-4917', name: 'test22', description: 'Spike test for checkout', project: 'myproject', modifiedDate: '2026-04-29 00:50', modifiedBy: 'admin', active: true },
    { id: 'AL-5284', name: 'test', description: 'Baseline regression run', project: 'myproject', modifiedDate: '2026-04-29 00:41', modifiedBy: 'admin', active: true }
  ]);
  testPlanSearch = signal<string>('');
  filteredTestPlans() {
    const q = this.testPlanSearch().toLowerCase();
    if (!q) return this.testPlans();
    return this.testPlans().filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.project.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }
  toggleTestPlanActive(id: string) {
    this.testPlans.update(list => list.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }
  deleteTestPlan(id: string) {
    this.testPlans.update(list => list.filter(p => p.id !== id));
  }
  runTestPlan(id: string) {
    const plan = this.testPlans().find(p => p.id === id);
    if (!plan) return;
    const newId = 'tr-' + Date.now();
    this.testRuns.update(runs => [{
      id: newId,
      name: plan.name,
      project: plan.project,
      status: 'running',
      rLoadersActive: 1,
      rLoadersTotal: 5,
      vUsers: 5,
      duration: '15m',
      elapsed: '00:00:05',
      progress: 1,
      responseTime: 0,
      successRate: 100,
      iterations: 0,
      errors: 0,
      startedAt: 'Just now',
      processes: ['notepad']
    }, ...runs]);
  }

  // --- Reports (Watcher mode) ---
  reports = signal<Report[]>([
    {
      id: 'rep-1', type: 'summary', name: 'REP', fileName: 'rep', outputPath: 'c:\\automai',
      processMonitorIds: ['1'], emails: '', scheduled: false, duration: 'Previous hour'
    },
    {
      id: 'rep-2', type: 'summary', name: 'rp', fileName: 'rp', outputPath: 'c:\\automai',
      processMonitorIds: ['2'], emails: '', scheduled: false, duration: 'Previous hour'
    },
    {
      id: 'rep-3', type: 'summary', name: 'myreport', fileName: 'report', outputPath: 'c:\\automai',
      processMonitorIds: ['1'], emails: 'bmusinyan@automai.com', scheduled: true,
      duration: 'Today', timeInterval: 'Today', separator: 'Comma'
    }
  ]);

  reportDrawerType = signal<'summary' | 'raw' | 'transaction' | null>(null);
  editingReportId = signal<string | null>(null);

  // form fields
  reportFormName = signal<string>('');
  reportFormFileName = signal<string>('');
  reportFormPath = signal<string>('');
  reportFormMonitors = signal<string[]>([]);
  reportFormScheduled = signal<boolean>(false);
  reportFormEmail = signal<string>('');
  reportFormDuration = signal<string>('Previous hour');
  reportFormInterval = signal<string>('Today');
  reportFormSeparator = signal<string>('Comma');

  openCreateReport(type: 'summary' | 'raw' | 'transaction') {
    this.editingReportId.set(null);
    this.reportDrawerType.set(type);
    this.reportFormName.set('');
    this.reportFormFileName.set('');
    this.reportFormPath.set('');
    this.reportFormMonitors.set([]);
    this.reportFormScheduled.set(false);
    this.reportFormEmail.set('');
    this.reportFormDuration.set('Previous hour');
    this.reportFormInterval.set('Today');
    this.reportFormSeparator.set('Comma');
  }

  openEditReport(id: string) {
    const r = this.reports().find(x => x.id === id);
    if (!r) return;
    this.editingReportId.set(id);
    this.reportDrawerType.set(r.type);
    this.reportFormName.set(r.name);
    this.reportFormFileName.set(r.fileName);
    this.reportFormPath.set(r.outputPath);
    this.reportFormMonitors.set([...r.processMonitorIds]);
    this.reportFormScheduled.set(r.scheduled);
    this.reportFormEmail.set(r.emails);
    this.reportFormDuration.set(r.duration);
    this.reportFormInterval.set(r.timeInterval ?? 'Today');
    this.reportFormSeparator.set(r.separator ?? 'Comma');
  }

  closeReportDrawer() {
    this.reportDrawerType.set(null);
    this.editingReportId.set(null);
  }

  toggleReportFormMonitor(id: string) {
    this.reportFormMonitors.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  saveReport() {
    const type = this.reportDrawerType();
    if (!type) return;
    const editId = this.editingReportId();
    const payload: Report = {
      id: editId ?? ('rep-' + Date.now()),
      type,
      name: this.reportFormName() || 'Untitled',
      fileName: this.reportFormFileName() || 'report',
      outputPath: this.reportFormPath() || 'c:\\automai',
      processMonitorIds: this.reportFormMonitors(),
      emails: this.reportFormEmail(),
      scheduled: this.reportFormScheduled(),
      duration: this.reportFormDuration(),
      timeInterval: this.reportFormScheduled() ? this.reportFormInterval() : undefined,
      separator: this.reportFormScheduled() ? this.reportFormSeparator() : undefined
    };
    this.reports.update(list =>
      editId ? list.map(r => r.id === editId ? payload : r) : [...list, payload]
    );
    this.closeReportDrawer();
  }

  deleteReport(id: string) {
    this.reports.update(list => list.filter(r => r.id !== id));
  }

  runReport(id: string) {
    // Stub: in prod this would trigger the export pipeline
    const r = this.reports().find(x => x.id === id);
    if (r) console.log('Run report:', r.name);
  }

  downloadReport(id: string) {
    const r = this.reports().find(x => x.id === id);
    if (r) console.log('Download report:', r.name);
  }

  reportProcessMonitorNames(report: Report) {
    return report.processMonitorIds
      .map(pmId => this.monitors().find(m => m.id === pmId)?.name)
      .filter((n): n is string => !!n)
      .join(', ');
  }

  monitorById(id: string): ProcessMonitor | undefined {
    return this.monitors().find(m => m.id === id);
  }

  // Shared kebab-menu open state (scoped by composite id e.g. 'watcher:1')
  openKebabId = signal<string | null>(null);
  toggleKebab(id: string) {
    this.openKebabId.update(c => c === id ? null : id);
  }
  closeKebab() {
    this.openKebabId.set(null);
  }

  // Drag-to-reorder (Schedule processes)
  scheduleDragSourceId = signal<string | null>(null);
  scheduleDragOverId = signal<string | null>(null);
  scheduleDragScheduleId = signal<string | null>(null);
  onScheduleDragStart(scheduleId: string, monitorId: string) {
    this.scheduleDragScheduleId.set(scheduleId);
    this.scheduleDragSourceId.set(monitorId);
  }
  onScheduleDragOver(monitorId: string) {
    if (this.scheduleDragOverId() !== monitorId) {
      this.scheduleDragOverId.set(monitorId);
    }
  }
  onScheduleDragEnd() {
    this.scheduleDragSourceId.set(null);
    this.scheduleDragOverId.set(null);
    this.scheduleDragScheduleId.set(null);
  }
  onScheduleDrop(scheduleId: string, targetMonitorId: string) {
    const sourceId = this.scheduleDragSourceId();
    if (!sourceId || sourceId === targetMonitorId) {
      this.onScheduleDragEnd();
      return;
    }
    this.schedules.update(list => list.map(s => {
      if (s.id !== scheduleId) return s;
      const order = [...s.processOrder];
      const fromIdx = order.indexOf(sourceId);
      const toIdx = order.indexOf(targetMonitorId);
      if (fromIdx === -1 || toIdx === -1) return s;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, sourceId);
      return { ...s, processOrder: order };
    }));
    this.onScheduleDragEnd();
  }

  reportTypeLabel(t: Report['type']) {
    return t === 'summary' ? 'SUMMARY' : t === 'raw' ? 'RAW DATA' : 'TRANSACTION';
  }

  // --- BotManagers (Loader mode) ---
  botManagers = signal<BotManager[]>([
    { id: 'bm-1', name: 'BotManager-1', status: 'connected', launcher: 'rLoader Desktop Manager', hostname: 'BM-NYC-01', rdpAccess: '10.0.1.20:3389', rLoaderGroup: 'Production', connectedRLoaders: 5, availableRLoaders: 3, index: 1, lastStatusMessage: '5 rLoaders ready' },
    { id: 'bm-2', name: 'BotManager-2', status: 'busy', launcher: 'rLoader Desktop Manager', hostname: 'BM-LON-01', rdpAccess: '10.0.2.20:3389', rLoaderGroup: 'EU', connectedRLoaders: 4, availableRLoaders: 0, index: 2, lastStatusMessage: 'Running test AL-4917' },
    { id: 'bm-3', name: 'BotManager-3', status: 'available', launcher: 'rLoader Desktop Manager', hostname: 'BM-SF-01', rdpAccess: '10.0.3.20:3389', rLoaderGroup: 'QA', connectedRLoaders: 2, availableRLoaders: 2, index: 3, lastStatusMessage: 'Idle' },
    { id: 'bm-4', name: 'BotManager-4', status: 'offline', launcher: 'rLoader Desktop Manager', hostname: 'BM-TYO-01', rdpAccess: '10.0.4.20:3389', rLoaderGroup: 'APAC', connectedRLoaders: 0, availableRLoaders: 0, index: 4, lastStatusMessage: 'Last seen 2h ago' }
  ]);
  botManagerSearch = signal<string>('');
  botManagerStatusFilter = signal<'all' | 'connected' | 'available' | 'busy' | 'offline'>('all');
  filteredBotManagers() {
    const q = this.botManagerSearch().toLowerCase();
    const sf = this.botManagerStatusFilter();
    return this.botManagers().filter(b => {
      if (sf !== 'all' && b.status !== sf) return false;
      if (!q) return true;
      return b.name.toLowerCase().includes(q) ||
        b.hostname.toLowerCase().includes(q) ||
        b.rLoaderGroup.toLowerCase().includes(q);
    });
  }
  totalConnectedRLoaders() {
    return this.botManagers().reduce((s, b) => s + b.connectedRLoaders, 0);
  }
  totalAvailableRLoaders() {
    return this.botManagers().reduce((s, b) => s + b.availableRLoaders, 0);
  }
  startRLoaderDesktops(id: string) {
    this.botManagers.update(list => list.map(b => b.id === id ? { ...b, status: 'connected', connectedRLoaders: 5, availableRLoaders: 5, lastStatusMessage: '5 rLoaders started' } : b));
  }
  botManagerStatusColor(s: BotManager['status']) {
    switch (s) {
      case 'connected': return 'bg-emerald-100 text-emerald-700';
      case 'available': return 'bg-blue-100 text-blue-700';
      case 'busy': return 'bg-amber-100 text-amber-700';
      case 'offline': return 'bg-slate-200 text-slate-600';
    }
  }
  onlineBotManagerCount() {
    return this.botManagers().filter(b => b.status !== 'offline').length;
  }
  loaderStartRLoaders() {
    this.botManagers.update(list => list.map(b =>
      b.status === 'offline' ? b : { ...b, status: 'connected', connectedRLoaders: 5, availableRLoaders: 5, lastStatusMessage: '5 rLoaders started' }
    ));
  }

  // --- Loader Dashboard signals ---
  selectedDashboardPlan = signal<string>('test');
  selectedDashboardRun = signal<string>('#2 at 03/13/26 12:55 AM');
  selectedDashboardProject = signal<string>('myproject');
  selectedDashboardCycle = signal<string>('Default');
  dashboardShowMixed = signal<boolean>(true);

  dashboardKpis() {
    return {
      startDate: '03/13/26 12:55 AM',
      endDate: '03/13/26 12:58 AM',
      duration: '00:03:00',
      success: '8 (100%)',
      failure: '0 (0%)',
      failureCount: 0,
      rampUpEnd: '03/13/26 12:56 AM',
      rampDown: '03/13/26 12:58 AM',
      rampUpDuration: '00:00:09',
      maxUsers: 1,
      usersPerMinute: 1,
      steadyState: '00:01:00'
    };
  }

  dashboardProcessSearch = signal<string>('');

  filteredDashboardMonitors() {
    const search = this.dashboardProcessSearch().toLowerCase();
    if (!search) return this.monitors();
    return this.monitors().filter(m =>
      m.name.toLowerCase().includes(search) ||
      (m.scenarioAssigned?.toLowerCase().includes(search) ?? false)
    );
  }

  // Expanded watcher in dashboard drill-down (shows scenario/sub-process/transactions)
  expandedDashboardWatcher = signal<string | null>(null);

  toggleDashboardWatcher(id: string) {
    this.expandedDashboardWatcher.update(current => current === id ? null : id);
  }

  // Combined timeline: updates + alerts merged and sorted
  timelineFeed() {
    const updates = this.latestUpdates().map(u => ({
      id: 'u-' + u.id,
      badge: 'update' as const,
      icon: u.icon,
      title: u.title,
      detail: u.detail,
      timestamp: u.timestamp,
      type: u.type,
      processName: undefined as string | undefined
    }));
    const alerts = this.dashboardNotifications().map(n => ({
      id: 'a-' + n.id,
      badge: (n.type === 'warning' ? 'warning' : 'alert') as 'warning' | 'alert',
      icon: n.type === 'failure' ? 'error' : (n.type === 'warning' ? 'warning' : (n.type === 'info' ? 'info' : 'check_circle')),
      title: n.title,
      detail: n.message,
      timestamp: n.timestamp,
      type: n.type,
      processName: n.processName
    }));
    return [...updates, ...alerts];
  }

  // Process Monitor page filters
  filterByProcess = signal<string>('');
  filterByBotManager = signal<string>('');
  filterByWatcher = signal<string>('');
  filterBySchedule = signal<string>('');

  // Help section step tracking
  helpRunProcessSteps = signal<string[]>([]);
  helpWatcherSteps = signal<string[]>([]);
  helpNotificationSteps = signal<string[]>([]);

  toggleHelpRunProcessStep(step: string) {
    this.helpRunProcessSteps.update(s => s.includes(step) ? s.filter(x => x !== step) : [...s, step]);
  }
  toggleHelpWatcherStep(step: string) {
    this.helpWatcherSteps.update(s => s.includes(step) ? s.filter(x => x !== step) : [...s, step]);
  }
  toggleHelpNotificationStep(step: string) {
    this.helpNotificationSteps.update(s => s.includes(step) ? s.filter(x => x !== step) : [...s, step]);
  }

  // ── Getting Started integrated flow ──
  gettingStartedSteps: {id: string; label: string; icon: string; description: string; optional?: boolean; videoUrl?: string}[] = [
    {id: 'record-send', label: 'Record & Send Scenario', icon: 'videocam', description: 'Record your scenario in ScenarioBuilder and send it to Director.', videoUrl: 'https://www.youtube.com/embed/placeholder-record'},
    {id: 'botmanager', label: 'Verify BotManager', icon: 'dns', description: 'Confirm BotManager is connected and ready.', videoUrl: 'https://www.youtube.com/embed/placeholder-botmanager'},
    {id: 'rwatcher', label: 'Add an rWatcher', icon: 'desktop_windows', description: 'Create and start a bot that will execute your scenario.', videoUrl: 'https://www.youtube.com/embed/placeholder-rwatcher'},
    {id: 'schedule', label: 'Create a Schedule', icon: 'schedule', description: 'Define how often your Process Monitor runs.', videoUrl: 'https://www.youtube.com/embed/placeholder-schedule'},
    {id: 'monitor', label: 'Create Process Monitor', icon: 'monitoring', description: 'Tie your scenario, rWatcher, and schedule together.', videoUrl: 'https://www.youtube.com/embed/placeholder-monitor'},
    {id: 'results', label: 'See it Run', icon: 'play_circle', description: 'Watch your bot execute the scenario automatically.', videoUrl: 'https://www.youtube.com/embed/placeholder-results'},
    {id: 'reports', label: 'Export Reports', icon: 'download', description: 'Download and share your automation results.', optional: true}
  ];
  gsActiveStep = signal<string>('record-send');
  gsCompletedSteps = signal<string[]>([]);
  gsPreviewStep = signal<string | null>(null);

  gsMarkComplete(stepId: string) {
    this.gsCompletedSteps.update(s => s.includes(stepId) ? s : [...s, stepId]);
    // Auto-advance to next incomplete step
    const nextStep = this.gettingStartedSteps.find(st => !this.gsCompletedSteps().includes(st.id) && st.id !== stepId);
    if (nextStep) {
      this.gsActiveStep.set(nextStep.id);
    }
  }

  gsToggleComplete(stepId: string) {
    this.gsCompletedSteps.update(s =>
      s.includes(stepId) ? s.filter(x => x !== stepId) : [...s, stepId]
    );
  }

  gsIsComplete(stepId: string) {
    return this.gsCompletedSteps().includes(stepId);
  }

  gsProgressPercent() {
    const total = this.gettingStartedSteps.length;
    return Math.round((this.gsCompletedSteps().length / total) * 100);
  }

  gsOpenPreview(stepId: string) {
    this.gsPreviewStep.set(stepId);
  }

  gsClosePreview() {
    this.gsPreviewStep.set(null);
  }

  gsPreviewStepData() {
    const id = this.gsPreviewStep();
    return id ? this.gettingStartedSteps.find(s => s.id === id) ?? null : null;
  }

  gsStepAction(stepId: string) {
    switch (stepId) {
      case 'rwatcher':
        this.openDrawer('watcher', 'standalone');
        break;
      case 'schedule':
        this.openDrawer('schedule', 'standalone');
        break;
      case 'monitor':
        this.openDrawer('monitor', 'standalone');
        break;
      case 'results':
        this.navigate('/process-monitors');
        break;
      case 'reports':
        this.navigate('/reports');
        break;
    }
  }

  // Dashboard notifications & updates
  dashboardNotifications = signal<Notification[]>([
    { id: '1', type: 'failure', title: 'Process Failed', message: 'Legacy Data Sync failed — 140 records mismatched during integrity check.', timestamp: '1 hour ago', processName: 'Legacy Data Sync' },
    { id: '2', type: 'warning', title: 'Watcher Offline', message: 'rWatcher002 has gone offline. SFDC Auth Monitor may be affected.', timestamp: '2 hours ago' },
    { id: '3', type: 'info', title: 'Schedule Updated', message: 'Invoice Processing schedule changed to weekdays only.', timestamp: '5 hours ago', processName: 'Invoice Processing' }
  ]);

  latestUpdates = signal<LatestUpdate[]>([
    { id: '1', type: 'success', title: 'Last Successful Run', detail: 'SFDC Auth Monitor completed all checks', timestamp: '3 min ago', icon: 'check_circle' },
    { id: '2', type: 'failure', title: 'Last Failure', detail: 'Legacy Data Sync — 140 records mismatched', timestamp: '1 hour ago', icon: 'error' },
    { id: '3', type: 'executed', title: 'Last Executed', detail: 'Process Notepad is currently running', timestamp: 'Just now', icon: 'play_circle' }
  ]);

  botManagerStatus = signal<{name: string; status: 'online' | 'offline'}[]>([
    { name: 'BotManager-1', status: 'online' },
    { name: 'BotManager-2', status: 'online' }
  ]);

  rwatchers = signal<RWatcher[]>([
    {
      id: '1',
      alias: 'rWatcher001',
      description: 'Primary watcher for NYC office automation tasks',
      status: 'online',
      ipAddress: '192.168.1.105',
      lastPing: 'Just now',
      botManager: 'BotManager-1',
      resolution: '1920x1080',
      colorDepth: '32-bit',
      username: 'CORP\\auto_user1',
      domain: 'CORP',
      assignedMonitors: 2,
      uptime: '14d 6h 32m',
      totalChecks: 1240,
      successCount: 1220,
      failureCount: 20,
      avgResponseTime: '1.2s',
      trendData: [95, 97, 98, 96, 99, 100, 98],
      screenUrl: '',
      groups: ['Production', 'NYC']
    },
    {
      id: '2',
      alias: 'rWatcher002',
      description: 'Backup watcher for SFDC auth flows',
      status: 'offline',
      ipAddress: '192.168.1.106',
      lastPing: '2 hours ago',
      botManager: 'BotManager-1',
      resolution: '1280x1024',
      colorDepth: '32-bit',
      username: 'CORP\\auto_user2',
      domain: 'CORP',
      assignedMonitors: 1,
      uptime: '--',
      totalChecks: 580,
      successCount: 560,
      failureCount: 20,
      avgResponseTime: '2.1s',
      trendData: [90, 92, 88, 85, 0, 0, 0],
      screenUrl: '',
      groups: ['Backup', 'CRM']
    },
    {
      id: '3',
      alias: 'rWatcher003',
      description: 'Dedicated watcher for legacy data sync processes',
      status: 'busy',
      ipAddress: '192.168.1.107',
      lastPing: 'Just now',
      botManager: 'BotManager-2',
      resolution: '1920x1080',
      colorDepth: '16-bit',
      username: 'CORP\\auto_user3',
      domain: 'CORP',
      assignedMonitors: 3,
      uptime: '7d 12h 15m',
      totalChecks: 890,
      successCount: 845,
      failureCount: 45,
      avgResponseTime: '3.4s',
      trendData: [92, 94, 91, 95, 93, 96, 94],
      screenUrl: '',
      groups: ['Production', 'Legacy', 'Finance']
    }
  ]);

  rwatcherToDelete = signal<string | null>(null);
  expandedRWatcher = signal<string | null>(null);
  rwatcherSearch = signal<string>('');
  rwatcherStatusFilter = signal<'all' | 'available' | 'busy' | 'offline'>('all');

  toggleRWatcherExpand(id: string) {
    this.expandedRWatcher.update(current => current === id ? null : id);
  }

  confirmDeleteRWatcher(id: string) {
    this.rwatcherToDelete.set(id);
  }

  executeDeleteRWatcher() {
    const id = this.rwatcherToDelete();
    if (id) {
      this.rwatchers.update(watchers => watchers.filter(w => w.id !== id));
    }
    this.rwatcherToDelete.set(null);
  }

  cancelDeleteRWatcher() {
    this.rwatcherToDelete.set(null);
  }

  filteredRWatchers() {
    const search = this.rwatcherSearch().toLowerCase();
    const statusFilter = this.rwatcherStatusFilter();
    let list = this.rwatchers();
    if (statusFilter !== 'all') {
      const target = statusFilter === 'available' ? 'online' : statusFilter;
      list = list.filter(w => w.status === target);
    }
    if (search) {
      list = list.filter(w =>
        w.alias.toLowerCase().includes(search) ||
        w.ipAddress.includes(search) ||
        w.botManager.toLowerCase().includes(search)
      );
    }
    return list;
  }

  processCountForWatcher(watcherId: string) {
    return this.monitors().filter(m => m.assignedRWatcherIds?.includes(watcherId)).length;
  }

  // Per-watcher actions
  activateWatcher(id: string) {
    this.rwatchers.update(ws => ws.map(w =>
      w.id === id && w.status === 'offline'
        ? { ...w, status: 'online', lastPing: 'Just now' }
        : w
    ));
  }
  deactivateWatcher(id: string) {
    this.rwatchers.update(ws => ws.map(w =>
      w.id === id ? { ...w, status: 'offline' } : w
    ));
  }
  runWatcher(id: string) {
    this.rwatchers.update(ws => ws.map(w =>
      w.id === id && w.status === 'online' ? { ...w, status: 'busy' } : w
    ));
  }
  stopWatcher(id: string) {
    this.rwatchers.update(ws => ws.map(w =>
      w.id === id && w.status === 'busy' ? { ...w, status: 'online' } : w
    ));
  }
  editingWatcherId = signal<string | null>(null);
  editWatcher(id: string) {
    this.editingWatcherId.set(id);
    this.openDrawer('watcher', 'standalone');
  }

  // Bulk actions
  activateAllWatchers() {
    this.rwatchers.update(ws => ws.map(w =>
      w.status === 'offline' ? { ...w, status: 'online', lastPing: 'Just now' } : w
    ));
  }
  deactivateAllWatchers() {
    this.rwatchers.update(ws => ws.map(w => ({ ...w, status: 'offline' })));
  }
  runAllWatchers() {
    this.rwatchers.update(ws => ws.map(w =>
      w.status === 'online' ? { ...w, status: 'busy' } : w
    ));
  }

  // Schedules
  schedules = signal<Schedule[]>([
    {
      id: 's1',
      name: 'Hourly Production',
      timezone: 'America/New_York',
      lastRun: '2026-04-29 09:00 EDT',
      nextRun: '2026-04-29 10:00 EDT',
      status: 'active',
      cadence: 'Every hour',
      processOrder: ['1', '2']
    },
    {
      id: 's2',
      name: 'Nightly Data Sync',
      timezone: 'UTC',
      lastRun: '2026-04-29 02:00 UTC',
      nextRun: '2026-04-30 02:00 UTC',
      status: 'active',
      cadence: 'Daily at 02:00',
      processOrder: ['3']
    },
    {
      id: 's3',
      name: 'Weekend Maintenance',
      timezone: 'Europe/London',
      lastRun: '2026-04-26 22:00 BST',
      nextRun: '2026-05-03 22:00 BST',
      status: 'deactivated',
      cadence: 'Weekly · Saturdays 22:00',
      processOrder: ['4']
    }
  ]);

  scheduleToDelete = signal<string | null>(null);

  monitorsForSchedule(scheduleId: string): ProcessMonitor[] {
    const sched = this.schedules().find(s => s.id === scheduleId);
    if (!sched) return [];
    const order = sched.processOrder;
    const all = this.monitors();
    return order
      .map(id => all.find(m => m.id === id))
      .filter((m): m is ProcessMonitor => !!m);
  }

  toggleScheduleStatus(id: string) {
    this.schedules.update(list => list.map(s =>
      s.id === id ? { ...s, status: s.status === 'active' ? 'deactivated' : 'active' } : s
    ));
  }

  confirmDeleteSchedule(id: string) {
    this.scheduleToDelete.set(id);
  }
  executeDeleteSchedule() {
    const id = this.scheduleToDelete();
    if (id) {
      this.schedules.update(list => list.filter(s => s.id !== id));
      this.monitors.update(list => list.map(m =>
        m.scheduleId === id ? { ...m, scheduleId: undefined } : m
      ));
    }
    this.scheduleToDelete.set(null);
  }
  cancelDeleteSchedule() {
    this.scheduleToDelete.set(null);
  }

  runScheduleProcesses(scheduleId: string) {
    const ordered = this.monitorsForSchedule(scheduleId);
    const ids = new Set(ordered.map(m => m.id));
    this.monitors.update(list => list.map(m =>
      ids.has(m.id) && m.status !== 'disabled'
        ? { ...m, status: 'running', lastRun: 'Just now', message: 'Triggered by schedule' }
        : m
    ));
  }

  moveScheduleProcessUp(scheduleId: string, monitorId: string) {
    this.schedules.update(list => list.map(s => {
      if (s.id !== scheduleId) return s;
      const idx = s.processOrder.indexOf(monitorId);
      if (idx <= 0) return s;
      const next = [...s.processOrder];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return { ...s, processOrder: next };
    }));
  }
  moveScheduleProcessDown(scheduleId: string, monitorId: string) {
    this.schedules.update(list => list.map(s => {
      if (s.id !== scheduleId) return s;
      const idx = s.processOrder.indexOf(monitorId);
      if (idx === -1 || idx >= s.processOrder.length - 1) return s;
      const next = [...s.processOrder];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return { ...s, processOrder: next };
    }));
  }

  expandedSchedule = signal<string | null>(null);
  toggleScheduleExpand(id: string) {
    this.expandedSchedule.update(c => c === id ? null : id);
  }

  onlineRWatcherCount() {
    return this.rwatchers().filter(w => w.status === 'online').length;
  }

  busyRWatcherCount() {
    return this.rwatchers().filter(w => w.status === 'busy').length;
  }

  offlineRWatcherCount() {
    return this.rwatchers().filter(w => w.status === 'offline').length;
  }

  toggleRunState(id: string) {
    this.monitors.update(monitors => monitors.map(m => {
      if (m.id === id) {
        if (m.status === 'running') return { ...m, status: 'pending', message: 'Manually stopped' };
        if (m.status === 'pending') return { ...m, status: 'running', message: 'Processing...' };
      }
      return m;
    }));
  }

  toggleEnableState(id: string) {
    this.monitors.update(monitors => monitors.map(m => {
      if (m.id === id) {
        if (m.status === 'disabled') return { ...m, status: 'pending', message: 'Enabled' };
        else return { ...m, status: 'disabled', message: 'Manually disabled' };
      }
      return m;
    }));
  }

  openDrawer(drawer: 'watcher' | 'schedule' | 'monitor', mode: 'onboarding' | 'standalone' = 'standalone') {
    this.drawerMode.set(mode);
    this.activeDrawer.set(drawer);
  }

  editMonitor(id: string) {
    this.editingMonitorId.set(id);
    this.openDrawer('monitor', 'standalone');
  }

  confirmDelete(id: string) {
    this.monitorToDelete.set(id);
  }

  executeDelete() {
    const id = this.monitorToDelete();
    if (id) {
      this.monitors.update(monitors => monitors.filter(m => m.id !== id));
    }
    this.monitorToDelete.set(null);
  }

  cancelDelete() {
    this.monitorToDelete.set(null);
  }

  startOnboarding() {
    if (!this.completedSteps().includes('watcher')) {
      this.openDrawer('watcher', 'onboarding');
    } else if (!this.completedSteps().includes('schedule')) {
      this.openDrawer('schedule', 'onboarding');
    } else if (!this.completedSteps().includes('monitor')) {
      this.openDrawer('monitor', 'onboarding');
    }
  }

  skipTour() {
    this.tourSkipped.set(true);
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
    if (!this.completedSteps().includes('notifications')) {
      this.completedSteps.update(steps => [...steps, 'notifications']);
    }
  }

  closeDrawer() {
    this.activeDrawer.set(null);
    this.editingMonitorId.set(null);
  }

  handleNextStep(currentStep: 'watcher' | 'schedule' | 'monitor') {
    // Auto-complete corresponding Getting Started step
    const gsMap: Record<string, string> = {watcher: 'rwatcher', schedule: 'schedule', monitor: 'monitor'};
    if (gsMap[currentStep]) {
      this.gsMarkComplete(gsMap[currentStep]);
    }

    if (this.drawerMode() === 'standalone') {
      if (currentStep === 'monitor') {
        const editId = this.editingMonitorId();
        if (editId) {
          // Update existing monitor
          this.monitors.update(m => m.map(monitor => 
            monitor.id === editId 
              ? { ...monitor, name: monitor.name + ' (Edited)' } 
              : monitor
          ));
          this.editingMonitorId.set(null);
        } else {
          // Create new monitor
          const newId = (this.monitors().length + 1).toString();
          this.monitors.update(m => [...m, {
            id: newId,
            name: `Process Monitor ${newId}`,
            status: 'pending',
            lastRun: 'Never',
            successRate: '--',
            resources: '1 rWatcher',
            message: 'Waiting for schedule',
            scenarioAssigned: 'Custom Scenario',
            projectLinked: 'My First Project',
            assignedRWatcherIds: ['1']
          }]);
        }
        this.navigate('/process-monitors');
      }
      this.closeDrawer();
      return;
    }

    const isFirstTime = !this.completedSteps().includes('monitor');

    this.completedSteps.update(steps => {
      if (!steps.includes(currentStep)) {
        return [...steps, currentStep];
      }
      return steps;
    });

    if (isFirstTime) {
      if (currentStep === 'watcher') {
        this.activeDrawer.set('schedule');
      } else if (currentStep === 'schedule') {
        this.activeDrawer.set('monitor');
      } else if (currentStep === 'monitor') {
        // Add example monitors with assigned rWatchers
        this.monitors.set(this.getDemoMonitors());
        this.activeDrawer.set(null);
      }
    } else {
      if (currentStep === 'watcher' || currentStep === 'schedule') {
        this.activeDrawer.set('monitor');
      } else {
        this.activeDrawer.set(null);
      }
    }
  }

  dismissOnboarding() {
    this.onboardingDismissed.set(true);
    this.navigate('/dashboard');
  }

  getDemoMonitors(): ProcessMonitor[] {
    return [
      {
        id: '1', name: 'Process Notepad', status: 'running', lastRun: 'Just now', successRate: '100%', resources: '3 rWatchers',
        message: 'Processing items...', scenarioAssigned: 'Notepad Data Entry', projectLinked: 'My First Project', assignedRWatcherIds: ['1', '2', '3'], scheduleId: 's1',
        subProcesses: [
          { id: 'sp1', name: 'Open Application', status: 'passed', duration: '2s', transactions: [
            { id: 't1', name: 'Launch Notepad', status: 'passed', duration: '1.2s', message: 'Window detected' },
            { id: 't2', name: 'Verify Window Title', status: 'passed', duration: '0.8s', message: 'Title matched' }
          ]},
          { id: 'sp2', name: 'Data Entry', status: 'running', duration: '—', transactions: [
            { id: 't3', name: 'Type Header Row', status: 'passed', duration: '1.5s', message: 'Text entered' },
            { id: 't4', name: 'Type Data Rows', status: 'running', duration: '—', message: 'Processing row 42/100' },
            { id: 't5', name: 'Save File', status: 'pending', message: 'Waiting...' }
          ]},
          { id: 'sp3', name: 'Validation', status: 'pending', transactions: [
            { id: 't6', name: 'Verify Row Count', status: 'pending' },
            { id: 't7', name: 'Checksum Validation', status: 'pending' }
          ]}
        ]
      },
      {
        id: '2', name: 'SFDC Auth Monitor', status: 'running', lastRun: '3 min ago', successRate: '98%', resources: '2 rWatchers',
        message: 'Auth flow validated', scenarioAssigned: 'SFDC Auth Flow', projectLinked: 'CRM Integration', assignedRWatcherIds: ['1', '2'], scheduleId: 's1',
        subProcesses: [
          { id: 'sp4', name: 'Login Flow', status: 'passed', duration: '4s', transactions: [
            { id: 't8', name: 'Navigate to Login', status: 'passed', duration: '1.8s' },
            { id: 't9', name: 'Enter Credentials', status: 'passed', duration: '1.2s' },
            { id: 't10', name: 'MFA Verification', status: 'passed', duration: '1.0s' }
          ]},
          { id: 'sp5', name: 'Session Validation', status: 'passed', duration: '1.5s', transactions: [
            { id: 't11', name: 'Check Token Expiry', status: 'passed', duration: '0.5s' },
            { id: 't12', name: 'Verify Permissions', status: 'passed', duration: '1.0s' }
          ]}
        ]
      },
      {
        id: '3', name: 'Legacy Data Sync', status: 'pending', lastRun: '1 hour ago', successRate: '95%', resources: '1 rWatcher',
        message: 'Waiting for schedule', scenarioAssigned: 'Legacy Data Sync', projectLinked: 'Data Migration', assignedRWatcherIds: ['3'], scheduleId: 's2',
        subProcesses: [
          { id: 'sp6', name: 'Extract Records', status: 'passed', duration: '12s', transactions: [
            { id: 't13', name: 'Query Source DB', status: 'passed', duration: '8s', message: '1,240 records' },
            { id: 't14', name: 'Transform Fields', status: 'passed', duration: '4s' }
          ]},
          { id: 'sp7', name: 'Load to Target', status: 'failed', duration: '6s', transactions: [
            { id: 't15', name: 'Batch Insert', status: 'passed', duration: '3s', message: '1,100 inserted' },
            { id: 't16', name: 'Verify Integrity', status: 'failed', duration: '3s', message: '140 records mismatched' }
          ]}
        ]
      },
      {
        id: '4', name: 'Invoice Processing', status: 'disabled', lastRun: '2 days ago', successRate: '100%', resources: '2 rWatchers',
        message: 'Manually disabled', scenarioAssigned: 'Invoice OCR', projectLinked: 'Finance Automation', assignedRWatcherIds: ['1', '3'], scheduleId: 's3'
      }
    ];
  }

  skipToDemo() {
    this.monitors.set(this.getDemoMonitors());
    this.completedSteps.set(['notifications', 'watcher', 'schedule', 'monitor']);
    this.onboardingDismissed.set(true);
  }

  toggleRWatcherOnlineStatus(id: string) {
    this.rwatchers.update(watchers => watchers.map(w => {
      if (w.id === id) {
        const newStatus: 'online' | 'offline' = w.status === 'offline' ? 'online' : 'offline';
        return { ...w, status: newStatus, lastPing: newStatus === 'online' ? 'Just now' : w.lastPing };
      }
      return w;
    }));
  }

  selectedMonitor() {
    const id = this.selectedMonitorId();
    if (!id && this.monitors().length > 0) return this.monitors()[0];
    return this.monitors().find(m => m.id === id) ?? null;
  }

  watchersForMonitor(monitor: ProcessMonitor) {
    const ids = monitor.assignedRWatcherIds;
    if (!ids || ids.length === 0) return [];
    return this.rwatchers().filter(w => ids.includes(w.id));
  }

  assignedWatcherSearch = signal<string>('');
  expandedSubProcess = signal<string | null>(null);

  toggleSubProcessExpand(id: string) {
    this.expandedSubProcess.update(current => current === id ? null : id);
  }

  spTxnCount(sp: SubProcess) {
    return sp.transactions?.length ?? 0;
  }
  spPassedCount(sp: SubProcess) {
    return sp.transactions?.filter(t => t.status === 'passed').length ?? 0;
  }
  spFailedCount(sp: SubProcess) {
    return sp.transactions?.filter(t => t.status === 'failed').length ?? 0;
  }

  monitorSubProcessTotal(m: ProcessMonitor) {
    return m.subProcesses?.length ?? 0;
  }
  monitorSubProcessPassed(m: ProcessMonitor) {
    return m.subProcesses?.filter(sp => sp.status === 'passed').length ?? 0;
  }
  monitorSubProcessFailed(m: ProcessMonitor) {
    return m.subProcesses?.filter(sp => sp.status === 'failed').length ?? 0;
  }
  monitorTxnTotal(m: ProcessMonitor) {
    return m.subProcesses?.reduce((sum, sp) => sum + (sp.transactions?.length ?? 0), 0) ?? 0;
  }
  monitorTxnPassed(m: ProcessMonitor) {
    return m.subProcesses?.reduce((sum, sp) => sum + (sp.transactions?.filter(t => t.status === 'passed').length ?? 0), 0) ?? 0;
  }
  monitorTxnFailed(m: ProcessMonitor) {
    return m.subProcesses?.reduce((sum, sp) => sum + (sp.transactions?.filter(t => t.status === 'failed').length ?? 0), 0) ?? 0;
  }

  // Dashboard KPIs
  activeProcessCount() {
    return this.monitors().filter(m => m.status === 'running' || m.status === 'pending').length;
  }
  inactiveProcessCount() {
    return this.monitors().filter(m => m.status === 'disabled').length;
  }
  activeWatcherCount() {
    return this.rwatchers().filter(w => w.status === 'online' || w.status === 'busy').length;
  }
  inactiveWatcherCount() {
    return this.rwatchers().filter(w => w.status === 'offline').length;
  }
  botManagerStatusLine() {
    return this.botManagerStatus().map(b => `${b.name}: ${b.status}`).join(' | ');
  }

  // Process Monitor page filtered list
  filteredMonitors() {
    let list = this.monitors();
    const proc = this.filterByProcess().toLowerCase();
    const bot = this.filterByBotManager().toLowerCase();
    const watcher = this.filterByWatcher().toLowerCase();
    if (proc) {
      list = list.filter(m => m.name.toLowerCase().includes(proc));
    }
    if (bot) {
      list = list.filter(m => {
        const watchers = this.watchersForMonitor(m);
        return watchers.some(w => w.botManager.toLowerCase().includes(bot));
      });
    }
    if (watcher) {
      list = list.filter(m => {
        const watchers = this.watchersForMonitor(m);
        return watchers.some(w => w.alias.toLowerCase().includes(watcher));
      });
    }
    return list;
  }

  // Unique bot managers for filter dropdown
  uniqueBotManagers() {
    const set = new Set(this.rwatchers().map(w => w.botManager));
    return Array.from(set);
  }

  runMonitorNow(id: string) {
    this.monitors.update(monitors => monitors.map(m => {
      if (m.id === id && m.status !== 'disabled') {
        return { ...m, status: 'running' as const, message: 'Triggered manually', lastRun: 'Just now' };
      }
      return m;
    }));
    this.gsMarkComplete('results');
  }

  // ── Smart Add Process Wizard ──
  wizardStep = signal<number>(0);
  wizardType = signal<'monitor' | 'testing' | null>(null);
  wizardProcessName = signal<string>('');
  wizardScenario = signal<string>('');
  wizardProject = signal<string>('');
  wizardSelectedWatcherIds = signal<string[]>([]);
  wizardSchedule = signal<string>('default');
  wizardCustomCron = signal<string>('');
  wizardEvents = signal<{email: boolean; slack: boolean; onFailure: boolean; onSuccess: boolean}>({
    email: false, slack: false, onFailure: true, onSuccess: false
  });
  wizardNameSuggestions = signal<string[]>([
    'Web App Health Check', 'Login Flow Monitor', 'API Response Validator',
    'Data Pipeline Sync', 'Invoice Processor', 'Email Campaign Tracker',
    'Dashboard Load Test', 'Payment Gateway Check'
  ]);
  wizardScenarioSuggestions = signal<string[]>([
    'End-to-End Login', 'Data Entry Automation', 'Report Generation',
    'File Upload Flow', 'Search & Filter', 'Form Submission'
  ]);
  wizardProjectSuggestions = signal<string[]>([
    'My First Project', 'CRM Integration', 'Finance Automation',
    'Data Migration', 'QA Regression Suite'
  ]);

  wizardFilteredNameSuggestions() {
    const q = this.wizardProcessName().toLowerCase();
    if (!q) return this.wizardNameSuggestions();
    return this.wizardNameSuggestions().filter(s => s.toLowerCase().includes(q));
  }

  wizardFilteredScenarioSuggestions() {
    const q = this.wizardScenario().toLowerCase();
    if (!q) return this.wizardScenarioSuggestions();
    return this.wizardScenarioSuggestions().filter(s => s.toLowerCase().includes(q));
  }

  wizardFilteredProjectSuggestions() {
    const q = this.wizardProject().toLowerCase();
    if (!q) return this.wizardProjectSuggestions();
    return this.wizardProjectSuggestions().filter(s => s.toLowerCase().includes(q));
  }

  wizardToggleWatcher(id: string) {
    this.wizardSelectedWatcherIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  wizardToggleEvent(key: 'email' | 'slack' | 'onFailure' | 'onSuccess') {
    this.wizardEvents.update(ev => ({...ev, [key]: !ev[key]}));
  }

  wizardCanProceed() {
    const step = this.wizardStep();
    if (step === 0) return this.wizardType() !== null && this.wizardBmConfigured();
    if (this.wizardType() === 'testing') {
      if (step === 1) return this.wizardProcessName().trim().length > 0 && this.wizardProject().trim().length > 0;
      if (step === 2) return this.wizardTotalRLoaders() > 0 && this.wizardRampUpEvery() > 0;
      if (step === 3) return this.wizardTestProcesses().length > 0;
      if (step === 4) return this.wizardBotManagerReady();
      return true;
    }
    if (step === 1) return this.wizardProcessName().trim().length > 0;
    if (step === 2) return this.wizardProject().trim().length > 0 && this.wizardScenario().trim().length > 0;
    if (step === 3) return this.wizardSelectedWatcherIds().length > 0;
    if (step === 4) return this.wizardSchedule().length > 0;
    return true; // step 5 (events) is always optional
  }

  wizardNext() {
    if (this.wizardCanProceed() && this.wizardStep() < 5) {
      this.wizardStep.update(s => s + 1);
    }
  }

  wizardBack() {
    if (this.wizardStep() > 0) {
      this.wizardStep.update(s => s - 1);
    }
  }

  wizardReset() {
    this.wizardStep.set(0);
    this.wizardType.set(null);
    this.wizardProcessName.set('');
    this.wizardScenario.set('');
    this.wizardProject.set('');
    this.wizardSelectedWatcherIds.set([]);
    this.wizardSchedule.set('default');
    this.wizardCustomCron.set('');
    this.wizardEvents.set({email: false, slack: false, onFailure: true, onSuccess: false});
    this.wizardConfiguredEvents.set([]);
    this.wizardEventPopupOpen.set(false);
    // Reset testing-specific state
    this.wizardTestDescription.set('');
    this.wizardDistributionType.set('All Available BotManagers');
    this.wizardTotalRLoaders.set(5);
    this.wizardRampUpStart.set(1);
    this.wizardRampUpEvery.set(15);
    this.wizardDurationType.set('fixed');
    this.wizardDurationFixedMinutes.set(15);
    this.wizardDurationIterations.set(1);
    this.wizardStopOnError.set(false);
    this.wizardTestProcesses.set([]);
    this.wizardBotManagerReady.set(false);
    if (this.wizardRLoaderTimer) {
      clearInterval(this.wizardRLoaderTimer);
      this.wizardRLoaderTimer = null;
    }
    this.wizardRLoaderState.set('idle');
    this.wizardRLoaderConnected.set(0);
    this.wizardTestWebhook.set('');
    this.wizardTestEmailInput.set('');
    this.wizardTestEmailList.set([]);
    this.wizardTestNotifEvents.set({started: false, finished: true, ramping: false, failures: false, allUsers: false});
    // Reset BotManager setup (but keep defaults for name/hostname/etc)
    this.wizardBmLauncherUsername.set('');
    this.wizardBmLauncherPassword.set('');
    this.wizardBmAdvancedOpen.set(false);
    this.wizardBmShowPassword.set(false);
  }

  wizardSubmit() {
    if (this.wizardType() === 'testing') {
      this.wizardStep.set(6);
      return;
    }
    const newId = (this.monitors().length + 1).toString();
    this.monitors.update(m => [...m, {
      id: newId,
      name: this.wizardProcessName(),
      status: 'pending' as const,
      lastRun: 'Never',
      successRate: '--',
      resources: `${this.wizardSelectedWatcherIds().length} rWatcher${this.wizardSelectedWatcherIds().length > 1 ? 's' : ''}`,
      message: 'Created via wizard',
      scenarioAssigned: this.wizardScenario(),
      projectLinked: this.wizardProject(),
      assignedRWatcherIds: this.wizardSelectedWatcherIds()
    }]);
    this.wizardStep.set(6); // confirmation step
    this.gsMarkComplete('monitor');
  }

  wizardMonitorStepLabels = ['Purpose', 'Name', 'Project & Scenario', 'Watchers', 'Schedule', 'Events', 'Done'];
  wizardTestingStepLabels = ['Purpose', 'Test Plan', 'Distribution', 'Processes', 'BotManager', 'Notifications', 'Done'];

  wizardStepLabels() {
    return this.wizardType() === 'testing' ? this.wizardTestingStepLabels : this.wizardMonitorStepLabels;
  }

  // ── Testing-specific wizard state ──
  wizardTestDescription = signal<string>('');
  wizardDistributionType = signal<string>('All Available BotManagers');
  wizardTotalRLoaders = signal<number>(5);
  wizardRampUpStart = signal<number>(1);
  wizardRampUpEvery = signal<number>(15);
  wizardDurationType = signal<'fixed' | 'iterations'>('fixed');
  wizardDurationFixedMinutes = signal<number>(15);
  wizardDurationIterations = signal<number>(1);
  wizardStopOnError = signal<boolean>(false);
  wizardTestProcesses = signal<{name: string; distributeBy: string; rLoaders: number; pacing: number; halt: boolean}[]>([]);
  wizardTestProcessOptions = signal<string[]>([
    'complexScen', 'loginScenario', 'checkoutFlow', 'searchAndFilter', 'dataEntry'
  ]);

  // ── Step 0: BotManager Setup (credentials) ──
  wizardBmName = signal<string>('BotManager - 1');
  wizardBmHostname = signal<string>('ec2amaz-ts88pb7');
  wizardBmDescription = signal<string>('BotManager ec2amaz-ts88pb7');
  wizardBmVersion = signal<string>('26.1.0');
  wizardBmOS = signal<string>('Windows Server 2022 Datacenter');
  wizardBmSetRemoteLauncher = signal<boolean>(false);
  wizardBmLauncherUsername = signal<string>('');
  wizardBmLauncherPassword = signal<string>('');
  wizardBmLauncherDomain = signal<string>('');
  wizardBmScriptingUserName = signal<string>('ScriptingBot');
  wizardBmScriptingUserPassword = signal<string>('');
  wizardBmDomain = signal<string>('');
  wizardBmRdpResolution = signal<string>('1280x1024');
  wizardBmRdpColorDepth = signal<string>('32-bit');
  wizardBmRdpIp = signal<string>('ec2amaz-ts88pb7');
  wizardBmRdpTimeout = signal<number>(30);
  wizardBmUseLoader = signal<boolean>(true);
  wizardBmUseWatcher = signal<boolean>(true);
  wizardBmUseWorker = signal<boolean>(true);
  wizardBmUseTester = signal<boolean>(true);
  wizardBmAdvancedOpen = signal<boolean>(false);
  wizardBmShowPassword = signal<boolean>(false);

  wizardBmConfigured() {
    return this.wizardBmLauncherUsername().trim().length > 0 &&
           this.wizardBmLauncherPassword().trim().length > 0;
  }

  // BotManager rLoader prerequisite
  wizardBotManagerReady = signal<boolean>(false);
  wizardBotManagerHostname = signal<string>('ec2amaz-ts88pb7');
  wizardRLoaderCount = signal<number>(5);
  wizardRLoaderDelay = signal<number>(15);
  wizardRLoaderMode = signal<string>('Incremental');
  wizardRLoaderUsernamePrefix = signal<string>('rLoader');
  wizardRLoaderPassword = signal<string>('');
  wizardRLoaderDomain = signal<string>('ec2amaz-ts88pb7');
  wizardRLoaderStarting = signal<boolean>(false);
  wizardRLoaderState = signal<'idle' | 'starting' | 'ready'>('idle');
  wizardRLoaderConnected = signal<number>(0);
  private wizardRLoaderTimer: ReturnType<typeof setInterval> | null = null;

  // Test notifications
  wizardTestWebhook = signal<string>('');
  wizardTestEmailInput = signal<string>('');
  wizardTestEmailList = signal<string[]>([]);
  wizardTestNotifEvents = signal<{started: boolean; finished: boolean; ramping: boolean; failures: boolean; allUsers: boolean}>({
    started: false, finished: true, ramping: false, failures: false, allUsers: false
  });
  wizardWebhookOptions = signal<string[]>(['automai test', 'slack prod', 'pagerduty on-call']);

  wizardAddTestProcess(name: string) {
    if (!name.trim()) return;
    this.wizardTestProcesses.update(list => [...list, {
      name: name.trim(),
      distributeBy: this.wizardDistributionType(),
      rLoaders: this.wizardTotalRLoaders(),
      pacing: 5,
      halt: false
    }]);
  }

  wizardRemoveTestProcess(index: number) {
    this.wizardTestProcesses.update(list => list.filter((_, i) => i !== index));
  }

  wizardToggleTestProcessHalt(index: number) {
    this.wizardTestProcesses.update(list => list.map((p, i) => i === index ? {...p, halt: !p.halt} : p));
  }

  wizardUpdateTestProcessField(index: number, field: 'rLoaders' | 'pacing', value: number) {
    this.wizardTestProcesses.update(list => list.map((p, i) => i === index ? {...p, [field]: value} : p));
  }

  wizardAddTestEmail() {
    const email = this.wizardTestEmailInput().trim();
    if (!email) return;
    const parts = email.split(',').map(e => e.trim()).filter(e => e.length > 0);
    this.wizardTestEmailList.update(list => [...list, ...parts.filter(p => !list.includes(p))]);
    this.wizardTestEmailInput.set('');
  }

  wizardRemoveTestEmail(email: string) {
    this.wizardTestEmailList.update(list => list.filter(e => e !== email));
  }

  wizardToggleTestNotifEvent(key: 'started' | 'finished' | 'ramping' | 'failures' | 'allUsers') {
    this.wizardTestNotifEvents.update(ev => ({...ev, [key]: !ev[key]}));
  }

  wizardStartRLoaderDesktops() {
    if (this.wizardRLoaderState() === 'starting') return;
    this.wizardRLoaderState.set('starting');
    this.wizardRLoaderConnected.set(0);
    const total = Math.max(1, this.wizardRLoaderCount());
    // Simulate each rLoader taking ~delay seconds, clamped for demo responsiveness
    const stepDelay = Math.min(Math.max(this.wizardRLoaderDelay() * 100, 400), 1500);
    this.wizardRLoaderTimer = setInterval(() => {
      const current = this.wizardRLoaderConnected();
      if (current + 1 >= total) {
        this.wizardRLoaderConnected.set(total);
        if (this.wizardRLoaderTimer) {
          clearInterval(this.wizardRLoaderTimer);
          this.wizardRLoaderTimer = null;
        }
        this.wizardRLoaderState.set('ready');
      } else {
        this.wizardRLoaderConnected.set(current + 1);
      }
    }, stepDelay);
  }

  wizardCancelRLoaderStart() {
    if (this.wizardRLoaderTimer) {
      clearInterval(this.wizardRLoaderTimer);
      this.wizardRLoaderTimer = null;
    }
    this.wizardRLoaderState.set('idle');
    this.wizardRLoaderConnected.set(0);
  }

  wizardConfirmRLoaderReady() {
    this.wizardBotManagerReady.set(true);
  }

  wizardRLoaderList() {
    const total = this.wizardRLoaderCount();
    const connected = this.wizardRLoaderConnected();
    return Array.from({length: total}, (_, i) => ({
      index: i + 1,
      name: `${this.wizardRLoaderUsernamePrefix()}-${i + 1}`,
      connected: i < connected
    }));
  }

  // Event popup — matching Automai "Set threshold and event" modal
  wizardEventPopupOpen = signal<boolean>(false);
  wizardEventMonitoringItem = signal<string>('');
  wizardEventContinuousNotify = signal<boolean>(false);
  wizardEventNotifyWhenFinished = signal<boolean>(false);
  wizardEventMetric = signal<string>('Response time');
  wizardEventCondition = signal<string>('is greater than');
  wizardEventThreshold = signal<string>('1');
  wizardEventWhere = signal<string>('any location');
  wizardEventLevel = signal<string>('warning');
  wizardEventAction = signal<string>('Email');
  wizardEventRecipients = signal<string>('');
  wizardConfiguredEvents = signal<{monitoringItem: string; metric: string; condition: string; threshold: string; level: string; action: string; recipients: string}[]>([]);

  wizardOpenEventPopup() {
    this.wizardEventMonitoringItem.set('');
    this.wizardEventContinuousNotify.set(false);
    this.wizardEventNotifyWhenFinished.set(false);
    this.wizardEventMetric.set('Response time');
    this.wizardEventCondition.set('is greater than');
    this.wizardEventThreshold.set('1');
    this.wizardEventWhere.set('any location');
    this.wizardEventLevel.set('warning');
    this.wizardEventAction.set('Email');
    this.wizardEventRecipients.set('');
    this.wizardEventPopupOpen.set(true);
  }

  wizardSaveEvent() {
    this.wizardConfiguredEvents.update(evts => [...evts, {
      monitoringItem: this.wizardEventMonitoringItem() || this.wizardProcessName(),
      metric: this.wizardEventMetric(),
      condition: this.wizardEventCondition(),
      threshold: this.wizardEventThreshold(),
      level: this.wizardEventLevel(),
      action: this.wizardEventAction(),
      recipients: this.wizardEventRecipients()
    }]);
    this.wizardEventPopupOpen.set(false);
  }

  wizardRemoveEvent(index: number) {
    this.wizardConfiguredEvents.update(evts => evts.filter((_, i) => i !== index));
  }

  // ── help/new3: Chat Agent ──
  chatMessages = signal<{role: 'agent' | 'user'; text: string; options?: string[]; multiSelect?: boolean; actions?: {label: string; action: string; icon: string}[]}[]>([
    {role: 'agent', text: 'Hello! I\'m your Automai setup assistant. I can help you create and configure a new process monitor.\n\nWhat would you like to do?', options: ['Create a Process Monitor']}
  ]);
  chatInput = signal<string>('');
  chatTyping = signal<boolean>(false);
  chatPhase = signal<'goal' | 'name' | 'project' | 'scenario' | 'watcher' | 'schedule' | 'confirm' | 'done'>('goal');
  chatProcessData = signal<{name: string; project: string; scenario: string; watchers: string[]; schedule: string}>({name: '', project: '', scenario: '', watchers: [], schedule: ''});
  chatSelectedWatchers = signal<string[]>([]);
  chatCreatedProcessId = signal<string | null>(null);

  chatStepLabels = ['Goal', 'Name', 'Project', 'Scenario', 'Watchers', 'Schedule', 'Confirm'];
  chatStepIndex() {
    const map: Record<string, number> = {goal: 0, name: 1, project: 2, scenario: 3, watcher: 4, schedule: 5, confirm: 6, done: 7};
    return map[this.chatPhase()] ?? 0;
  }

  chatToggleWatcher(alias: string) {
    this.chatSelectedWatchers.update(arr => arr.includes(alias) ? arr.filter(a => a !== alias) : [...arr, alias]);
  }

  chatConfirmWatchers() {
    const selected = this.chatSelectedWatchers();
    if (selected.length === 0) return;
    this.chatMessages.update(m => [...m, {role: 'user', text: selected.join(', ')}]);
    this.chatProcessData.update(d => ({...d, watchers: selected}));
    this.chatAddAgentMessage('schedule');
  }

  chatSendOption(option: string) {
    this.chatMessages.update(m => [...m, {role: 'user', text: option}]);
    this.chatProcessResponse(option);
  }

  chatHandleAction(action: string) {
    const id = this.chatCreatedProcessId();
    switch (action) {
      case 'edit':
        if (id) this.editMonitor(id);
        break;
      case 'schedule':
        this.openDrawer('schedule', 'standalone');
        break;
      case 'view':
        this.navigate('/process-monitors');
        break;
      case 'another':
        this.chatReset();
        break;
    }
  }

  chatSend() {
    const text = this.chatInput().trim();
    if (!text) return;
    this.chatMessages.update(m => [...m, {role: 'user', text}]);
    this.chatInput.set('');
    this.chatProcessResponse(text);
  }

  private chatAddAgentMessage(nextPhase: string) {
    this.chatTyping.set(true);
    setTimeout(() => {
      this.chatTyping.set(false);
      this.chatPhase.set(nextPhase as any);
      switch (nextPhase) {
        case 'name':
          this.chatMessages.update(m => [...m, {
            role: 'agent',
            text: 'Great choice! Let\'s set up a new process monitor.\n\nFirst, what would you like to name this process? Choose a descriptive name that helps you identify it later.',
            options: ['Web App Health Check', 'Login Flow Monitor', 'Data Pipeline Sync', 'Invoice Processor']
          }]);
          break;
        case 'project':
          this.chatMessages.update(m => [...m, {
            role: 'agent',
            text: `Got it — your process will be called "${this.chatProcessData().name}".\n\nNow, which project should this belong to? A project groups related scenarios and monitors together.`,
            options: this.wizardProjectSuggestions()
          }]);
          break;
        case 'scenario':
          this.chatMessages.update(m => [...m, {
            role: 'agent',
            text: `Project "${this.chatProcessData().project}" selected.\n\nWhich scenario should this monitor execute? Scenarios define the automation steps your process will run.`,
            options: this.wizardScenarioSuggestions()
          }]);
          break;
        case 'watcher': {
          const online = this.rwatchers().filter(w => w.status === 'online');
          const busy = this.rwatchers().filter(w => w.status === 'busy');
          let recommendation = '';
          if (online.length > 0) {
            recommendation = `\n\n💡 Recommendation: ${online.map(w => w.alias).join(' and ')} ${online.length === 1 ? 'is' : 'are'} currently online and available.`;
          }
          if (busy.length > 0) {
            recommendation += `\n⚠️ ${busy.map(w => w.alias).join(', ')} ${busy.length === 1 ? 'is' : 'are'} busy but can be queued.`;
          }
          this.chatMessages.update(m => [...m, {
            role: 'agent',
            text: `Now let's assign watchers. These are the machines that will execute your process.\n\nYou can select multiple watchers for redundancy and load balancing.${recommendation}`,
            multiSelect: true
          }]);
          this.chatSelectedWatchers.set([]);
          break;
        }
        case 'schedule':
          this.chatMessages.update(m => [...m, {
            role: 'agent',
            text: `${this.chatProcessData().watchers.length} watcher${this.chatProcessData().watchers.length > 1 ? 's' : ''} assigned.\n\nHow often should this process run? Choose a schedule that fits your monitoring needs.`,
            options: ['Every 15 min', 'Every 30 min', 'Every Hour', 'Daily at 8 AM', 'Weekdays at 9 AM']
          }]);
          break;
        case 'confirm': {
          const d = this.chatProcessData();
          this.chatMessages.update(m => [...m, {
            role: 'agent',
            text: `Here's a summary of your new process monitor:\n\n📋 Name: ${d.name}\n📁 Project: ${d.project}\n🎯 Scenario: ${d.scenario}\n👁️ Watchers: ${d.watchers.join(', ')}\n⏰ Schedule: ${d.schedule}\n\nEverything look good? I'll create this process monitor for you.`,
            options: ['Yes, create it!', 'Let me change something']
          }]);
          break;
        }
      }
    }, 800);
  }

  private chatProcessResponse(input: string) {
    const phase = this.chatPhase();
    switch (phase) {
      case 'goal':
        this.chatAddAgentMessage('name');
        break;
      case 'name':
        this.chatProcessData.update(d => ({...d, name: input}));
        this.chatAddAgentMessage('project');
        break;
      case 'project':
        this.chatProcessData.update(d => ({...d, project: input}));
        this.chatAddAgentMessage('scenario');
        break;
      case 'scenario':
        this.chatProcessData.update(d => ({...d, scenario: input}));
        this.chatAddAgentMessage('watcher');
        break;
      case 'watcher':
        this.chatProcessData.update(d => ({...d, watchers: [input.split(' (')[0]]}));
        this.chatAddAgentMessage('schedule');
        break;
      case 'schedule':
        this.chatProcessData.update(d => ({...d, schedule: input}));
        this.chatAddAgentMessage('confirm');
        break;
      case 'confirm':
        if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('create')) {
          this.chatTyping.set(true);
          setTimeout(() => {
            this.chatTyping.set(false);
            const d = this.chatProcessData();
            const watcherIds = this.rwatchers().filter(w => d.watchers.includes(w.alias)).map(w => w.id);
            const newId = (this.monitors().length + 1).toString();
            this.monitors.update(monitors => [...monitors, {
              id: newId, name: d.name, status: 'pending' as const, lastRun: 'Never', successRate: '--',
              resources: `${watcherIds.length || 1} rWatcher${watcherIds.length > 1 ? 's' : ''}`,
              message: 'Created via chat agent', scenarioAssigned: d.scenario, projectLinked: d.project,
              assignedRWatcherIds: watcherIds.length > 0 ? watcherIds : ['1']
            }]);
            this.chatCreatedProcessId.set(newId);
            this.chatPhase.set('done');
            this.gsMarkComplete('monitor');
            this.chatMessages.update(m => [...m, {
              role: 'agent',
              text: `✅ Process monitor "${d.name}" has been created successfully!\n\nHere's what was set up:\n• Project: ${d.project}\n• Scenario: ${d.scenario}\n• Watchers: ${d.watchers.join(', ')} (${watcherIds.length} assigned)\n• Schedule: ${d.schedule}\n• Status: Pending — waiting for first scheduled run\n\nWhat would you like to do next?`,
              actions: [
                {label: 'Edit Process', action: 'edit', icon: 'edit'},
                {label: 'Add Schedule', action: 'schedule', icon: 'schedule'},
                {label: 'View in Process Monitors', action: 'view', icon: 'monitoring'},
                {label: 'Create Another', action: 'another', icon: 'add'}
              ]
            }]);
          }, 1200);
        } else if (input.toLowerCase().includes('change')) {
          this.chatTyping.set(true);
          setTimeout(() => {
            this.chatTyping.set(false);
            this.chatPhase.set('name');
            const d = this.chatProcessData();
            this.chatMessages.update(m => [...m, {
              role: 'agent',
              text: `No problem! Let's go through the setup again. Your current values are:\n\n• Name: ${d.name}\n• Project: ${d.project}\n• Scenario: ${d.scenario}\n\nWhat name would you like to use?`,
              options: [d.name, 'Web App Health Check', 'Login Flow Monitor']
            }]);
          }, 600);
        } else {
          this.chatReset();
        }
        break;
      case 'done': {
        const lower = input.toLowerCase();
        if (lower.includes('edit')) {
          this.chatHandleAction('edit');
        } else if (lower.includes('schedule')) {
          this.chatHandleAction('schedule');
        } else if (lower.includes('view') || lower.includes('monitor')) {
          this.chatHandleAction('view');
        } else if (lower.includes('another') || lower.includes('create') || lower.includes('new')) {
          this.chatReset();
        } else {
          this.chatTyping.set(true);
          setTimeout(() => {
            this.chatTyping.set(false);
            this.chatMessages.update(m => [...m, {
              role: 'agent',
              text: 'I can help you with that! Here are your options:',
              actions: [
                {label: 'Edit Process', action: 'edit', icon: 'edit'},
                {label: 'Add Schedule', action: 'schedule', icon: 'schedule'},
                {label: 'View in Process Monitors', action: 'view', icon: 'monitoring'},
                {label: 'Create Another', action: 'another', icon: 'add'}
              ]
            }]);
          }, 500);
        }
        break;
      }
    }
  }

  chatReset() {
    this.chatMessages.set([
      {role: 'agent', text: 'Hello! I\'m your Automai setup assistant. I can help you create and configure a new process monitor.\n\nWhat would you like to do?', options: ['Create a Process Monitor']}
    ]);
    this.chatPhase.set('goal');
    this.chatProcessData.set({name: '', project: '', scenario: '', watchers: [], schedule: ''});
    this.chatInput.set('');
    this.chatTyping.set(false);
    this.chatSelectedWatchers.set([]);
    this.chatCreatedProcessId.set(null);
  }
}
