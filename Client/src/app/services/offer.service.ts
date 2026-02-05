import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SendOfferLetterDto {
    applicationId: string; // Changed from candidateId - this is the Application ID
    candidateName: string;
    candidateEmail: string;
    position: string;
    salary: number;
    startDate: string;
    expiryDate: string;
    contractType: string;
    ccInterviewer: boolean;
    additionalCcEmails: string;
}

@Injectable({
    providedIn: 'root'
})
export class OfferService {
    private apiUrl = 'https://localhost:7181/api/offer';

    constructor(private http: HttpClient) { }

    /**
     * Gửi Offer Letter qua email
     */
    sendOfferLetter(payload: SendOfferLetterDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/send-offer-letter`, payload);
    }
}
