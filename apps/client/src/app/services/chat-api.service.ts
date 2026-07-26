import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return { 'x-user-id': this.userService.currentUser().id };
  }

  public getChatPreviews(query: IGetUsersQuery = {}): Observable<IChatPreview[]> {
    const params = new HttpParams({
      fromObject: query as Record<string, string>,
    });

    return this.http.get<IChatPreview[]>(`${environment.apiUrl}/api/chat/previews`, {
      params,
      headers: this.authHeaders,
    });
  }

  public getHistory(withUserId: string): Observable<IMessage[]> {
    return this.http.get<IMessage[]>(`${environment.apiUrl}/api/chat/history/${withUserId}`, {
      headers: this.authHeaders,
    });
  }
}