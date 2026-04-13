const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export async function fetchPizzas() {
  return request("/api/pizzas");
}

export async function createOrder(orderPayload) {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });
}

export { API_BASE_URL };
