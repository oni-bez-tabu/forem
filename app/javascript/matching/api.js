// Minimal fetch wrapper for the matching API.
//
// Web hits `/api/matching/...` paths with `application/vnd.forem.api-v1+json`
// Accept header — Forem's ApiConstraints uses that to route to v1. CSRF is
// not required (Api::V1::ApiController skips `verify_authenticity_token`);
// the session cookie authenticates the request.
//
// The same endpoints work for the native mobile app — clients there pass
// `api-key` instead of a session cookie.

const V1_ACCEPT = 'application/vnd.forem.api-v1+json';

function buildUrl(path, query) {
  if (!query) return path;
  const usp = new URLSearchParams(query);
  return `${path}?${usp.toString()}`;
}

export async function matchingApi(path, { method = 'GET', body, query, signal } = {}) {
  const headers = {
    Accept: V1_ACCEPT,
  };
  let serializedBody;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    serializedBody = JSON.stringify(body);
  }
  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: serializedBody,
    credentials: 'same-origin',
    signal,
  });
  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_e) {
      payload = { error: text };
    }
  }
  return { ok: response.ok, status: response.status, payload };
}

// Convenience helpers for the declaration endpoint. Other matching API
// endpoints will land here in later phases.
export const declarationsApi = {
  show(meetupSlug, options) {
    return matchingApi(`/api/matching/meetups/${encodeURIComponent(meetupSlug)}/declaration`, options);
  },
  upsert(meetupSlug, payload) {
    return matchingApi(`/api/matching/meetups/${encodeURIComponent(meetupSlug)}/declaration`, {
      method: 'POST',
      body: { declaration: payload },
    });
  },
  destroy(meetupSlug) {
    return matchingApi(`/api/matching/meetups/${encodeURIComponent(meetupSlug)}/declaration`, {
      method: 'DELETE',
    });
  },
};
