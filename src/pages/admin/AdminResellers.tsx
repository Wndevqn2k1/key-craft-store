import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';

export default function AdminResellers() {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Quản lý Reseller"
        description="Duyệt và quản lý tài khoản reseller"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Chức năng đang phát triển
          </CardTitle>
          <CardDescription>
            Chức năng quản lý reseller sẽ sớm được cập nhật. Vui lòng quay lại sau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Để sử dụng chức năng này, cần tạo bảng <code>reseller_profiles</code> trong database.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
