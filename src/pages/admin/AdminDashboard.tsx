import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Key, ShoppingCart, Users } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { title: 'Sản phẩm', value: '0', icon: Package, color: 'text-blue-500' },
    { title: 'Keys', value: '0', icon: Key, color: 'text-green-500' },
    { title: 'Đơn hàng', value: '0', icon: ShoppingCart, color: 'text-orange-500' },
    { title: 'Người dùng', value: '0', icon: Users, color: 'text-purple-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
