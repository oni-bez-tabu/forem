import { matchingApi } from './api';

export const dashboardApi = {
  show() {
    return matchingApi('/api/matching/dashboard');
  },
};
