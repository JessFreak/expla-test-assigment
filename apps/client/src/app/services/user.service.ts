import { Injectable } from '@angular/core';
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
  public getOrCreateProfile(): IUser {
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
        console.warn(`UserService failed to parse`, error);
        localStorage.removeItem(storageKey);
      }
    }

    const id = generateUniqueId();
    const randomName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;

    const profile: IUser = {
      id,
      name: randomName,
      avatar: `${environment.dicebearApiUrl}?seed=${id}`,
      isBot: false,
      status: UserStatusEnum.ONLINE,
    };

    localStorage.setItem(storageKey, JSON.stringify(profile));
    return profile;
  }
}