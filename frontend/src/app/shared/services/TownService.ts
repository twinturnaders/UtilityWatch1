import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TownOnlyDTO} from '../municipality/TownOnly.dto';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TownService {
  private base = `${environment.apiUrl}/towns/names`;
  constructor(private http: HttpClient) {}
  getTownNames() {
    return this.http.get<TownOnlyDTO[]>(`${this.base}`);
  }
}
