import { Component, EventEmitter, Output, Input, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TestPlanProcessForm {
  name: string;
  scenarioId: string;
  distributeBy: 'percentage' | 'rLoaders';
  rLoaders: number;
  pacing: number;
  pacingRandomize: boolean;
  halt: 'first-error' | 'continue';
  rdvFile: string;
  dataFile: string;
  description: string;
}

@Component({
  selector: 'app-add-test-plan-process-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
      <div class="w-full max-w-[560px] bg-white h-full shadow-2xl flex flex-col drawer-slide-in">

        <header class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            <h2 class="text-lg font-bold text-slate-900">{{ editing ? 'Edit process' : 'Add process to test plan' }}</h2>
            <p class="text-xs text-slate-500 mt-0.5">Configure how this scenario participates in the load test.</p>
          </div>
          <button (click)="closeDrawer.emit()" class="flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full h-8 w-8 transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">

          <!-- 1. Process -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">Process</span>
              <p class="text-slate-500 text-xs mt-0.5">Pick a recorded scenario from the project assigned to this test plan.</p>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="proc-scenario" class="text-sm font-medium text-slate-700">Scenario <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select id="proc-scenario" required [value]="scenarioId()" (change)="setScenario($any($event.target).value)"
                    class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    <option value="">Select a scenario...</option>
                    @for (opt of scenarioOptions; track opt) {
                      <option [value]="opt">{{ opt }}</option>
                    }
                  </select>
                  <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                </div>
                <p class="text-[11px] text-slate-500">Only scenarios from project <span class="font-semibold text-slate-700">{{ project || '—' }}</span> are listed.</p>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="proc-name" class="text-sm font-medium text-slate-700">Display name</label>
                <input id="proc-name" type="text" [value]="displayName()" (input)="displayName.set($any($event.target).value)"
                  placeholder="Defaults to scenario name"
                  class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="proc-desc" class="text-sm font-medium text-slate-700">Description <span class="text-slate-400 font-normal">(optional)</span></label>
                <textarea id="proc-desc" rows="2" [value]="description()" (input)="description.set($any($event.target).value)"
                  placeholder="Notes for whoever reads the execution plan"
                  class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"></textarea>
              </div>
            </div>
          </section>

          <!-- 2. Distribution -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">Distribute by</span>
              <p class="text-slate-500 text-xs mt-0.5">How many of the test plan's rLoaders run this process.</p>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
              <button type="button" (click)="distributeBy.set('percentage')"
                class="px-3 py-3 rounded-lg border text-left transition-colors"
                [class.border-emerald-500]="distributeBy() === 'percentage'"
                [class.bg-emerald-50]="distributeBy() === 'percentage'"
                [class.border-slate-200]="distributeBy() !== 'percentage'">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-[18px]" [class.text-emerald-600]="distributeBy() === 'percentage'" [class.text-slate-400]="distributeBy() !== 'percentage'">percent</span>
                  <span class="text-sm font-semibold text-slate-800">Percentage</span>
                </div>
                <p class="text-[11px] text-slate-500">Share of the total rLoaders.</p>
              </button>
              <button type="button" (click)="distributeBy.set('rLoaders')"
                class="px-3 py-3 rounded-lg border text-left transition-colors"
                [class.border-emerald-500]="distributeBy() === 'rLoaders'"
                [class.bg-emerald-50]="distributeBy() === 'rLoaders'"
                [class.border-slate-200]="distributeBy() !== 'rLoaders'">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-[18px]" [class.text-emerald-600]="distributeBy() === 'rLoaders'" [class.text-slate-400]="distributeBy() !== 'rLoaders'">group</span>
                  <span class="text-sm font-semibold text-slate-800">Fixed rLoaders</span>
                </div>
                <p class="text-[11px] text-slate-500">Exact number of rLoaders.</p>
              </button>
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="proc-loaders" class="text-sm font-medium text-slate-700">
                {{ distributeBy() === 'percentage' ? '# of rLoaders (% of total)' : '# of rLoaders' }}
                <span class="text-red-500">*</span>
              </label>
              <input id="proc-loaders" type="number" min="1" [value]="rLoaders()" (input)="rLoaders.set(+$any($event.target).value || 0)"
                class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              @if (distributeBy() === 'percentage') {
                <p class="text-[11px] text-slate-500">100% = every rLoader on this test plan runs this process.</p>
              }
            </div>
          </section>

          <!-- 3. Pacing & halt -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">Pacing &amp; halt</span>
              <p class="text-slate-500 text-xs mt-0.5">Time between iterations and what to do on failure.</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="proc-pacing" class="text-sm font-medium text-slate-700">Pacing (seconds)</label>
                <input id="proc-pacing" type="number" min="0" [value]="pacing()" (input)="pacing.set(+$any($event.target).value || 0)"
                  class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="proc-halt" class="text-sm font-medium text-slate-700">Halt on</label>
                <div class="relative">
                  <select id="proc-halt" [value]="halt()" (change)="halt.set($any($event.target).value)"
                    class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    <option value="continue">Continue on error</option>
                    <option value="first-error">Stop on first error</option>
                  </select>
                  <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
            <label class="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" [checked]="pacingRandomize()" (change)="pacingRandomize.set($any($event.target).checked)"
                class="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span class="text-sm text-slate-700">Randomize pacing by ±25% to simulate real user wait times</span>
            </label>
          </section>

          <!-- 4. RDV / data files -->
          <section class="px-6 py-5">
            <div class="mb-4">
              <span class="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">RDV &amp; data files <span class="text-slate-400 font-normal normal-case tracking-normal">(optional)</span></span>
              <p class="text-slate-500 text-xs mt-0.5">Rendezvous point and parameterized data attached to this process.</p>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="proc-rdv" class="text-sm font-medium text-slate-700">RDV file</label>
                <div class="relative">
                  <select id="proc-rdv" [value]="rdvFile()" (change)="rdvFile.set($any($event.target).value)"
                    class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    <option value="">None</option>
                    <option value="checkout-rdv">checkout-rdv.txt</option>
                    <option value="login-rdv">login-rdv.txt</option>
                  </select>
                  <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="proc-data" class="text-sm font-medium text-slate-700">Data file</label>
                <div class="relative">
                  <select id="proc-data" [value]="dataFile()" (change)="dataFile.set($any($event.target).value)"
                    class="block px-3 py-2.5 w-full text-sm text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                    <option value="">None</option>
                    <option value="users.csv">users.csv</option>
                    <option value="products.csv">products.csv</option>
                  </select>
                  <div class="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        <!-- Footer -->
        <footer class="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 bg-white">
          <button (click)="closeDrawer.emit()" class="px-4 py-2 rounded-full text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button (click)="emitSave()" [disabled]="!canSave()"
            class="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <span class="material-symbols-outlined text-[16px]">{{ editing ? 'save' : 'add' }}</span>
            {{ editing ? 'Save changes' : 'Add to test plan' }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class AddTestPlanProcessDrawerComponent implements OnChanges {
  @Input() project = '';
  @Input() scenarioOptions: string[] = [];
  @Input() editing = false;
  @Input() initial: TestPlanProcessForm | null = null;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() save = new EventEmitter<TestPlanProcessForm>();

  scenarioId = signal<string>('');
  displayName = signal<string>('');
  description = signal<string>('');
  distributeBy = signal<'percentage' | 'rLoaders'>('percentage');
  rLoaders = signal<number>(100);
  pacing = signal<number>(0);
  pacingRandomize = signal<boolean>(false);
  halt = signal<'first-error' | 'continue'>('continue');
  rdvFile = signal<string>('');
  dataFile = signal<string>('');

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initial']) {
      const v = this.initial;
      if (v) {
        this.scenarioId.set(v.scenarioId);
        this.displayName.set(v.name);
        this.description.set(v.description);
        this.distributeBy.set(v.distributeBy);
        this.rLoaders.set(v.rLoaders);
        this.pacing.set(v.pacing);
        this.pacingRandomize.set(v.pacingRandomize);
        this.halt.set(v.halt);
        this.rdvFile.set(v.rdvFile);
        this.dataFile.set(v.dataFile);
      } else {
        this.reset();
      }
    }
  }

  reset() {
    this.scenarioId.set('');
    this.displayName.set('');
    this.description.set('');
    this.distributeBy.set('percentage');
    this.rLoaders.set(100);
    this.pacing.set(0);
    this.pacingRandomize.set(false);
    this.halt.set('continue');
    this.rdvFile.set('');
    this.dataFile.set('');
  }

  setScenario(id: string) {
    this.scenarioId.set(id);
    if (!this.displayName().trim()) this.displayName.set(id);
  }

  canSave() {
    return this.scenarioId().trim().length > 0 && this.rLoaders() > 0;
  }

  emitSave() {
    if (!this.canSave()) return;
    this.save.emit({
      name: this.displayName().trim() || this.scenarioId(),
      scenarioId: this.scenarioId(),
      distributeBy: this.distributeBy(),
      rLoaders: this.rLoaders(),
      pacing: this.pacing(),
      pacingRandomize: this.pacingRandomize(),
      halt: this.halt(),
      rdvFile: this.rdvFile(),
      dataFile: this.dataFile(),
      description: this.description().trim(),
    });
  }
}
