import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IChatPreview, IGetUsersQuery, IMessage } from '@shared';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  private get authHeaders() {
    const user = this.userService.currentUser();
    return { 'x-user-id': user?.id ?? '' };
  }

  public getChatPreviews(query: IGetUsersQuery = {}): Observable<IChatPreview[]> {
    const params = new HttpParams({
      fromObject: query as Record<string, string>,
    });

    return this.http
      .get<{ previews: IChatPreview[] }>(`${environment.apiUrl}/chat/previews`, {
        params,
        headers: this.authHeaders,
      })
      .pipe(map((res) => res.previews));
  }

  public getHistory(withUserId: string): Observable<IMessage[]> {
    return this.http
      .get<{ messages: IMessage[] }>(`${environment.apiUrl}/chat/history/${withUserId}`, {
        headers: this.authHeaders,
      })
      .pipe(map((res) => res.messages));
  }
}