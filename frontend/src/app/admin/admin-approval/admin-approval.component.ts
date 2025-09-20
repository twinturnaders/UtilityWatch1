import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { environment } from '../../../environments/environment';
import { MunicipalityService, MunicipalityLite} from '../../shared/municipality.service';

interface CrowdRate { id?: number; upTo?: number | null; rate?: number | null; }
interface CrowdFee { id?: number; name?: string; amount?: number | null; }
interface CrowdSubmission {
  id: number;
  submittedByUserId: number;
  townName: string;
  rateType: 'WATER' | 'SEWER' | string;
  baseRate: number | null;
  notes: string | null;
  submittedViaUpload: boolean;
  status: 'PENDING'|'APPROVED'|'REJECTED';
  createdAt: string;
  rateTiers: CrowdRate[];
  fees: CrowdFee[];
}

@Component({
  selector: 'app-admin-approval',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-approval.component.html',
  styleUrls: ['./admin-approval.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminApprovalComponent {
  private http = inject(HttpClient);
  private muni = inject(MunicipalityService);
  private base = `${environment.apiUrl}/admin/submissions`;

  loading = false;
  error: string | null = null;

  items: CrowdSubmission[] = [];
  selected: CrowdSubmission | null = null;

  muniQuery = '';
  muniSuggestions: MunicipalityLite[] = [];
  chosenMunicipality: MunicipalityLite | null = null;

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading = true; this.error = null;
    this.http.get<CrowdSubmission[]>(`${this.base}/pending`)
      .subscribe({
        next: rows => { this.items = rows || []; this.loading = false; },
        error: err => { this.error = 'Failed to load'; this.loading = false; console.error(err); }
      });
  }

  inspect(item: CrowdSubmission): void {
    this.selected = item;
    this.muniQuery = item.townName || '';
    this.muniSuggestions = [];
    this.chosenMunicipality = null;
  }

  searchMunicipality(): void {
    const q = (this.muniQuery || '').trim();
    if (q.length < 2) { this.muniSuggestions = []; return; }
    this.muni.search(q).subscribe(list => this.muniSuggestions = list || []);
  }

  chooseMunicipality(m: MunicipalityLite): void {
    this.chosenMunicipality = m;
    this.muniQuery = `${m.name}, ${m.state}`;
    this.muniSuggestions = [];
  }

  approve(): void {
    if (!this.selected || !this.chosenMunicipality) return;
    this.http.put(`${this.base}/${this.selected.id}/approve`, { municipalityId: this.chosenMunicipality.id })
      .subscribe({
        next: () => { this.selected = null; this.reload(); },
        error: err => { console.error(err); this.error = 'Approve failed'; }
      });
  }

  reject(reason: string): void {
    if (!this.selected) return;
    this.http.put(`${this.base}/${this.selected.id}/reject`, { reason })
      .subscribe({
        next: () => { this.selected = null; this.reload(); },
        error: err => { console.error(err); this.error = 'Reject failed'; }
      });
  }

  protected readonly prompt = prompt;
}
