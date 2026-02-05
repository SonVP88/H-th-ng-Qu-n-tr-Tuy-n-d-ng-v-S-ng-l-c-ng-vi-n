import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OfferService } from '../../../services/offer.service';

@Component({
    selector: 'app-offer-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './offer-modal.html',
    styleUrl: './offer-modal.scss'
})
export class OfferModalComponent {
    // ==================== Input/Output ====================
    @Input() isOpen: boolean = false;
    @Input() candidate: any = null; // Thông tin ứng viên từ component cha
    @Output() close = new EventEmitter<void>();
    @Output() offerSent = new EventEmitter<any>();

    // ==================== Offer Data Model ====================
    offerData = {
        salary: null as number | null,
        startDate: '' as string,
        expiryDate: '' as string,
        contractType: '' as string,
        ccInterviewer: true as boolean, // Checkbox: CC người phỏng vấn (default ON)
        additionalCcEmails: '' as string // Thêm CC (comma-separated emails)
    };

    // ==================== Constructor ====================
    constructor(private offerService: OfferService) { }

    // ==================== Methods ====================

    /**
     * Chuyển đổi mã loại hợp đồng sang tên tiếng Việt
     */
    getContractTypeName(type: string): string {
        const contractTypes: { [key: string]: string } = {
            'PROBATION': 'Thử việc 2 tháng',
            'OFFICIAL_1Y': 'Chính thức 1 năm',
            'OFFICIAL_3Y': 'Chính thức 3 năm',
            'FREELANCE': 'Cộng tác viên (Freelance)'
        };
        return contractTypes[type] || type;
    }

    /**
     * Kiểm tra form có hợp lệ không
     */
    isFormValid(): boolean {
        return !!(
            this.offerData.salary &&
            this.offerData.salary > 0 &&
            this.offerData.startDate &&
            this.offerData.expiryDate &&
            this.offerData.contractType
        );
    }

    /**
     * Gửi offer (Logic chính)
     */
    isSending = false; // Loading state

    sendOffer(): void {
        if (!this.isFormValid()) {
            alert('⚠️ Vui lòng điền đầy đủ thông tin!');
            return;
        }

        // Chuẩn bị payload để gửi email
        const payload = {
            applicationId: this.candidate?.applicationId || this.candidate?.candidateId || null,
            candidateName: this.candidate?.fullName || this.candidate?.candidateName || 'N/A',
            candidateEmail: this.candidate?.email || 'N/A',
            position: this.candidate?.jobTitle || this.candidate?.position || 'N/A',
            salary: this.offerData.salary!,
            startDate: this.offerData.startDate,
            expiryDate: this.offerData.expiryDate,
            contractType: this.offerData.contractType,
            ccInterviewer: this.offerData.ccInterviewer,
            additionalCcEmails: this.offerData.additionalCcEmails
        };

        console.log('📤 Sending Offer Letter via API...', payload);

        // Gọi API Backend để gửi email thật
        this.isSending = true;
        this.offerService.sendOfferLetter(payload).subscribe({
            next: (response) => {
                this.isSending = false;
                console.log('✅ Offer sent successfully:', response);

                // Hiển thị thông báo thành công
                alert(`✅ Đã gửi thành công email Offer tới ${payload.candidateName}!\n\nEmail: ${payload.candidateEmail}\nLương: ${payload.salary.toLocaleString()} VNĐ`);

                // Emit event để thông báo cho component cha
                this.offerSent.emit(payload);

                // Đóng modal
                this.closeModal();
            },
            error: (error) => {
                this.isSending = false;
                console.error('❌ Error sending offer:', error);

                // Hiển thị thông báo lỗi
                const errorMsg = error.error?.message || 'Có lỗi xảy ra khi gửi email Offer';
                alert(`❌ Lỗi: ${errorMsg}\n\nVui lòng thử lại hoặc liên hệ IT support.`);
            }
        });
    }

    /**
     * Đóng modal
     */
    closeModal(): void {
        this.close.emit();
        // Reset form
        this.resetForm();
    }

    /**
     * Reset form về trạng thái ban đầu
     */
    resetForm(): void {
        this.offerData = {
            salary: null,
            startDate: '',
            expiryDate: '',
            contractType: '',
            ccInterviewer: true, // Default ON
            additionalCcEmails: ''
        };
    }
}
