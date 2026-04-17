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

          <!-- BASIC INFORMATION -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Basic Information</span>
              <p class="text-slate-500 text-xs mt-0.5">Define the core identity of this monitor.</p>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700">Monitor Name</label>
                <input
                  type="text"
                  placeholder="e.g. ERP Synchronization Check"
                  class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Project</label>
                  <div class="relative">
                    <select class="block px-3 py-2.5 w-full text-sm text-slate-500 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                      <option value="" disabled selected>Select project...</option>
                      <option>myproject</option>
                    </select>
                    <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Process / Scenario</label>
                  <div class="relative">
                    <select class="block px-3 py-2.5 w-full text-sm text-slate-500 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                      <option value="" disabled selected>Select process...</option>
                      <option>scenario2</option>
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
                  <select class="block pl-9 pr-10 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    <option value="" disabled selected>Select schedule...</option>
                    <option>Every 15 minutes</option>
                    <option>Hourly</option>
                    <option>Daily at 09:00</option>
                    <option>Weekly on Monday</option>
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
                <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Event Triggers</span>
                <p class="text-slate-500 text-xs mt-0.5">Define rules and automated responses.</p>
              </div>
              <button class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                <span class="material-symbols-outlined text-[14px]">add</span> Add Rule
              </button>
            </div>
            <div class="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
              No rules configured yet.
            </div>
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
            <button (click)="nextStep.emit()" class="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20 relative z-10">
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
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() openAddWatcher = new EventEmitter<void>();
  @Output() openAddSchedule = new EventEmitter<void>();

  distributionType = signal<'individual' | 'group'>('individual');
}
