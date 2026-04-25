import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotAdminService, ChatbotFaqItem, UpsertChatbotFaqPayload } from '../../../services/chatbot-admin.service';
import { ToastService } from '../../../services/toast.service';
import { PopupService } from '../../../services/popup.service';

@Component({
    selector: 'app-chatbot-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIf, NgFor],
    templateUrl: './chatbot-admin.html',
    styleUrl: './chatbot-admin.scss'
})
export class ChatbotAdminComponent implements OnInit {
    faqs: ChatbotFaqItem[] = [];
    filteredFaqs: ChatbotFaqItem[] = [];

    searchQuery = '';
    statusFilter: 'all' | 'active' | 'inactive' = 'all';

    isLoading = false;
    isModalOpen = false;
    isSaving = false;
    modalMode: 'create' | 'edit' = 'create';
    editingFaqId: string | null = null;

    form: UpsertChatbotFaqPayload = {
        question: '',
        answer: '',
        category: 'Chung',
        keywords: '',
        priority: 0,
        isActive: true
    };

    constructor(
        private chatbotAdminService: ChatbotAdminService,
        private toast: ToastService,
        private popup: PopupService
    ) { }

    ngOnInit(): void {
        this.loadFaqs();
    }

    loadFaqs(): void {
        this.isLoading = true;
        const status = this.statusFilter === 'all'
            ? undefined
            : this.statusFilter === 'active';

        this.chatbotAdminService.getFaqs(this.searchQuery, status).subscribe({
            next: (items) => {
                this.faqs = items;
                this.filteredFaqs = items;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this.toast.error('Lỗi', err.error?.message || 'Không thể tải dữ liệu FAQ chatbot.');
            }
        });
    }

    applyFilter(): void {
        this.loadFaqs();
    }

    openCreateModal(): void {
        this.modalMode = 'create';
        this.editingFaqId = null;
        this.form = {
            question: '',
            answer: '',
            category: 'Chung',
            keywords: '',
            priority: 0,
            isActive: true
        };
        this.isModalOpen = true;
    }

    openEditModal(item: ChatbotFaqItem): void {
        this.modalMode = 'edit';
        this.editingFaqId = item.faqId;
        this.form = {
            question: item.question,
            answer: item.answer,
            category: item.category,
            keywords: item.keywords || '',
            priority: item.priority,
            isActive: item.isActive
        };
        this.isModalOpen = true;
    }

    closeModal(): void {
        if (this.isSaving) {
            return;
        }
        this.isModalOpen = false;
    }

    saveFaq(): void {
        if (!this.form.question.trim() || !this.form.answer.trim()) {
            this.toast.warning('Thiếu dữ liệu', 'Câu hỏi và câu trả lời là bắt buộc.');
            return;
        }

        this.isSaving = true;
        const payload: UpsertChatbotFaqPayload = {
            question: this.form.question.trim(),
            answer: this.form.answer.trim(),
            category: this.form.category?.trim() || 'Chung',
            keywords: this.form.keywords?.trim() || '',
            priority: Number(this.form.priority) || 0,
            isActive: this.form.isActive
        };

        const request$ = this.modalMode === 'create'
            ? this.chatbotAdminService.createFaq(payload)
            : this.chatbotAdminService.updateFaq(this.editingFaqId!, payload);

        request$.subscribe({
            next: (res) => {
                this.isSaving = false;
                this.isModalOpen = false;
                this.toast.success('Thành công', res?.message || 'Lưu FAQ thành công.');
                this.loadFaqs();
            },
            error: (err) => {
                this.isSaving = false;
                this.toast.error('Lỗi', err.error?.message || 'Không thể lưu FAQ.');
            }
        });
    }

    async toggleFaq(item: ChatbotFaqItem): Promise<void> {
        const confirmed = await this.popup.confirm({
            title: item.isActive ? 'Tắt FAQ' : 'Bật FAQ',
            message: item.isActive
                ? 'FAQ sẽ không còn được dùng để trả lời nhanh.'
                : 'FAQ sẽ được dùng cho lớp trả lời nhanh trước AI.',
            confirmText: item.isActive ? 'Tắt' : 'Bật',
            cancelText: 'Hủy',
            tone: item.isActive ? 'danger' : 'primary'
        });

        if (!confirmed) {
            return;
        }

        this.chatbotAdminService.toggleFaq(item.faqId).subscribe({
            next: (res) => {
                this.toast.success('Thành công', res?.message || 'Cập nhật trạng thái thành công.');
                this.loadFaqs();
            },
            error: (err) => {
                this.toast.error('Lỗi', err.error?.message || 'Không thể cập nhật trạng thái FAQ.');
            }
        });
    }

    async deleteFaq(item: ChatbotFaqItem): Promise<void> {
        const confirmed = await this.popup.confirm({
            title: 'Xóa FAQ',
            message: 'FAQ sẽ bị xóa vĩnh viễn. Bạn có chắc muốn tiếp tục?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            tone: 'danger'
        });

        if (!confirmed) {
            return;
        }

        this.chatbotAdminService.deleteFaq(item.faqId).subscribe({
            next: (res) => {
                this.toast.success('Thành công', res?.message || 'Xóa FAQ thành công.');
                this.loadFaqs();
            },
            error: (err) => {
                this.toast.error('Lỗi', err.error?.message || 'Không thể xóa FAQ.');
            }
        });
    }
}
