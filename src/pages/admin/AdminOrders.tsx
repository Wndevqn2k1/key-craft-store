import React, { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableShell } from '@/components/admin/AdminTableShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const AdminOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(ordersData?.map(o => o.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Fetch order items for each order
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('id, quantity, unit_price, product_id, price_tier_id')
            .eq('order_id', order.id);

          const itemsWithDetails = await Promise.all(
            (items || []).map(async (item) => {
              const [productRes, tierRes] = await Promise.all([
                supabase.from('products').select('name').eq('id', item.product_id).single(),
                supabase.from('price_tiers').select('duration_label').eq('id', item.price_tier_id).single(),
              ]);

              return {
                ...item,
                products: productRes.data,
                price_tiers: tierRes.data,
              };
            })
          );

          return {
            ...order,
            profile: profileMap.get(order.user_id) || null,
            order_items: itemsWithDetails,
          };
        })
      );
      
      return ordersWithDetails;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: status as any })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái đơn hàng' });
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Chờ xử lý</Badge>;
      case 'paid':
        return <Badge variant="default">Đã thanh toán</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const tabs = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Đơn hàng"
        description="Theo dõi và cập nhật trạng thái đơn hàng theo thời gian thực"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Admin', href: '/admin' },
          { label: 'Đơn hàng' },
        ]}
        tabs={tabs}
        currentTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      <div className="pt-6">
        <AdminTableShell
          title="Danh sách đơn hàng"
          description="Lọc theo trạng thái để xử lý nhanh hơn"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">Đang tải...</TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">Không tìm thấy đơn phù hợp</TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div>{order.profile?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{order.profile?.email}</div>
                    </TableCell>
                    <TableCell>
                      {order.order_items?.map((item: any, index: number) => (
                        <div key={index} className="text-sm">
                          {item.products?.name} ({item.price_tiers?.duration_label}) x{item.quantity}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPrice(order.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(order.status || 'pending')}</TableCell>
                    <TableCell>{new Date(order.created_at!).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={order.status || 'pending'}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="paid">Đã thanh toán</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableShell>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
