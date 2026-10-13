import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  getAll(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  create(data: CreateUserRequest): Observable<User> {
    return this.api.post<User>('/users', data);
  }

  update(id: string, data: UpdateUserRequest): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, data);
  }

  suspend(id: string): Observable<User> {
    return this.api.patch<User>(`/users/${id}/suspend`, {});
  }

  reactivate(id: string): Observable<User> {
    return this.api.patch<User>(`/users/${id}/reactivate`, {});
  }
}
