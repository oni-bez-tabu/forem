import { matchingApi } from './api';

export const rsvpsApi = {
  upsert(slug, status) {
    return matchingApi(`/api/meetups/${encodeURIComponent(slug)}/rsvp`, {
      method: 'POST',
      body: { status },
    });
  },
  destroy(slug) {
    return matchingApi(`/api/meetups/${encodeURIComponent(slug)}/rsvp`, {
      method: 'DELETE',
    });
  },
};
