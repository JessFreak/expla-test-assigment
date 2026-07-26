import { Injectable, signal } from '@angular/core';
import { generateUniqueId, getRandomElement, IUser, UserStatusEnum } from '@shared';
import { environment } from '../../environments/environment';

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Riley', 'Casey',
  'Dakota', 'Jamie', 'Avery', 'Jesse', 'Reese', 'Rowan', 'Quinn', 'Skyler'
] as const;

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
] as const;

const CHAT_TAB_KEY = 'chat_tab_id';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public readonly currentUser = signal<IUser>(this.initProfile());

  public getOrCreateProfile(): IUser {
    return this.currentUser();
  }

  public syncProfileFromServer(profile: IUser): void {
    this.currentUser.set(profile);

    const tabId = sessionStorage.getItem(CHAT_TAB_KEY);
    localStorage.setItem(`chat_user_profile_${tabId}`, JSON.stringify(profile));
  }

  private initProfile(): IUser {
    let tabId = sessionStorage.getItem(CHAT_TAB_KEY);
    if (!tabId) {
      tabId = generateUniqueId();
      sessionStorage.setItem(CHAT_TAB_KEY, tabId);
    }

    const storageKey = `chat_user_profile_${tabId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        localStorage.removeItem(storageKey);
      }
    }

    const randomName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;

    return {
      id: '',
      name: randomName,
      avatar: `${environment.dicebearApiUrl}?seed=${encodeURIComponent(randomName)}`,
      isBot: false,
      status: UserStatusEnum.ONLINE,
    };
  }
}