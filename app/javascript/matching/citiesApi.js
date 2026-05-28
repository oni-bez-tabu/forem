import { matchingApi } from './api';

export const citiesApi = {
  search(q) {
    return matchingApi('/api/cities/search', { query: { q: q || '' } });
  },
};
