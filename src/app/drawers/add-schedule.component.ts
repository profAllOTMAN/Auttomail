import { Component, EventEmitter, Output, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-schedule-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
      <div class="w-full max-w-[560px] bg-white h-full shadow-2xl flex flex-col animate-slide-in">

        <!-- Onboarding Stepper -->
        @if (mode === 'onboarding') {
          <div class="w-full bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">In progress (2/3)</span>
            <div class="flex items-center gap-2 text-xs font-semibold tracking-wider">
              <span class="text-emerald-500 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check_circle</span> Step 1</span>
              <span class="text-slate-300 material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">radio_button_checked</span> Step 2</span>
              <span class="text-slate-300 material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-slate-400 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">radio_button_unchecked</span> Step 3</span>
            </div>
          </div>
        }

        <!-- Header -->
        <header class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 class="text-lg font-bold text-slate-900">New Schedule</h2>
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
              <p class="text-slate-500 text-xs mt-0.5">Name and describe this schedule for easy identification.</p>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700">Schedule Name <span class="text-red-400">*</span></label>
                <input type="text" required [value]="scheduleName()" (input)="scheduleName.set($any($event.target).value)" placeholder="e.g. Business Hours – Every 15 min" class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700">Description <span class="text-slate-400 font-normal">(optional)</span></label>
                <textarea rows="2" placeholder="Briefly describe when and why this schedule runs..." class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder-slate-400"></textarea>
              </div>
            </div>
          </section>

          <!-- TIMEZONE -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Timezone</span>
              <p class="text-slate-500 text-xs mt-0.5">All schedule times are interpreted in this timezone.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-slate-700">Schedule Timezone</label>
              <div class="relative">
                <div class="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-slate-400 text-[18px]">public</span>
                </div>
                <select class="block pl-9 pr-10 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                  <option>UTC</option>
                  <option>Pacific Time (UTC-8)</option>
                  <option>Eastern Time (UTC-5)</option>
                  <option>Central European Time (UTC+1)</option>
                </select>
                <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                  <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </section>

          <!-- FREQUENCY -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Frequency</span>
              <p class="text-slate-500 text-xs mt-0.5">How often should this schedule run?</p>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
              @for (opt of frequencyOptions; track opt.value) {
                <button
                  type="button"
                  (click)="selectedFrequency.set(opt.value)"
                  [class]="selectedFrequency() === opt.value
                    ? 'flex items-center gap-3 p-3 rounded-lg border-2 border-primary bg-primary/5 text-left transition-all'
                    : 'flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white text-left hover:border-slate-300 transition-all'"
                >
                  <span class="material-symbols-outlined text-[18px]" [class]="selectedFrequency() === opt.value ? 'text-primary' : 'text-slate-400'">{{ opt.icon }}</span>
                  <div>
                    <span class="text-sm font-semibold block" [class]="selectedFrequency() === opt.value ? 'text-primary' : 'text-slate-700'">{{ opt.label }}</span>
                    <span class="text-[11px] text-slate-500">{{ opt.desc }}</span>
                  </div>
                </button>
              }
            </div>

            <!-- Time picker for daily/weekly -->
            @if (selectedFrequency() === 'daily' || selectedFrequency() === 'weekly') {
              <div class="flex flex-col gap-1.5 mt-4">
                <label class="text-sm font-medium text-slate-700">Run at</label>
                <input type="time" value="09:00" class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            }

            <!-- Interval picker for interval options -->
            @if (selectedFrequency() === 'every15' || selectedFrequency() === 'hourly') {
              <div class="bg-slate-50 rounded-lg p-3 mt-4 flex items-center gap-2 text-sm text-slate-600">
                <span class="material-symbols-outlined text-[16px] text-primary">info</span>
                Runs {{ selectedFrequency() === 'every15' ? 'every 15 minutes' : 'every hour' }} during active days.
              </div>
            }
          </section>

          <!-- ACTIVE DAYS -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Active Days</span>
              <p class="text-slate-500 text-xs mt-0.5">Select the days this schedule is active.</p>
            </div>
            <div class="grid grid-cols-7 gap-2">
              @for (day of days; track day.short) {
                <label class="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" [checked]="day.checked" class="sr-only peer" />
                  <div class="w-full py-2.5 rounded-lg border border-slate-200 bg-white text-center text-xs font-semibold text-slate-500 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary group-hover:border-primary/40 transition-all select-none">
                    {{ day.short }}
                  </div>
                </label>
              }
            </div>
          </section>

        </div>

        <!-- Footer -->
        <footer class="border-t border-slate-100 px-6 py-4 bg-white flex items-center justify-end gap-3">
          <button (click)="closeDrawer.emit()" class="px-5 py-2 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <div class="relative inline-block">
            <button (click)="nextStep.emit()" [disabled]="!canSave()" class="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20 relative z-10 disabled:opacity-40 disabled:cursor-not-allowed">
              <span class="material-symbols-outlined text-[16px]">schedule</span>
              {{ mode === 'onboarding' ? 'Next Step' : 'Save Schedule' }}
            </button>
            @if (mode === 'onboarding') {
              <div class="absolute bottom-full mb-4 right-0 bg-slate-800 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-xl w-max max-w-[260px] text-center animate-bounce z-20 whitespace-normal leading-relaxed">
                ⏱️ Choose when your tasks should run automatically. Click Next to continue!
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
export class AddScheduleDrawerComponent {
  @Input() mode: 'onboarding' | 'standalone' = 'standalone';
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();

  selectedFrequency = signal<string>('every15');
  scheduleName = signal<string>('');

  canSave() {
    return this.scheduleName().trim().length > 0;
  }

  frequencyOptions = [
    { value: 'every15', label: 'Every 15 min', desc: 'High frequency checks', icon: 'speed' },
    { value: 'hourly', label: 'Hourly', desc: 'Once per hour', icon: 'repeat' },
    { value: 'daily', label: 'Daily', desc: 'Run once a day', icon: 'today' },
    { value: 'weekly', label: 'Weekly', desc: 'Run once a week', icon: 'date_range' },
  ];

  days = [
    { short: 'Mon', checked: true },
    { short: 'Tue', checked: true },
    { short: 'Wed', checked: true },
    { short: 'Thu', checked: true },
    { short: 'Fri', checked: true },
    { short: 'Sat', checked: false },
    { short: 'Sun', checked: false },
  ];
}
