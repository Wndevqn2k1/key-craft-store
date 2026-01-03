import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Key, ShoppingCart, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
  // Fetch products count
  const { data: productsCount = 0, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch keys count
  const { data: keysData, isLoading: loadingKeys } = useQuery({
    queryKey: ['admin-keys-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_keys')
        .select('status');
      if (error) throw error;
      const total = data?.length || 0;
      const available = data?.filter(k => k.status === 'available').length || 0;
      const sold = data?.filter(k => k.status === 'sold').length || 0;
      return { total, available, sold };
    },
  });

  // Fetch orders count and total revenue
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at');
      if (error) throw error;
      const total = data?.length || 0;
      const completed = data?.filter(o => o.status === 'completed').length || 0;
      const revenue = data
        ?.filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      return { total, completed, revenue, orders: data || [] };
    },
  });

  // Fetch users count
  const { data: usersCount = 0, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Calculate monthly revenue for chart
  const monthlyRevenue = React.useMemo(() => {
    if (!ordersData?.orders) return [];
    
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const currentYear = new Date().getFullYear();
    
    const revenueByMonth = Array(12).fill(0);
    
    ordersData.orders
      .filter(o => o.status === 'completed')
      .forEach(order => {
        const date = new Date(order.created_at);
        if (date.getFullYear() === currentYear) {
          revenueByMonth[date.getMonth()] += Number(order.total_amount);
        }
      });
    
    return months.map((month, index) => ({
      month,
      revenue: revenueByMonth[index],
    }));
  }, [ordersData?.orders]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    { 
      title: 'Sản phẩm', 
      value: productsCount, 
      icon: Package, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      loading: loadingProducts,
      subtitle: 'Tổng số sản phẩm'
    },
    { 
      title: 'Keys', 
      value: keysData?.total || 0, 
      icon: Key, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      loading: loadingKeys,
      subtitle: `${keysData?.available || 0} còn trống • ${keysData?.sold || 0} đã bán`
    },
    { 
      title: 'Đơn hàng', 
      value: ordersData?.total || 0, 
      icon: ShoppingCart, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      loading: loadingOrders,
      subtitle: `${ordersData?.completed || 0} hoàn thành`
    },
    { 
      title: 'Người dùng', 
      value: usersCount, 
      icon: Users, 
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      loading: loadingUsers,
      subtitle: 'Tổng thành viên'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Doanh thu</CardTitle>
                <CardDescription>Tổng doanh thu năm {new Date().getFullYear()}</CardDescription>
              </div>
              <div className="text-right">
                {loadingOrders ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(ordersData?.revenue || 0)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {loadingOrders ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value;
                      }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--card-foreground))',
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Keys còn trống
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingKeys ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{keysData?.available || 0}</span>
                  <span className="text-muted-foreground">/ {keysData?.total || 0}</span>
                </div>
              )}
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ 
                    width: `${keysData?.total ? (keysData.available / keysData.total) * 100 : 0}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đơn hàng hoàn thành
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-500">{ordersData?.completed || 0}</span>
                  <span className="text-muted-foreground">/ {ordersData?.total || 0}</span>
                </div>
              )}
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ 
                    width: `${ordersData?.total ? (ordersData.completed / ordersData.total) * 100 : 0}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Doanh thu trung bình/đơn
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  {ordersData?.completed 
                    ? formatCurrency(ordersData.revenue / ordersData.completed)
                    : formatCurrency(0)
                  }
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Tính trên {ordersData?.completed || 0} đơn hoàn thành
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
