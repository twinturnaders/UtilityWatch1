import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { MunicipalityService, RateSummaryDto } from '../municipality.service';
import {CommonModule, CurrencyPipe, NgForOf, NgIf} from '@angular/common';
import {StarRatingComponent} from '../rating/rating.component';
import {finalize} from 'rxjs/operators';
import {HomeButtonComponent} from '../home-button/home-button.component';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  imports: [
    CommonModule,
    CurrencyPipe,
    StarRatingComponent,
    ReactiveFormsModule,
    NgForOf,
    NgIf,
    HomeButtonComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle
  ],
  styleUrls: ['./search.component.css'],
  standalone: true,
})
export class SearchComponent implements OnInit {
  loading = false;
  error = '';
  results: RateSummaryDto[] = [];


  radiusOptions = [30, 60, 100, 250];


  searchForm!: FormGroup;
  constructor(private fb: FormBuilder, private svc: MunicipalityService, private cdr: ChangeDetectorRef) {}

ngOnInit() {


  this.searchForm = this.fb.group({
    zip: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    radius: [10, [Validators.required]],
    gallonsUsed: [5000, [Validators.min(0)]]
  });

}
  get zipCtrl() { return this.searchForm.get('zip'); }

  trackById = (_: number, m: RateSummaryDto) => m?.municipalityId ?? _;
  onSearch() {
    if (this.searchForm.invalid) return;

    const { zip, radius, gallonsUsed } = this.searchForm.value as any;
    this.loading = true;
    this.error = '';

    this.svc.getNearby(String(zip), Number(radius), Number(gallonsUsed))
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: arr => { this.results = arr ?? []; this.cdr.markForCheck(); },
        error: e => this.error = this.readableError(e),
      });
  }


  private readableError(e: any): string {
    if (e?.status === 0) return 'Cannot reach server. Check API URL / CORS.';
    if (e?.status === 403) return 'Forbidden. Check auth/cookies.';
    return (e?.error?.message) || 'Something went wrong.';
  }


  starsOf(conf?: string | null): number {
    return (conf ?? '').trim().length;
  }
}
