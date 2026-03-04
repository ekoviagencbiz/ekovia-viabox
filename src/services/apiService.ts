/// <reference types="vite/client" />

const API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL;
const API_KEY = import.meta.env.VITE_EKOVIA_API_KEY;

export interface OrderData {
  orderId: string;
  createdAt: string;
  fullName: string;
  city: string;
  email: string;
  phone: string;
  address: string;
  note: string;
  vBoxTheme: string;
  dominantNeed: string;
  intensity: string;
  recommendationSummary: string;
  recommendationRaw: string;
  archivedAt?: string;
}

export const apiService = {
  async createOrder(order: OrderData) {
    if (!API_URL) return { success: false, error: "API URL not configured" };
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires no-cors or specific redirect handling
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: API_KEY,
          path: "/order/create",
          payload: order
        })
      });
      // With no-cors, we can't see the response body, but we assume success if no error thrown
      return { success: true };
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error };
    }
  },

  async getActiveOrders(): Promise<OrderData[]> {
    if (!API_URL) return [];
    try {
      const url = `${API_URL}?apiKey=${API_KEY}&path=/orders/active`;
      const response = await fetch(url);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async getArchivedOrders(): Promise<OrderData[]> {
    if (!API_URL) return [];
    try {
      const url = `${API_URL}?apiKey=${API_KEY}&path=/orders/archive`;
      const response = await fetch(url);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  async archiveOrder(orderId: string) {
    if (!API_URL) return { success: false };
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: API_KEY,
          path: "/order/archive",
          payload: { orderId }
        })
      });
      return { success: true };
    } catch (error) {
      console.error("API Error:", error);
      return { success: false };
    }
  },

  async saveSurvey(survey: any) {
    if (!API_URL) return { success: false };
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: API_KEY,
          path: "/survey/save",
          payload: survey
        })
      });
      return { success: true };
    } catch (error) {
      console.error("API Error:", error);
      return { success: false };
    }
  }
};
