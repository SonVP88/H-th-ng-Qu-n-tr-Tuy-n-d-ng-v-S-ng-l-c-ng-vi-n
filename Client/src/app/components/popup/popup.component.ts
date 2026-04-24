import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PopupService } from '../../services/popup.service';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="popup.state().isOpen"
      class="fixed inset-0 z-[100000] flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" (click)="onCancel()"></div>

      <div class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div class="h-1.5" [ngClass]="getAccentClass()"></div>

        <div class="px-6 pt-5 pb-2 flex items-start gap-3">
          <div class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full" [ngClass]="getIconBgClass()">
            <span class="material-symbols-outlined text-[20px]" [ngClass]="getIconTextClass()">{{ getIcon() }}</span>
          </div>
          <div class="flex-1">
            <h3 class="text-[18px] leading-6 font-semibold text-slate-900">{{ popup.state().title }}</h3>
            <p *ngIf="popup.state().message" class="mt-1 text-[14px] leading-6 text-slate-600 whitespace-pre-line">
              {{ popup.state().message }}
            </p>
          </div>
        </div>

        <div class="px-6 pb-2" *ngIf="popup.state().kind === 'prompt'">
          <textarea
            *ngIf="popup.state().multiline"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            [placeholder]="popup.state().placeholder"
            rows="4"
            [(ngModel)]="inputValue"
          ></textarea>

          <input
            *ngIf="!popup.state().multiline"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            [placeholder]="popup.state().placeholder"
            [(ngModel)]="inputValue"
          />
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-5 bg-slate-50">
          <button
            *ngIf="popup.state().kind !== 'alert'"
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            (click)="onCancel()"
          >
            {{ popup.state().cancelText || 'Hủy' }}
          </button>

          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
            [ngClass]="getConfirmClass()"
            (click)="onConfirm()"
          >
            {{ popup.state().confirmText || 'Xác nhận' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class PopupComponent {
  inputValue = '';

  constructor(public popup: PopupService) {
    effect(() => {
      const state = this.popup.state();
      if (state.isOpen && state.kind === 'prompt') {
        this.inputValue = state.initialValue ?? '';
      }
      if (!state.isOpen) {
        this.inputValue = '';
      }
    });
  }

  private snapshot() {
    return this.popup.state();
  }

  onCancel(): void {
    if (this.snapshot().kind === 'alert') {
      return;
    }
    this.popup.resolve(false);
  }

  onConfirm(): void {
    const state = this.snapshot();

    if (state.kind === 'prompt') {
      this.popup.resolve(this.inputValue);
      this.inputValue = '';
      return;
    }

    if (state.kind === 'confirm') {
      this.popup.resolve(true);
      return;
    }

    this.popup.resolve(true);
  }

  getIcon(): string {
    const state = this.snapshot();
    if (state.kind === 'prompt') return 'edit_note';
    if (state.tone === 'danger') return 'warning';
    return state.kind === 'alert' ? 'info' : 'help';
  }

  getAccentClass(): string {
    const tone = this.snapshot().tone;
    if (tone === 'danger') return 'bg-gradient-to-r from-rose-500 to-red-500';
    if (tone === 'neutral') return 'bg-gradient-to-r from-slate-500 to-slate-600';
    return 'bg-gradient-to-r from-blue-500 to-cyan-500';
  }

  getIconBgClass(): string {
    const tone = this.snapshot().tone;
    if (tone === 'danger') return 'bg-rose-100';
    if (tone === 'neutral') return 'bg-slate-100';
    return 'bg-blue-100';
  }

  getIconTextClass(): string {
    const tone = this.snapshot().tone;
    if (tone === 'danger') return 'text-rose-600';
    if (tone === 'neutral') return 'text-slate-600';
    return 'text-blue-600';
  }

  getConfirmClass(): string {
    const tone = this.snapshot().tone;
    if (tone === 'danger') return 'bg-rose-600 hover:bg-rose-700';
    if (tone === 'neutral') return 'bg-slate-700 hover:bg-slate-800';
    return 'bg-blue-600 hover:bg-blue-700';
  }
}