import { Component, EventEmitter, Output, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-watcher-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
      <div class="w-full max-w-[560px] bg-white h-full shadow-2xl flex flex-col animate-slide-in">

        <!-- Onboarding Stepper -->
        @if (mode === 'onboarding') {
          <div class="w-full bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">In progress (1/3)</span>
            <div class="flex items-center gap-2 text-xs font-semibold tracking-wider">
              <span class="text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">radio_button_checked</span> Step 1</span>
              <span class="text-slate-300 material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-slate-400 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">radio_button_unchecked</span> Step 2</span>
              <span class="text-slate-300 material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-slate-400 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">radio_button_unchecked</span> Step 3</span>
            </div>
          </div>
        }

        <!-- Header -->
        <header class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 class="text-lg font-bold text-slate-900">Add rWatcher</h2>
          <button (click)="closeDrawer.emit()" class="flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full h-8 w-8 transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">

          <!-- 1. IDENTITY — most critical, shown first -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Identity</span>
              <p class="text-slate-500 text-xs mt-0.5">This is how the rWatcher will appear across all monitors and reports.</p>
            </div>
            <div class="flex flex-col gap-4">
              <!-- Alias — most important field, visually prominent -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5">
                  <label class="text-sm font-semibold text-slate-800">Alias <span class="text-red-500">*</span></label>
                  <span class="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wide">Required</span>
                </div>
                <input
                  type="text"
                  required
                  [value]="alias()"
                  (input)="alias.set($any($event.target).value)"
                  placeholder="e.g. rWatcher-NYC-01"
                  class="block px-3 py-3 w-full text-sm font-medium text-slate-900 bg-white rounded-lg border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 transition-colors"
                />
                <p class="text-xs text-slate-500">Use a name that clearly identifies the machine's location or role.</p>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700">Description <span class="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  rows="2"
                  placeholder="Describe the purpose or location of this rWatcher..."
                  class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder-slate-400"
                ></textarea>
              </div>
            </div>
          </section>

          <!-- 2. MACHINE CONFIGURATION -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Machine Configuration</span>
              <p class="text-slate-500 text-xs mt-0.5">Select the BotManager that will host and manage this rWatcher.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-slate-700">BotManager <span class="text-red-500">*</span></label>
              <div class="relative">
                <select required [value]="botManager()" (change)="botManager.set($any($event.target).value)"
                  class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                  <option value="">Select a BotManager...</option>
                  <option value="BotManager-1">BotManager-1 (Online)</option>
                  <option value="BotManager-2">BotManager-2 (Offline)</option>
                </select>
                <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                  <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. CREDENTIALS -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Credentials</span>
              <p class="text-slate-500 text-xs mt-0.5">Windows account used to log into this machine via RDP.</p>
            </div>
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Username <span class="text-red-500">*</span></label>
                  <input type="text" required [value]="username()" (input)="username.set($any($event.target).value)" placeholder="e.g. DOMAIN\\user" class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Password <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <input type="password" required [value]="password()" (input)="password.set($any($event.target).value)" class="block px-3 py-2.5 pr-10 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <button class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors" title="Toggle visibility">
                      <span class="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                  </div>
                  <span class="text-[10px] text-slate-400">Minimum 6 characters</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700">Domain <span class="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. CORP" class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400" />
              </div>
            </div>
          </section>

          <!-- 4. RDP PARAMETERS — with caution notice -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold tracking-widest text-primary uppercase">RDP Parameters</span>
              </div>
              <p class="text-slate-500 text-xs mt-0.5">Remote Desktop settings applied when connecting to this machine.</p>
            </div>

            <!-- Caution banner -->
            <div class="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
              <span class="material-symbols-outlined text-amber-500 text-[18px] mt-0.5 shrink-0">warning</span>
              <p class="text-xs text-amber-800 leading-relaxed">
                <span class="font-semibold">Double-check these settings.</span> Incorrect resolution, color depth, or IP address may prevent the rWatcher from connecting. Verify values with your system administrator before saving.
              </p>
            </div>

            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Resolution</label>
                  <div class="relative">
                    <select class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                      <option>1280x1024</option>
                      <option>1920x1080</option>
                      <option>1600x900</option>
                    </select>
                    <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Color Depth</label>
                  <div class="relative">
                    <select class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                      <option>32-bit</option>
                      <option>16-bit</option>
                    </select>
                    <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center gap-1">
                    <label class="text-sm font-medium text-slate-700">BotManager IP</label>
                    <span class="material-symbols-outlined text-slate-400 text-[14px]" title="IP or hostname used when downloading the RDP file">info</span>
                  </div>
                  <input type="text" value="ec2amaz-ts88pb7" class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-slate-700">Connection Timeout</label>
                  <div class="relative">
                    <input type="number" value="30" min="5" max="300" class="block px-3 py-2.5 pr-16 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span class="absolute right-3 top-0 bottom-0 flex items-center text-xs text-slate-400 pointer-events-none">seconds</span>
                  </div>
                </div>
              </div>
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
              <span class="material-symbols-outlined text-[16px]">desktop_windows</span>
              {{ mode === 'onboarding' ? 'Next Step' : 'Add rWatcher' }}
            </button>
            @if (mode === 'onboarding') {
              <div class="absolute bottom-full mb-4 right-0 bg-slate-800 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-xl w-max max-w-[260px] text-center animate-bounce z-20 whitespace-normal leading-relaxed">
                🤖 An rWatcher is the machine that runs your tasks. Click Next when ready!
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
export class AddWatcherDrawerComponent {
  @Input() mode: 'onboarding' | 'standalone' = 'standalone';
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();

  alias = signal<string>('');
  botManager = signal<string>('');
  username = signal<string>('');
  password = signal<string>('');

  canSave() {
    return this.alias().trim().length > 0
      && this.botManager().trim().length > 0
      && this.username().trim().length > 0
      && this.password().length >= 6;
  }
}
