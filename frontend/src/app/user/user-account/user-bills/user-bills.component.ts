import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {finalize} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterOutlet} from '@angular/router';

export interface BillFeeDTO {
  name?: string;
  amount?: number;
}

export interface UserBillDTO {
  id?: number;
  billDate?: string;
  dueDate?: string;
  paidDate?: string;
  paid?: boolean;


  waterUsage?: number;
  sewerUsage?: number;
  waterCharge?: number;
  sewerCharge?: number;
  fees?: Record<any, any>;


}



export interface BillCompareResult {
  municipality: string;
  state: string;
  county: string;
  estimatedWaterCharge: number;
  estimatedSewerCharge: number;
  total: number;
}

@Component({
  selector: 'app-user-bills',
  templateUrl: './user-bills.component.html',
  styleUrls: ['./user-bills.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet]})

export class UserBillsComponent implements OnInit {

  private base = `${environment.apiUrl}/userbills`;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  bills: UserBillDTO[] = [];
  loading = false;
  error: string | null = null;

  // selection / actions
  selectedBill: UserBillDTO | null = null;

  compareResults: BillCompareResult[] = [];
  compareLoading = false;
  compareError: string | null = null;



  ngOnInit(): void {
    this.loadBills();
  }
  objectKeys = Object.keys;
  private none: string = '';


  loadBills(): void {
    this.loading = true;
    this.error = null;

    this.http.get<UserBillDTO[]>(this.base)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();  // <-- manually trigger view update
      }))
      .subscribe({
        next: (rows) => {
          this.bills = (rows || []);
        },
        error: (err) => {
          console.error('Failed to load bills', err);
          this.error = err?.status === 401 ? 'Please sign in again.' : 'Could not load bills.';
        }
      });
  }
  feesAsArray(b: UserBillDTO): { name: string; amount: number }[] {
    return Object.entries(b.fees ?? {}).map(([name, amount]) => ({
      name,
      amount: this.toNumber(amount),
    }));
  }


ifNull(b: UserBillDTO): string | null{
    if (b.fees == null){
      return 'None'
    }

    else {
      return null
    }



}


  // saveNewBill(req: CreateBillRequest): void {
  //   this.error = null;
  //   this.loading = true;
  //
  //   this.http.post(`${this.base}`, req)
  //     .pipe(finalize(() => this.loading = false))
  //     .subscribe({
  //       next: () => this.loadBills(),
  //       error: (err) => {
  //         console.error('Save bill failed', err);
  //         this.error = 'Failed to save bill.';
  //       }
  //     });
  // }



  viewBill(bill: UserBillDTO): void {
    this.selectedBill = bill;
    console.log('Viewing bill', bill);
  }

  compare(waterUsage: number, sewerUsage: number): void {
    if (waterUsage == null || sewerUsage == null) return;

    this.compareLoading = true;
    this.compareError = null;
    this.compareResults = [];

    const params = { waterUsage, sewerUsage } as any;

    this.http.get<BillCompareResult[]>(`${this.base}/compare`, { params })
      .pipe(finalize(() => this.compareLoading = false))
      .subscribe({
        next: (rows) => this.compareResults = rows || [],
        error: (err) => {
          console.error('Compare failed', err);
          this.compareError = err?.error || 'Compare failed.';
        }
      });
  }


  hasData(b: UserBillDTO): boolean {
    return !!b.billDate || !!b.dueDate || !!b.paid || !!b.waterUsage || !!b.sewerUsage || !! b.waterCharge
    || !!b.sewerCharge || !! b.fees;

  }

  private sumFees(map?: Record<string, number>): number {
    return Object.values(map ?? {}).reduce((sum, v) => sum + this.toNumber(v), 0);
  }

  TotalCharge(bill: UserBillDTO): number {
    const water = this.toNumber(bill.waterCharge);
    const sewer = this.toNumber(bill.sewerCharge);
    const feesTotal = this.sumFees(bill.fees);
    return water + sewer + feesTotal;
  }
  id?: number;
  billDate?: string;
  dueDate?: string;
  paidDate?: string;
  paid?: boolean;
  private normalizeBill(b: UserBillDTO): {
    bd: string;
    dueDate: string;
    paid: boolean;
    water: number;
    sewer: number;
    feesTotal: number;
    waterAmount: number;
    sewerAmount: number;
    feeMap: Record<any, any> | null;
    unit: string
  } {
    const bd = b.billDate == null || b.billDate.length == 0 ? '-' : b.billDate;
    const  dueDate = b.dueDate == null || b.dueDate.toString().length == 0 ? '-' : b.dueDate;
    const water = b.waterCharge == null || b.waterCharge.toString().length == 0 ?  0 : this.toNumber(b.waterCharge);
    const sewer = b.sewerCharge == null || b.sewerCharge.toString().length == 0 ?  0 : this.toNumber(b.sewerCharge);
    const feesTotal = b.fees == null || b.fees.toString().length == 0 ?  0 : this.sumFees(b.fees);
    const waterAmount = b.waterUsage == null || b.waterUsage.toString().length == 0 ? 0 : this.toNumber(b.waterUsage);
    const sewerAmount: number = b.sewerUsage == null || b.sewerUsage.toString().length == 0 ? 0 : this.toNumber(b.sewerUsage);
    const paid: boolean = b.paid != null ? b.paid : false;
    const feeMap = b.fees != null ? b.fees : null;



    return {
      bd,
      dueDate,
      paid,
      water,
      sewer,
      feesTotal,
      waterAmount,
      sewerAmount,
      feeMap,
      unit: 'kgal',
    };
  }




  private toNumber(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }



}
