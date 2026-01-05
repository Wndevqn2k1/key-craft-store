import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Loader2,
  Wallet,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transfer_content: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  profiles: {
    email: string | null;
    full_name: string | null;
  } | null;
}

const AdminDeposits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: async () => {
      const { data: depositsData, error } = await supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(depositsData.map(d => d.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      
      return depositsData.map(d => ({
        ...d,
        profiles: profilesMap.get(d.user_id) || null,
      })) as Deposit[];
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: async ({ depositId, status, adminNote }: { 
      depositId: string; 
      status: 'approved' | 'rejected';
      adminNote: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update deposit status
      const { error: depositError } = await supabase
        .from('deposits')
        .update({
          status,
          admin_note: adminNote,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', depositId);

      if (depositError) throw depositError;

      // If approved, add balance to user
      if (status === 'approved') {
        const deposit = deposits?.find(d => d.id === depositId);
        if (deposit) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', deposit.user_id)
            .single();

          const currentBalance = profile?.balance || 0;
          
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: currentBalance + deposit.amount })
            .eq('id', deposit.user_id);

          if (balanceError) throw balanceError;
        }
      }
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      
      // Send email notification
      if (selectedDeposit) {
        try {
          // Get user profile for email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, balance')
            .eq('id', selectedDeposit.user_id)
            .single();

          if (profile?.email) {
            const { data, error } = await supabase.functions.invoke('send-deposit-email', {
              body: {
                depositId: selectedDeposit.id,
                userEmail: profile.email,
                userName: profile.full_name || profile.email.split('@')[0],
                userId: selectedDeposit.user_id,
                amount: selectedDeposit.amount,
                status: variables.status,
                adminNote: variables.admin_note,
                newBalance: variables.status === 'approved' ? profile.balance : undefined,
              },
            });
            
            if (error) {
              console.error('Deposit email error:', error);
            }
          }
        } catch (emailError) {
          console.error('Failed to send deposit email:', emailError);
          // Don't fail the operation if email fails
        }
      }
      
      toast({
        title: variables.status === 'approved' ? "Đã duyệt!" : "Đã từ chối!",
        description: variables.status === 'approved' 
          ? "Yêu cầu nạp tiền đã được duyệt và số dư đã được cập nhật."
          : "Yêu cầu nạp tiền đã bị từ chối.",
      });
      setSelectedDeposit(null);
      setActionType(null);
      setAdminNote("");
    },
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: "Không thể xử lý yêu cầu. Vui lòng thử lại.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const filteredDeposits = deposits?.filter(deposit => {
    const searchLower = searchQuery.toLowerCase();
    return (
      deposit.profiles?.email?.toLowerCase().includes(searchLower) ||
      deposit.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      deposit.transfer_content?.toLowerCase().includes(searchLower)
    );
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 gap-1"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = (deposit: Deposit, type: 'approve' | 'reject') => {
    setSelectedDeposit(deposit);
    setActionType(type);
    setAdminNote("");
  };

  const confirmAction = () => {
    if (!selectedDeposit || !actionType) return;
    updateDepositMutation.mutate({
      depositId: selectedDeposit.id,
      status: actionType === 'approve' ? 'approved' : 'rejected',
      adminNote,
    });
  };

  const pendingCount = deposits?.filter(d => d.status === 'pending').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              Quản lý nạp tiền
            </h1>
            <p className="text-muted-foreground">
              Xem và xử lý các yêu cầu nạp tiền
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingCount} chờ duyệt</Badge>
              )}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email, tên, nội dung CK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Nội dung CK</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Chưa có yêu cầu nạp tiền nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeposits?.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell className="text-sm">
                        {format(new Date(deposit.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{deposit.profiles?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{deposit.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatAmount(deposit.amount)}đ
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {deposit.transfer_content || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                      <TableCell className="text-right">
                        {deposit.status === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-500 hover:text-green-400"
                              onClick={() => handleAction(deposit, 'approve')}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleAction(deposit, 'reject')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedDeposit(deposit);
                              setActionType(null);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => {
        setSelectedDeposit(null);
        setActionType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && "Xác nhận duyệt nạp tiền"}
              {actionType === 'reject' && "Xác nhận từ chối nạp tiền"}
              {!actionType && "Chi tiết yêu cầu"}
            </DialogTitle>
            <DialogDescription>
              {actionType 
                ? `Bạn có chắc chắn muốn ${actionType === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu nạp tiền này?`
                : "Thông tin chi tiết về yêu cầu nạp tiền"
              }
            </DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Người dùng</p>
                  <p className="font-medium">{selectedDeposit.profiles?.full_name || "N/A"}</p>
                  <p className="text-sm">{selectedDeposit.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="font-bold text-primary text-xl">
                    {formatAmount(selectedDeposit.amount)}đ
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nội dung CK</p>
                  <p className="font-mono">{selectedDeposit.transfer_content || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  {getStatusBadge(selectedDeposit.status)}
                </div>
              </div>

              {actionType && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú (tùy chọn)</label>
                  <Textarea
                    placeholder="Nhập ghi chú cho người dùng..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>
              )}

              {selectedDeposit.admin_note && !actionType && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Ghi chú admin</p>
                  <p>{selectedDeposit.admin_note}</p>
                </div>
              )}
            </div>
          )}

          {actionType && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDeposit(null)}>
                Hủy
              </Button>
              <Button
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                onClick={confirmAction}
                disabled={updateDepositMutation.isPending}
              >
                {updateDepositMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : actionType === 'approve' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {actionType === 'approve' ? 'Duyệt' : 'Từ chối'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDeposits;
