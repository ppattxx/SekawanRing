import api from './api';

export interface DashboardSummary {
  revenue: number;
  total_orders: number;
  orders_per_status: {
    pending: number;
    paid: number;
    shipped: number;
    completed: number;
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

export const dashboardService = {
  // Get dashboard summary
  getSummary: async (): Promise<DashboardSummary> => {
    try {
      const response = await api.get('/dashboard/summary');
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (error) {
      console.error('Error fetching sales by year:', error);
      throw error;
    }
  },
};
