import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router, RouterLink} from '@angular/router';
import {finalize} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';

export interface BillFeeDTO {
  name?: string;
  amount?: number;
}

export interface CreateBillRequest {
  billDate?: string;
  dueDate?: string;
  paidDate?: string;
  paid?: boolean;
  waterUsage?: number;
  sewerUsage?: number;
  waterCharge?: number;
  sewerCharge?: number;
  fees?: Record<string, number>;
}

type FeeForm = FormGroup<{
  name: FormControl<string | null>;
  amount: FormControl<number | null>;
}>;

type AddBillForm = FormGroup<{
  billDate: FormControl<string | null>;
  dueDate: FormControl<string | null>;
  paidDate: FormControl<string | null>;
  paid: FormControl<boolean>;
  waterUsage: FormControl<number | null>;
  sewerUsage: FormControl<number | null>;
  waterCharge: FormControl<number | null>;
  sewerCharge: FormControl<number | null>;
  fees: FormArray<FeeForm>;
}>;

@Component({
  selector: 'app-add-bill',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-bill.component.html',
  styleUrls: ['./add-bill.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AddBillComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);



 private base = `${environment.apiUrl}/userbills`;

  submitting = false;
  error: string | null = null;
  success: string | null = null;

  form: AddBillForm = this.fb.group({
    billDate: this.fb.control<string | null>(null),
    dueDate: this.fb.control<string | null>(null),
    paidDate: this.fb.control<string | null>(null),
    paid: this.fb.control<boolean>(false, { nonNullable: true }),

    waterUsage: this.fb.control<number | null>(null, [Validators.min(0)]),
    sewerUsage: this.fb.control<number | null>(null, [Validators.min(0)]),

    waterCharge: this.fb.control<number | null>(null, [Validators.min(0)]),
    sewerCharge: this.fb.control<number | null>(null, [Validators.min(0)]),

    fees: this.fb.array<FeeForm>([])
  });

  get feesArray(): FormArray<FeeForm> {
    return this.form.controls.fees;
  }

  addFee(): void {
    this.feesArray.push(
      this.fb.group({
        name: this.fb.control<string | null>(null, [Validators.required]),
        amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)])
      })
    );
    this.cdr.markForCheck();
  }

  removeFee(i: number): void {
    this.feesArray.removeAt(i);
    this.cdr.markForCheck();
  }

  submit(): void {
    this.error = null;

    if (this.form.valid) {
      this.success = 'Bill added successfully.';
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fix the highlighted fields.';
      this.cdr.markForCheck();

    }


    const raw = this.form.getRawValue();

    const feesMap: Record<string, number> = (raw.fees || [])
      .filter(f => (f?.name ?? '').trim().length > 0)
      .reduce<Record<string, number>>((acc, f) => {
        const key = (f.name ?? '').trim();
        const amt = Number(f.amount);
        if (key) acc[key] = Number.isFinite(amt) ? amt : 0;
        return acc;
      }, {});

    const req: CreateBillRequest = {
      billDate: raw.billDate || undefined,
      dueDate: raw.dueDate || undefined,
      paidDate: raw.paidDate || undefined,
      paid: raw.paid ?? false,
      waterUsage: raw.waterUsage ?? undefined,
      sewerUsage: raw.sewerUsage ?? undefined,
      waterCharge: raw.waterCharge ?? undefined,
      sewerCharge: raw.sewerCharge ?? undefined,
      fees: Object.keys(feesMap).length ? feesMap : undefined
    };

    this.submitting = true;


    this.http.post<string>(this.base, req, { responseType: 'text' as 'json', withCredentials: true })
      .pipe(finalize(() => { this.submitting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.success = 'Bill saved';

        this.form.reset();

        },
        error: (err) => {
          console.error('Save bill failed', err);

          this.error = (typeof err?.error === 'string' && err.error) ? err.error : 'Failed to save bill.';
          this.cdr.markForCheck();
        }
      });

    function toNumOrUndef(v: unknown): number | undefined {
      if (v === null || v === undefined || v === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    function isNum(v: unknown): boolean {
      const n = Number(v);
      return Number.isFinite(n);
    }
    function toNumOrZero(v: unknown): number {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
  }


}
