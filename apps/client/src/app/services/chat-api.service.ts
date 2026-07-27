import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ChatRouteSegmentEnum, IChatPreview, IGetUsersQuery, IMessage, USER_ID_HEADER } from '@shared';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

const CHAT_API_BASE_URL = `${environment.apiUrl}/${ChatRouteSegmentEnum.BASE}`;

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  private get authHeaders() {
    const user = this.userService.currentUser();
    return { [USER_ID_HEADER]: user?.id ?? '' };
  }

  public getChatPreviews(query: IGetUsersQuery = {}): Observable<IChatPreview[]> {
    const params = new HttpParams({
      fromObject: query as Record<string, string>,
    });

    return this.http
      .get<{ previews: IChatPreview[] }>(`${CHAT_API_BASE_URL}/${ChatRouteSegmentEnum.PREVIEWS}`, {
        params,
        headers: this.authHeaders,
      })
      .pipe(map((res) => res.previews));
  }

  public getHistory(userId: string): Observable<IMessage[]> {
    return this.http
      .get<{ messages: IMessage[] }>(`${CHAT_API_BASE_URL}/${ChatRouteSegmentEnum.HISTORY}/${userId}`, {
        headers: this.authHeaders,
      })
      .pipe(map((res) => res.messages));
  }
}