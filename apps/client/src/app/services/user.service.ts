import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { ChatRouteSegmentEnum, IUser, generateUniqueId } from '@shared';
import { environment } from '../../environments/environment';
import { CHAT_PROFILE_STORAGE_KEY_PREFIX, CHAT_TAB_STORAGE_KEY } from '../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  public readonly currentUser = signal<IUser | null>(null);

  public loadProfile(): Observable<IUser> {
    let tabId = sessionStorage.getItem(CHAT_TAB_STORAGE_KEY);
    if (!tabId) {
      tabId = generateUniqueId();
      sessionStorage.setItem(CHAT_TAB_STORAGE_KEY, tabId);
    }

    const storageKey = `${CHAT_PROFILE_STORAGE_KEY_PREFIX}${tabId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const profile = JSON.parse(saved);
        this.currentUser.set(profile);
        return of(profile);
      } catch (error) {
        console.warn(`UserService failed to parse`, error);
        localStorage.removeItem(storageKey);
      }
    }

    return this.http
      .post<IUser>(`${environment.apiUrl}/${ChatRouteSegmentEnum.BASE}/${ChatRouteSegmentEnum.GENERATE_PROFILE}`, {})
      .pipe(
        tap((profile) => {
          localStorage.setItem(storageKey, JSON.stringify(profile));
          this.currentUser.set(profile);
        })
      );
  }
}