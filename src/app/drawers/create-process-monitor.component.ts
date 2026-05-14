import { Component, EventEmitter, Output, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-process-monitor-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
      <div class="w-full max-w-[680px] bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in">

        <!-- Onboarding Stepper -->
        @if (mode === 'onboarding') {
          <div class="w-full bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">In progress (3/3)</span>
            <div class="flex items-center gap-2 text-xs font-semibold tracking-wider">
              <span class="text-emerald-500 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check_circle</span> Step 1</span>
              <span class="text-slate-300 material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-emerald-500 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check_circle</span> Step 2</span>
              <span class="text-slate-300 material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">radio_button_checked</span> Step 3</span>
            </div>
          </div>
        }

        <!-- Header -->
        <header class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit Process Monitor' : 'Add Process Monitor' }}</h2>
          <button (click)="closeDrawer.emit()" class="flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full h-8 w-8 transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">

          @if (mode === 'onboarding') {
            <!-- Onboarding hint: required steps inside this drawer -->
            <section class="px-6 py-4 bg-primary/5 border-y border-primary/20">
              <p class="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Fill these to create a monitor</p>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <li class="flex items-center gap-1.5"
                    [class.text-emerald-700]="name().trim().length > 0"
                    [class.text-slate-600]="name().trim().length === 0">
                  <span class="material-symbols-outlined text-[14px]">{{ name().trim().length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  <span [class.line-through]="name().trim().length > 0">Name the monitor</span>
                </li>
                <li class="flex items-center gap-1.5"
                    [class.text-emerald-700]="project().trim().length > 0"
                    [class.text-slate-600]="project().trim().length === 0">
                  <span class="material-symbols-outlined text-[14px]">{{ project().trim().length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  <span [class.line-through]="project().trim().length > 0">Pick a project</span>
                </li>
                <li class="flex items-center gap-1.5"
                    [class.text-emerald-700]="scenario().trim().length > 0"
                    [class.text-slate-600]="scenario().trim().length === 0">
                  <span class="material-symbols-outlined text-[14px]">{{ scenario().trim().length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  <span [class.line-through]="scenario().trim().length > 0">Assign a scenario</span>
                </li>
                <li class="flex items-center gap-1.5"
                    [class.text-emerald-700]="scheduleSel().trim().length > 0"
                    [class.text-slate-600]="scheduleSel().trim().length === 0">
                  <span class="material-symbols-outlined text-[14px]">{{ scheduleSel().trim().length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  <span [class.line-through]="scheduleSel().trim().length > 0">Assign a schedule</span>
                </li>
                <li class="flex items-center gap-1.5 sm:col-span-2"
                    [class.text-emerald-700]="configuredEvents.length > 0"
                    [class.text-slate-600]="configuredEvents.length === 0">
                  <span class="material-symbols-outlined text-[14px]">{{ configuredEvents.length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  <span [class.line-through]="configuredEvents.length > 0">Add at least one event rule, then submit</span>
                </li>
              </ul>
            </section>
          }

          <!-- BASIC INFORMATION -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Basic Information</span>
              <p class="text-slate-500 text-xs mt-0.5">Define the core identity of this monitor.</p>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700">Monitor Name <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  [value]="name()"
                  (input)="name.set($any($event.target).value)"
                  placeholder="e.g. ERP Synchronization Check"
                  class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Project <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <select required [value]="project()" (change)="project.set($any($event.target).value); emitFields()"
                      class="block px-3 py-2.5 w-full text-sm text-slate-500 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                      <option value="">Select project...</option>
                      <option value="myproject">myproject</option>
                    </select>
                    <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Process / Scenario <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <select required [value]="scenario()" (change)="scenario.set($any($event.target).value); emitFields()"
                      class="block px-3 py-2.5 w-full text-sm text-slate-500 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                      <option value="">Select process...</option>
                      <option value="scenario2">scenario2</option>
                    </select>
                    <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- EXECUTION STRATEGY -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Execution Strategy</span>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-slate-700">Execution Schedule</label>
                  <button type="button" (click)="openAddSchedule.emit()" class="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">+ Add New</button>
                </div>
                <div class="relative">
                  <div class="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[18px]">schedule</span>
                  </div>
                  <select required [value]="scheduleSel()" (change)="scheduleSel.set($any($event.target).value); emitFields()"
                    class="block pl-9 pr-10 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    <option value="">Select schedule...</option>
                    <option value="Every 15 minutes">Every 15 minutes</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily at 09:00">Daily at 09:00</option>
                    <option value="Weekly on Monday">Weekly on Monday</option>
                  </select>
                  <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-slate-700">Maintenance Calendar</label>
                  <button type="button" class="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">+ Add New</button>
                </div>
                <div class="relative">
                  <select class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    <option>Standard Corporate Window</option>
                  </select>
                  <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- DISTRIBUTION -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Distribution</span>
            </div>
            <div class="flex flex-col gap-4">
              <div>
                <p class="text-sm font-medium text-slate-700 mb-2.5">Distribution Type</p>
                <div class="flex items-center gap-6">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="distType" value="individual"
                      [checked]="distributionType() === 'individual'"
                      (change)="distributionType.set('individual')"
                      class="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                    />
                    <span class="text-sm text-slate-700">rWatcher Selection</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="distType" value="group"
                      [checked]="distributionType() === 'group'"
                      (change)="distributionType.set('group')"
                      class="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                    />
                    <span class="text-sm text-slate-700">Group Based</span>
                  </label>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-slate-700">rWatcher / Group Selection</label>
                  <button type="button" (click)="openAddWatcher.emit()" class="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">+ Add New</button>
                </div>
                <div class="relative">
                  <select class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    @if (distributionType() === 'group') {
                      <option>All available watchers</option>
                      <option>All Windows Servers</option>
                      <option>Finance Department</option>
                      <option>European Region</option>
                    } @else {
                      <option>All available watchers</option>
                      <option>rWatcher001 (192.168.1.105)</option>
                      <option>rWatcher002 (192.168.1.106)</option>
                      <option>rWatcher003 (10.0.0.5)</option>
                    }
                  </select>
                  <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- EVENT TRIGGERS -->
          <section class="px-6 py-5">
            <div class="flex items-start justify-between mb-4">
              <div>
                <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Event Triggers <span class="text-rose-500">*</span></span>
                <p class="text-slate-500 text-xs mt-0.5">Define rules and notification responses. At least one is required.</p>
              </div>
              <button (click)="openAddEvent.emit()" class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                <span class="material-symbols-outlined text-[14px]">add</span> Add Rule
              </button>
            </div>
            @if (configuredEvents.length === 0) {
              <div class="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                No rules configured yet.
              </div>
            } @else {
              <div class="space-y-2">
                @for (evt of configuredEvents; track $index; let i = $index) {
                  <div class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div class="size-8 rounded-lg flex items-center justify-center shrink-0"
                      [ngClass]="evt.level === 'critical' ? 'bg-red-100 text-red-600' : evt.level === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'">
                      <span class="material-symbols-outlined text-sm">{{ evt.level === 'critical' ? 'error' : evt.level === 'warning' ? 'warning' : 'info' }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-medium text-slate-800">{{ evt.metric }} {{ evt.condition }} {{ evt.threshold }}</span>
                      <p class="text-xs text-slate-500 truncate">{{ evt.action }} → {{ evt.recipients || 'No recipients' }}</p>
                    </div>
                    <button (click)="removeEvent.emit(i)" class="size-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Error Message Option -->
          <section class="px-6 py-4">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" class="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" />
              <span class="text-slate-600 text-sm">Do not show error message on failure images</span>
            </label>
          </section>

        </div>

        <!-- Footer -->
        <footer class="border-t border-slate-100 px-6 py-4 bg-white flex items-center justify-end gap-3">
          <button (click)="closeDrawer.emit()" class="px-5 py-2 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <div class="relative inline-block">
            <button (click)="nextStep.emit()"
              [disabled]="!canSave()"
              class="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20 relative z-10 disabled:opacity-40 disabled:cursor-not-allowed">
              <span class="material-symbols-outlined text-[16px]">rocket_launch</span>
              {{ isEditing ? 'Save Changes' : 'Create Monitor' }}
            </button>
            @if (mode === 'onboarding') {
              <div class="absolute bottom-full mb-4 right-0 bg-slate-800 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-xl w-max max-w-[260px] text-center animate-bounce z-20 whitespace-normal leading-relaxed">
                🎉 Finally, link them together! Click Create Monitor to activate.
                <div class="absolute -bottom-1.5 right-8 w-3 h-3 bg-slate-800 rotate-45"></div>
              </div>
              <div class="absolute inset-0 rounded-full bg-primary/40 animate-ping z-0"></div>
            }
          </div>
        </footer>

      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out forwards;
    }
  `]
})
export class CreateProcessMonitorDrawerComponent {
  @Input() mode: 'onboarding' | 'standalone' = 'standalone';
  @Input() isEditing = false;
  @Input() monitorName = '';
  @Input() configuredEvents: {metric: string; condition: string; threshold: string; level: string; action: string; recipients: string}[] = [];
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() openAddWatcher = new EventEmitter<void>();
  @Output() openAddSchedule = new EventEmitter<void>();
  @Output() openAddEvent = new EventEmitter<void>();
  @Output() removeEvent = new EventEmitter<number>();
  @Output() fieldsChanged = new EventEmitter<{project: string; scenario: string; scheduleSel: string}>();

  emitFields() {
    this.fieldsChanged.emit({
      project: this.project(),
      scenario: this.scenario(),
      scheduleSel: this.scheduleSel()
    });
  }

  distributionType = signal<'individual' | 'group'>('individual');
  name = signal<string>('');
  project = signal<string>('');
  scenario = signal<string>('');
  scheduleSel = signal<string>('');

  canSave() {
    const baseFilled = this.name().trim().length > 0
      && this.project().trim().length > 0
      && this.scenario().trim().length > 0
      && this.scheduleSel().trim().length > 0;
    if (this.mode === 'onboarding') {
      return baseFilled && this.configuredEvents.length > 0;
    }
    return baseFilled;
  }
}
