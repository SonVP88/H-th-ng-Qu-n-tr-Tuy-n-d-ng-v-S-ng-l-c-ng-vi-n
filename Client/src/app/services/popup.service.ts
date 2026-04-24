import { Injectable, signal } from '@angular/core';

export type PopupKind = 'alert' | 'confirm' | 'prompt';
export type PopupTone = 'primary' | 'danger' | 'neutral';

export interface PopupOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: PopupTone;
  placeholder?: string;
  initialValue?: string;
  multiline?: boolean;
}

export interface PopupState extends PopupOptions {
  isOpen: boolean;
  kind: PopupKind;
}

@Injectable({ providedIn: 'root' })
export class PopupService {
  readonly state = signal<PopupState>({
    isOpen: false,
    kind: 'alert',
    title: '',
    message: '',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy',
    tone: 'primary',
    placeholder: '',
    initialValue: '',
    multiline: false,
  });

  private resolver: ((value: boolean | string | null) => void) | null = null;

  alert(options: PopupOptions): Promise<void> {
    this.open('alert', options);
    return new Promise<void>((resolve) => {
      this.resolver = () => resolve();
    });
  }

  confirm(options: PopupOptions): Promise<boolean> {
    this.open('confirm', options);
    return new Promise<boolean>((resolve) => {
      this.resolver = (value) => resolve(Boolean(value));
    });
  }

  prompt(options: PopupOptions): Promise<string | null> {
    this.open('prompt', options);
    return new Promise<string | null>((resolve) => {
      this.resolver = (value) => {
        if (typeof value === 'string') {
          resolve(value);
          return;
        }
        resolve(null);
      };
    });
  }

  resolve(value: boolean | string | null): void {
    const callback = this.resolver;
    this.resolver = null;
    this.state.update((s) => ({ ...s, isOpen: false }));
    callback?.(value);
  }

  private open(kind: PopupKind, options: PopupOptions): void {
    this.state.set({
      isOpen: true,
      kind,
      title: options.title,
      message: options.message ?? '',
      confirmText: options.confirmText ?? 'Xác nhận',
      cancelText: options.cancelText ?? 'Hủy',
      tone: options.tone ?? 'primary',
      placeholder: options.placeholder ?? '',
      initialValue: options.initialValue ?? '',
      multiline: options.multiline ?? false,
    });
  }
}