import {ChangeDetectionStrategy, Component, signal, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet, NavigationEnd, RouterLink} from '@angular/router';
import {filter} from 'rxjs/operators';
import {AddWatcherDrawerComponent} from './drawers/add-watcher.component';
import {AddScheduleDrawerComponent} from './drawers/add-schedule.component';
import {CreateProcessMonitorDrawerComponent} from './drawers/create-process-monitor.component';
import {DocumentationComponent} from './documentation/documentation.component';

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
  subProcesses?: SubProcess[];
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    AddWatcherDrawerComponent,
    AddScheduleDrawerComponent,
    CreateProcessMonitorDrawerComponent,
    DocumentationComponent
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

  ngOnInit() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      const url = e.urlAfterRedirects;
      // Check for multi-segment paths first
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
        'help': 'help',
        'documentation': 'documentation'
      };
      this.activeTab.set(tabMap[path] || 'dashboard');
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
  gettingStartedSteps: {id: string; label: string; icon: string; description: string; optional?: boolean}[] = [
    {id: 'record-send', label: 'Record & Send Scenario', icon: 'videocam', description: 'Record your scenario in ScenarioBuilder and send it to Director.'},
    {id: 'botmanager', label: 'Verify BotManager', icon: 'dns', description: 'Confirm BotManager is connected and ready.'},
    {id: 'rwatcher', label: 'Add an rWatcher', icon: 'desktop_windows', description: 'Create and start a bot that will execute your scenario.'},
    {id: 'schedule', label: 'Create a Schedule', icon: 'schedule', description: 'Define how often your Process Monitor runs.'},
    {id: 'monitor', label: 'Create Process Monitor', icon: 'monitoring', description: 'Tie your scenario, rWatcher, and schedule together.'},
    {id: 'results', label: 'See it Run', icon: 'play_circle', description: 'Watch your bot execute the scenario automatically.'},
    {id: 'reports', label: 'Export Reports', icon: 'download', description: 'Download and share your automation results.', optional: true}
  ];
  gsActiveStep = signal<string>('record-send');
  gsCompletedSteps = signal<string[]>([]);

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
      screenUrl: ''
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
      screenUrl: ''
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
      screenUrl: ''
    }
  ]);

  rwatcherToDelete = signal<string | null>(null);
  expandedRWatcher = signal<string | null>(null);
  rwatcherSearch = signal<string>('');

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
    if (!search) return this.rwatchers();
    return this.rwatchers().filter(w =>
      w.alias.toLowerCase().includes(search) ||
      w.ipAddress.includes(search) ||
      w.botManager.toLowerCase().includes(search)
    );
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
        message: 'Processing items...', scenarioAssigned: 'Notepad Data Entry', projectLinked: 'My First Project', assignedRWatcherIds: ['1', '2', '3'],
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
        message: 'Auth flow validated', scenarioAssigned: 'SFDC Auth Flow', projectLinked: 'CRM Integration', assignedRWatcherIds: ['1', '2'],
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
        message: 'Waiting for schedule', scenarioAssigned: 'Legacy Data Sync', projectLinked: 'Data Migration', assignedRWatcherIds: ['3'],
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
        message: 'Manually disabled', scenarioAssigned: 'Invoice OCR', projectLinked: 'Finance Automation', assignedRWatcherIds: ['1', '3']
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
    if (step === 0) return this.wizardType() !== null;
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
  }

  wizardSubmit() {
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
  }

  wizardStepLabels = ['Purpose', 'Name', 'Project & Scenario', 'Watchers', 'Schedule', 'Events', 'Done'];

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
