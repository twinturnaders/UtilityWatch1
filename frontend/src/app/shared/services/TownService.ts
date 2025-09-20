import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TownOnlyDTO} from '../municipality/TownOnly.dto';

@Injectable({ providedIn: 'root' })
export class TownService {
  constructor(private http: HttpClient) {}
  getTownNames() {
    return this.http.get<TownOnlyDTO[]>('/towns/names');
  }
}
