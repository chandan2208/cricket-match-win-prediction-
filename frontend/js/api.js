const BASE_URL = "http://localhost:5000/api";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const request = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const config = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body);
  }

  console.log("[api] request", { url, config });

  const response = await fetch(url, config);
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    console.error("[api] invalid JSON response", { url, error });
  }

  if (!response.ok || payload?.success === false) {
    let message = payload?.message || `Request failed: ${response.status}`;
    if (payload?.errors && Array.isArray(payload.errors)) {
      message = payload.errors.map(err => err.msg || err).join('. ');
    }
    console.error("[api] request failed", { url, status: response.status, payload });
    throw new Error(message);
  }

  console.log("[api] response", { url, payload });
  return payload;
};

const predictMatch = async (payload) => {
  return request("/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  });
};

const getMatches = async (type = "live", params = {}) => {
  return request(`/matches/${type}${toQueryString(params)}`);
};

const getAnalytics = async (type = "system", id = "") => {
  if (type === "team" || type === "player") {
    if (!id) {
      throw new Error(`Missing id for analytics type: ${type}`);
    }
    return request(`/analytics/${type}/${id}`);
  }
  return request(`/analytics/${type}`);
};

const getPredictionHistory = async (params = {}) => {
  return request(`/predictions/history${toQueryString(params)}`);
};

const getPredictionAccuracy = async () => {
  return request("/predictions/accuracy");
};

const getTeams = async (params = {}) => {
  return request(`/teams${toQueryString(params)}`);
};

export {
  BASE_URL,
  predictMatch,
  getMatches,
  getAnalytics,
  getPredictionHistory,
  getPredictionAccuracy,
  getTeams,
};
