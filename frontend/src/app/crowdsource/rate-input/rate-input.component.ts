import {Component, ChangeDetectionStrategy, inject, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule,
  Validators, AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {Observable, combineLatest, forkJoin, catchError, of} from 'rxjs';
import { finalize, map, shareReplay, startWith } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { MunicipalityService } from '../../shared/municipality.service';
import { TownService } from '../../shared/services/TownService';
import { TownOnlyDTO } from '../../shared/municipality/TownOnly.dto';


import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {RouterOutlet} from '@angular/router';
import {HomeButtonComponent} from '../../shared/home-button/home-button.component';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';


type TierForm = FormGroup<{
  upTo: FormControl<number | null>;
  rate: FormControl<number | null>;
}>;

type CrowdForm = FormGroup<{
  municipalityName: FormControl<string | null>;
  municipalityId: FormControl<number | null>;
  useOtherTown: FormControl<boolean>;
  otherTownName: FormControl<string | null>;
  effectiveDate: FormControl<string | null>;
  sourceType: FormControl<'BILL' | 'WEBSITE' | 'PHONE' | 'OTHER'>;
  sourceUrl: FormControl<string | null>;
  water: FormGroup<{ base: FormControl<number | null>; tiers: FormArray<TierForm>; }>;
  sewer: FormGroup<{ base: FormControl<number | null>; tiers: FormArray<TierForm>; }>;
  notes: FormControl<string | null>;
}>;


const townChoiceValidator: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null => {
  const useOther = !!ctrl.get('useOtherTown')?.value;
  const otherName = (ctrl.get('otherTownName')?.value as string | null)?.trim();
  const name = (ctrl.get('municipalityName')?.value as string | null)?.trim();

  if (useOther) {
    return otherName && otherName.length >= 2 ? null : { otherTownRequired: true };
  }
  return name ? null : { townFromListRequired: true };
};

@Component({
  selector: 'rate-input',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatOptionModule,
    MatCheckboxModule,MatCardSubtitle,MatCardTitle, MatCard, MatCardHeader, MatCardContent,
  ],
  templateUrl: './rate-input.component.html',
  styleUrls: ['./rate-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RateInputComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private muni = inject(MunicipalityService);
  private townService = inject(TownService);

  private base = `${environment.apiUrl}/submissions/submit`;
  private cdr = inject(ChangeDetectorRef);
  submitting = false;
  success: string | null = null;
  error: string | null = null;

  form: CrowdForm = this.fb.group({
    municipalityName: this.fb.control<string | null>(null),
    municipalityId: this.fb.control<number | null>(null),

    useOtherTown: this.fb.control<boolean>(false, { nonNullable: true }),
    otherTownName: this.fb.control<string | null>(null),

    effectiveDate: this.fb.control<string | null>(null),
    sourceType: this.fb.control<'BILL' | 'WEBSITE' | 'PHONE' | 'OTHER'>('BILL', { nonNullable: true }),
    sourceUrl: this.fb.control<string | null>(null, {
      validators: [(c) => !c.value ? null : (/^https?:\/\/.+/i.test(c.value) ? null : { url: true })]
    }),
    water: this.fb.group({
      base: this.fb.control<number | null>(null),

      tiers: this.fb.array<TierForm>([this.makeTier()]),
    }),
    sewer: this.fb.group({
      base: this.fb.control<number | null>(null),

      tiers: this.fb.array<TierForm>([]),
    }),
    notes: this.fb.control<string | null>(null),
  }, { validators: townChoiceValidator });

  get waterTiers(): FormArray<TierForm> { return this.form.controls.water.controls.tiers; }
  get sewerTiers(): FormArray<TierForm> { return this.form.controls.sewer.controls.tiers; }

  // Autocomplete control
  townCtrl = new FormControl<string>('', { nonNullable: true });


  allTowns$: Observable<TownOnlyDTO[]> = this.townService.getTownNames().pipe(
    map(list => [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' }))),
    shareReplay(1)
  );


  filteredTowns$: Observable<TownOnlyDTO[]> = combineLatest([
    this.allTowns$,
    this.townCtrl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([towns, q]) => {
      const query = (q ?? '').trim().toLowerCase();
      if (!query) return towns;
      return towns.filter(t => t.name.toLowerCase().includes(query));
    })
  );

  isChecked = false;

  onToggleOtherTown(checked: boolean): void {
    if (checked) {
      this.townCtrl.setValue('');
      this.form.patchValue({ municipalityName: null, municipalityId: null });
      this.isChecked = true;
    } else {
      this.form.patchValue({ otherTownName: null });
    }
    this.form.updateValueAndValidity();
  }



  onTownPicked(e: MatAutocompleteSelectedEvent, towns: TownOnlyDTO[]): void {
    const pickedName = e.option.value as string;
    const match = towns.find(t => t.name.toLowerCase() === pickedName.toLowerCase()) || null;
    this.form.patchValue({
      municipalityName: pickedName,
      municipalityId: match?.id ?? null
    });
    this.form.updateValueAndValidity();
  }


  syncTypedTownToId(towns: TownOnlyDTO[]): void {
    const name = (this.townCtrl.value ?? '').trim();
    if (!name) {
      this.form.patchValue({ municipalityName: null, municipalityId: null });
    } else {
      const match = towns.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
      this.form.patchValue({ municipalityName: name, municipalityId: match?.id ?? null });
    }
    this.form.updateValueAndValidity();
  }

  makeTier(): TierForm {
    return this.fb.group({
      upTo: this.fb.control<number | null>(null),
      rate: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    });
  }
  addWaterTier(): void { this.waterTiers.push(this.makeTier()); }
  removeWaterTier(i: number): void { this.waterTiers.removeAt(i); }
  addSewerTier(): void { this.sewerTiers.push(this.makeTier()); }
  removeSewerTier(i: number): void { this.sewerTiers.removeAt(i); }

  submit(): void {
    this.success = null;
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.errors?.['otherTownRequired']) {
        this.error = 'Please enter the town name in “Other town”.';
      } else if (this.form.errors?.['townFromListRequired']) {
        this.error = 'Please select a town from the list.';
      } else if (this.form.get('sourceUrl')?.errors?.['url']) {
        this.error = 'Source URL must start with http(s)://';
      } else {
        this.error = 'Please fix the highlighted fields.';
      }
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;

    const raw = this.form.getRawValue();
    const chosenTownName = raw.useOtherTown
      ? (raw.otherTownName ?? '').trim()
      : (raw.municipalityName ?? '').trim();

    const toNum = (v: any) => (v === '' || v == null ? null : Number(v));
    const hasAnyTier = (tiers: { rate: any }[] | undefined) =>
      !!tiers && tiers.some(t => t && t.rate !== null && t.rate !== '' && !isNaN(Number(t.rate)));
    const hasWater = (raw.water.base !== null && raw.water.base?.toString() !== '') || hasAnyTier(raw.water.tiers as any);
    const hasSewer = (raw.sewer.base !== null && raw.sewer.base?.toString() !== '') || hasAnyTier(raw.sewer.tiers as any);

    const makeDto = (rateType: 'WATER' | 'SEWER') => ({
      townName: chosenTownName,
      rateType,
      baseRate: toNum(rateType === 'WATER' ? raw.water.base : raw.sewer.base),
      notes: raw.notes || null,
      submittedViaUpload: false,
      rateTiers: ((rateType === 'WATER' ? raw.water.tiers : raw.sewer.tiers) || [])
        .filter(t => t && t.rate != null && t.rate.toString() !== '')
        .map(t => ({
          upTo: t.upTo == null || t.upTo.toString() === '' ? null : Number(t.upTo),
          rate: Number(t.rate)
        })),
      fees: [] as { name: string; amount: number }[]
    });

    const posts: Array<ReturnType<typeof this.http.post<string>>> = [];
    const base = '/api/submissions';

    if (hasWater) {
      posts.push(
        this.http.post<string>(`${base}/submit`, makeDto('WATER'), {
          responseType: 'text' as 'json' // <-- KEY: treat text as json type
        }).pipe(
          catchError(err => of(`WATER error: ${err?.error || err?.message || 'unknown'}`))
        )
      );
    }
    if (hasSewer) {
      posts.push(
        this.http.post<string>(`${base}/submit`, makeDto('SEWER'), {
          responseType: 'text' as 'json'
        }).pipe(
          catchError(err => of(`SEWER error: ${err?.error || err?.message || 'unknown'}`))
        )
      );
    }

    if (!posts.length) {
      this.submitting = false;
      this.error = 'Please enter at least one Water or Sewer rate.';
      this.cdr.markForCheck();
      return;
    }


    forkJoin(posts)
      .pipe(finalize(() => { this.submitting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (responses) => {

          const hasAnyError = responses.some(r => typeof r === 'string' && r.includes('error:'));
          if (hasAnyError) {
            this.error = responses.join(' | ');
            this.success = null;
            this.cdr.markForCheck();
            return;
          }

          this.success = 'Submission received! Thank you 💧';

          // keep whichever name they chose before
          const keepName = raw.useOtherTown ? raw.otherTownName : raw.municipalityName;


          this.form.reset({
            useOtherTown: raw.useOtherTown,
            otherTownName: raw.useOtherTown ? (keepName ?? null) : null,
            municipalityName: !raw.useOtherTown ? (keepName ?? null) : null,
            municipalityId: !raw.useOtherTown ? raw.municipalityId : null,
            sourceType: 'BILL'
          });
          this.townCtrl.setValue(!raw.useOtherTown ? (keepName ?? '') : '');


          this.waterTiers.clear(); this.waterTiers.push(this.makeTier());
          this.sewerTiers.clear();

          this.cdr.markForCheck();
        },
        error: (err) => {

          this.error = (err?.error && typeof err.error === 'string') ? err.error : 'Submission failed. Please try again.';
          this.success = null;
          this.cdr.markForCheck();
        }
      });
  }

  get preview(): unknown {
    return { ...this.form.getRawValue() };
  }
}
