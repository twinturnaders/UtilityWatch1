import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {Observable} from 'rxjs';
export interface MunicipalityLite {
  id: number;
  name: string;
  state: string;
  county: string;
  zipCenter: number | null;
}
export interface RateSummaryDto {
  municipalityId?: number;
  name: string;
  county?: string;
  state?: string;


  waterBaseRate?: number | string | null;
  waterFixed?: boolean | null;
  waterBaseGal?: number | null;
  waterVariances?: any[] | null;


  sewerRate?: any | null;
  sewerRateVariance?: any | null;


  baseFees?: any[] | null;


  usageGallons?: number | null;
  estimatedWaterCharge?: number | string | null;
  estimatedSewerCharge?: number | string | null;
  estTotal?: number | string | null;


  confidenceRating?: number | null;
}
export interface MunicipalityOption {
  id: number; name: string; county: string; state: string; distanceMiles: number;
}

@Injectable({ providedIn: 'root' })
export class MunicipalityService {
  private base = `${environment.apiUrl}/municipalities`;
  constructor(private http: HttpClient) {}


  search(q: string): Observable<MunicipalityLite[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<MunicipalityLite[]>(`${this.base}/search`, { params });
  }

  getNearby(zip: string, radiusMiles: number, usageGallons?: number): Observable<RateSummaryDto[]> {
    const params: Record<string, string> = {
      zip,
      radiusMiles: String(radiusMiles)
    };
    if (usageGallons != null) params['usageGallons'] = String(usageGallons);


    return this.http
      .get<RateSummaryDto[]>(`${environment.apiUrl}/rates/nearby`, { params })
      .pipe(map(res => (Array.isArray(res) ? res : [])));
  }

  near(zip: string, radiusMeters = 16093, limit = 15): Observable<MunicipalityOption[]> {
    return this.http.get<MunicipalityOption[]>(`${this.base}/near`, {
      params: { zip, radiusMeters, limit }
    });
  }
}
