import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { IUser, generateUniqueId } from '@shared';
import { environment } from '../../environments/environment';

const CHAT_TAB_KEY = 'chat_tab_id';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  public readonly currentUser = signal<IUser | null>(null);

  public loadProfile(): Observable<IUser> {
    let tabId = sessionStorage.getItem(CHAT_TAB_KEY);
    if (!tabId) {
      tabId = generateUniqueId();
      sessionStorage.setItem(CHAT_TAB_KEY, tabId);
    }

    const storageKey = `chat_user_profile_${tabId}`;
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

    return this.http.post<IUser>(`${environment.apiUrl}/chat/generate-profile`, {}).pipe(
      tap((profile) => {
        localStorage.setItem(storageKey, JSON.stringify(profile));
        this.currentUser.set(profile);
      })
    );
  }
}