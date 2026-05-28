import { matchingApi } from './api';

export const boostsApi = {
  create(slug, body) {
    return matchingApi(`/api/meetups/${encodeURIComponent(slug)}/boost`, {
      method: 'POST',
      body: { body },
    });
  },
};
