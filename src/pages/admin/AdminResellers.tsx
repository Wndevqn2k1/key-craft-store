import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, UserCheck, Store } from 'lucide-react';
import type { ResellerProfile } from '@/types/database';

export default function AdminResellers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReseller, setSelectedReseller] = useState<ResellerProfile | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Fetch all resellers
  const { data: resellers, isLoading } = useQuery({
    queryKey: ['admin-resellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_profiles')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Approve reseller mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('reseller_profiles')
        .update({
          status,
          note: adminNote || null,
          approved_at: status === 'active' ? new Date().toISOString() : null,
          approved_by: status === 'active' ? user?.id : null,
        })
        .eq('id', id);

      if (error) throw error;

      // If approved, add reseller role
      if (status === 'active' && selectedReseller) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: selectedReseller.user_id,
            role: 'reseller',
          });

        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái reseller',
      });
      setShowApproveDialog(false);
      setSelectedReseller(null);
      setAdminNote('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (reseller: ResellerProfile, status: string) => {
    setSelectedReseller(reseller);
    setShowApproveDialog(true);
    setAdminNote('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: UserCheck, label: 'Chờ duyệt' },
      active: { variant: 'default', icon: CheckCircle, label: 'Hoạt động' },
      suspended: { variant: 'destructive', icon: XCircle, label: 'Đã khóa' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Đang tải...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Quản lý Reseller"
        description="Duyệt và quản lý tài khoản reseller"
        icon={Store}
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Reseller</TableHead>
              <TableHead>Tên / Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resellers?.map((reseller: any) => (
              <TableRow key={reseller.id}>
                <TableCell className="font-mono font-bold">
                  {reseller.reseller_code}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{reseller.profiles?.full_name || 'N/A'}</span>
                    <span className="text-sm text-muted-foreground">{reseller.profiles?.email}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(reseller.status)}</TableCell>
                <TableCell>
                  {new Date(reseller.created_at).toLocaleDateString('vi-VN')}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {reseller.note || '-'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {reseller.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(reseller, 'active')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprove(reseller, 'suspended')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </>
                  )}
                  {reseller.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(reseller, 'suspended')}
                    >
                      Khóa
                    </Button>
                  )}
                  {reseller.status === 'suspended' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(reseller, 'active')}
                    >
                      Mở khóa
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {resellers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chưa có reseller nào đăng ký
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thao tác</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn thực hiện thao tác này với reseller{' '}
              <strong>{selectedReseller?.reseller_code}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú (tùy chọn)</label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Lý do duyệt/từ chối..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (selectedReseller) {
                  approveMutation.mutate({
                    id: selectedReseller.id,
                    status: selectedReseller.status === 'pending' ? 'active' : 'suspended',
                  });
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
