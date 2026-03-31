import api from './api';

export interface DashboardSummary {
  revenue: number;
  total_orders: number;
  orders_per_status: {
    booking: number;
    paid: number;
    shipped: number;
    completed: number;
    cancelled?: number;
  };
  stock_per_catalog: {
    id: number;
    name: string;
    items_sum_stock: string;
  }[];
  orders_per_catalog: {
    id: number;
    name: string;
    total_sold: string;
  }[];
}

export interface SalesDataDaily {
  year: number;
  month: number;
  data: {
    day: number;
    total: string;
  }[];
}

export interface SalesDataMonthly {
  year: number;
  data: {
    month: number;
    total: string;
  }[];
}

const unwrapDataObject = <T,>(raw: any): T => {
  // Some APIs return { data: {...} }, others return { data: [...] }, and others return the payload directly.
  // We only unwrap when `data` is a plain object to avoid accidentally unwrapping to an array.
  if (raw && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return raw.data as T;
  }
  return raw as T;
};

const normalizeDashboardSummary = (data: any): DashboardSummary => {
  const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];
  
  return {
    revenue: data.revenue ? Number(data.revenue) : 0,
    total_orders: data.total_orders ? Number(data.total_orders) : 0,
    orders_per_status: {
      booking: data.orders_per_status?.booking
        ? Number(data.orders_per_status.booking)
        : data.orders_per_status?.pending
        ? Number(data.orders_per_status.pending)
        : 0,
      paid: data.orders_per_status?.paid ? Number(data.orders_per_status.paid) : 0,
      shipped: data.orders_per_status?.shipped ? Number(data.orders_per_status.shipped) : 0,
      completed: data.orders_per_status?.completed ? Number(data.orders_per_status.completed) : 0,
      cancelled: data.orders_per_status?.cancelled ? Number(data.orders_per_status.cancelled) : 0,
    },
    stock_per_catalog: ensureArray(data.stock_per_catalog).map((item: any) => ({
      id: item.id || 0,
      name: item.name || item.catalog_name || 'Unknown',
      items_sum_stock: String(item.items_sum_stock || item.total_stock || 0),
    })),
    orders_per_catalog: ensureArray(data.orders_per_catalog).map((item: any) => ({
      id: item.id || 0,
      name: item.name || item.catalog_name || 'Unknown',
      total_sold: String(item.total_sold || item.qty || 0),
    })),
  };
};

export const dashboardService = {
  // Get dashboard summary
  getSummary: async (): Promise<DashboardSummary> => {
    try {
      const response = await api.get('/dashboard/summary');
      const result = normalizeDashboardSummary(response.data.data || response.data);
      return result;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  // Get sales data by month (daily breakdown)
  getSalesByMonth: async (year: number, month: number): Promise<SalesDataDaily> => {
    try {
      const response = await api.get('/dashboard/sales', {
        params: { year, month },
      });

      const raw = response.data;
      const payload = unwrapDataObject<any>(raw);
      const yearValue = Number(payload?.year ?? raw?.year ?? year) || year;
      const monthValue = Number(payload?.month ?? raw?.month ?? month) || month;
      const rows =
        Array.isArray(payload?.data) ? payload.data
        : Array.isArray(payload) ? payload
        : Array.isArray(raw?.data) ? raw.data
        : [];
      
      return {
        year: yearValue,
        month: monthValue,
        data: rows.map((item: any) => ({
          day: item.day || 0,
          total: String(item.total || 0),
        })),
      };
    } catch (error) {
      console.error('Error fetching sales by month:', error);
      throw error;
    }
  },

  // Get sales data by year (monthly breakdown)
  getSalesByYear: async (year: number): Promise<SalesDataMonthly> => {
    try {
      const response = await api.get('/dashboard/sales', {
        params: { year },
      });

      const raw = response.data;
      const payload = unwrapDataObject<any>(raw);
      const yearValue = Number(payload?.year ?? raw?.year ?? year) || year;
      const rows =
        Array.isArray(payload?.data) ? payload.data
        : Array.isArray(payload) ? payload
        : Array.isArray(raw?.data) ? raw.data
        : [];
      
      return {
        year: yearValue,
        data: rows.map((item: any) => ({
          month: item.month || 0,
          total: String(item.total || 0),
        })),
      };
    } catch (error) {
      console.error('Error fetching sales by year:', error);
      throw error;
    }
  },

  // Export sales data as Excel
  exportSalesData: async (year: number, month?: number): Promise<Blob> => {
    try {
      const params: Record<string, number> = { year };
      if (month) params.month = month;

      const response = await api.get('/dashboard/sales/export', {
        params,
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch (error) {
      console.error('Error exporting sales data:', error);
      throw error;
    }
  },
};
