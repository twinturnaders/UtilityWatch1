
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { UserDTO } from '../../user/user.dto';
import { UpdateAccountRequest } from '../../user/account-update-request';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  me(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.base}/me`);
  }

  update(req: UpdateAccountRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/update`, req);
  }


}
