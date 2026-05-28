import { matchingApi } from './api';

export const welcomesApi = {
  create({ receiverProfileId, meetupId }) {
    return matchingApi('/api/matching/welcomes', {
      method: 'POST',
      body: {
        receiver_profile_id: receiverProfileId,
        meetup_id: meetupId,
      },
    });
  },
};
