import {Component, Input, OnInit} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { DatePipe, CurrencyPipe } from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs';

export interface BillFee {
  name?: string;
  amount: number | string | null | undefined;
}


type FeeMap = Record<string, number | string | null | undefined>;

export interface UserBillDTO {
  id?: number | string;
  billDate?: string | Date | null;
  municipality?: string | null;
  municipalityName?: string | null;
  waterCharge?: number | string | null;
  sewerCharge?: number | string | null;
  fees?: FeeMap | BillFee[] | null;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, CurrencyPipe],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  @Input() title = 'Saved Bills Report';
  @Input() bills: UserBillDTO[] | null = null;
  @Input() autoLoad = false;
  @Input() fileNamePrefix = 'saved-bills';

  readonly generatedAt = new Date();




  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.autoLoad && (!this.bills || this.bills.length === 0)) {
      this.http.get<UserBillDTO[]>('/api/user/me/userbills').subscribe({
        next: (rows) => {

          this.bills = rows.map(b => ({ ...b, billDate: b.billDate ? new Date(b.billDate as any) : null }));
        },
        error: (err) => {
          console.error('Failed to load user bills', err);
          this.bills = [];
        }
      });
    }
  }

  trackById = (_: number, b: UserBillDTO) => b.id ?? _;

  private toNum(x: unknown): number {
    const n = typeof x === 'number' ? x : Number(x);
    return Number.isFinite(n) ? n : 0;
  }
  private isFeeArray(fees: unknown): fees is BillFee[] {
    return Array.isArray(fees);
  }
  private isFeeMap(fees: unknown): fees is FeeMap {
    return !!fees && !Array.isArray(fees) && typeof fees === 'object';
  }

  private toNumber(v: any): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : (Number(v) || 0);
  }


  feeTotal(bill: UserBillDTO | null | undefined): number {
    const fees = bill?.fees;
    if (!fees) return 0;
    if (this.isFeeArray(fees)) return fees.reduce((s, f) => s + this.toNumber(f?.amount), 0);
    if (this.isFeeMap(fees))   return <number>Object.values(fees).reduce((s:number, v) => s + this.toNumber(v), 0);
    return 0;
  }


  feesAsArray(bill: UserBillDTO): { name: string; amount: number }[] {
    const fees = bill?.fees;
    if (!fees) return [];
    if (this.isFeeArray(fees)) {
      return fees.map(f => ({ name: String(f?.name ?? ''), amount: this.toNumber(f?.amount) }));
    }
    if (this.isFeeMap(fees)) {
      return Object.entries(fees).map(([name, amount]) => ({ name, amount: this.toNumber(amount) }));
    }
    return [];
  }
  private sumFeeMap(map?: Record<any, any>): number {
    return Object.values(map ?? {}).reduce((s:number, v) => s + this.toNumber(v), 0);
  }



  water(bill: UserBillDTO): number {
    return this.toNum(bill?.waterCharge);
  }

  sewer(bill: UserBillDTO): number {
    return this.toNum(bill?.sewerCharge);
  }

  totalCharge(bill: UserBillDTO): number {
    return this.water(bill) + this.sewer(bill) + this.feeTotal(bill);
  }

  private csvEscape(v: unknown): string {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  exportCsv(): void {
    const headers = ['billDate', 'municipality', 'water', 'sewer', 'fees', 'total'] as const;
    type Header = typeof headers[number];

    const billMap = (this.bills ?? []) as UserBillDTO[];
    const rows = billMap.map(b => ({
      billDate: b.billDate instanceof Date ? b.billDate.toISOString() : (b.billDate ?? ''),
      municipality: b.municipality ?? b.municipalityName ?? '',
      water: this.water(b),
      sewer: this.sewer(b),
      fees: this.feeTotal(b),
      total: this.totalCharge(b)
    }));

    const csvEscape = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headerLine = headers.join(',');
    const bodyLines = rows.map(r =>
      headers.map((h: Header) => csvEscape((r as Record<Header, unknown>)[h])).join(',')
    );
    const csv = [headerLine, ...bodyLines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `saved-bills-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  sortDir: 'asc' | 'desc' = 'asc';  // default ASC

  private dateToTs(d: unknown): number {
    if (d instanceof Date) return d.getTime();
    const ts = Date.parse(String(d ?? ''));
    return Number.isFinite(ts) ? ts : 0;
  }


  get sortedBills(): UserBillDTO[] {
    const copy = [...(this.bills ?? [])];
    copy.sort((a, b) => {
      const va = this.dateToTs(a?.billDate);
      const vb = this.dateToTs(b?.billDate);
      return this.sortDir === 'asc' ? va - vb : vb - va;
    });
    return copy;
  }

  toggleSort(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
  }
  print(): void {
    window.print();
  }
}
