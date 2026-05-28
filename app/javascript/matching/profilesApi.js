// Profile create/update use multipart form-data (photo upload is required
// at create time), so they bypass the JSON `matchingApi` wrapper and use
// FormData directly.

const V1_ACCEPT = 'application/vnd.forem.api-v1+json';

async function multipart(path, method, formData) {
  const response = await fetch(path, {
    method,
    headers: { Accept: V1_ACCEPT },
    body: formData,
    credentials: 'same-origin',
  });
  let payload = null;
  const text = await response.text();
  if (text) {
    try { payload = JSON.parse(text); }
    catch (_e) { payload = { error: text }; }
  }
  return { ok: response.ok, status: response.status, payload };
}

function buildFormData({ photoFile, identityType, cityId, bio }) {
  const fd = new FormData();
  if (photoFile) fd.append('profile[photo]', photoFile);
  if (identityType != null) fd.append('profile[identity_type]', identityType);
  if (cityId != null) fd.append('profile[city_id]', cityId);
  if (bio != null) fd.append('profile[bio]', bio);
  return fd;
}

export const profilesApi = {
  create(payload) {
    return multipart('/api/matching/profile', 'POST', buildFormData(payload));
  },
  update(payload) {
    return multipart('/api/matching/profile', 'PATCH', buildFormData(payload));
  },
};
