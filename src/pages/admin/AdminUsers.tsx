import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, ShieldOff, Pencil, Trash2, MoreHorizontal, Wallet, UserCog, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [topUpAmount, setTopUpAmount] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesError) throw rolesError;

      // Map roles to profiles
      return profiles.map(profile => ({
        ...profile,
        user_roles: roles.filter(role => role.user_id === profile.id)
      }));
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'user' | 'reseller' }) => {
      // Check if user_role exists first
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: newRole }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] }); // Invalidate user role cache
      toast({ title: 'Thành công', description: 'Đã cập nhật quyền người dùng' });
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { full_name: string; phone: string } }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name, phone: data.phone })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật thông tin người dùng' });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user roles first
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Delete profile
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Thành công', description: 'Đã xoá người dùng' });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const topUpMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      // Get current balance
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentBalance = Number(profile?.balance) || 0;
      const newBalance = currentBalance + amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Thành công', description: 'Đã nạp tiền cho người dùng' });
      setTopUpDialogOpen(false);
      setTopUpAmount('');
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const isUserAdmin = (user: any) => {
    return user.user_roles?.some((role: any) => role.role === 'admin');
  };

  const getUserRole = (user: any): 'admin' | 'user' => {
    if (user.user_roles?.some((role: any) => role.role === 'admin')) return 'admin';
    return 'user';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Quản trị viên',
      reseller: 'Đại lý',
      user: 'Người dùng',
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'destructive' | 'secondary' => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      admin: 'destructive',
      reseller: 'default',
      user: 'secondary',
    };
    return variants[role] || 'secondary';
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setEditForm({ full_name: user.full_name || '', phone: user.phone || '' });
    setEditDialogOpen(true);
  };

  const handleTopUp = (user: any) => {
    setSelectedUser(user);
    setTopUpAmount('');
    setTopUpDialogOpen(true);
  };

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Số dư</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Chưa có người dùng nào</TableCell>
                </TableRow>
              ) : (
                users?.map((user) => {
                  const userRole = getUserRole(user);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name || 'Chưa cập nhật'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell className="font-medium text-primary">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(user.balance) || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(userRole)} className="min-w-[120px] justify-center">
                            {getRoleLabel(userRole)}
                          </Badge>
                          <Select
                            value={userRole}
                            onValueChange={(newRole) => {
                              toggleAdminMutation.mutate({ 
                                userId: user.id, 
                                newRole: newRole as 'admin' | 'user' | 'reseller'
                              });
                            }}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>User</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="reseller">
                                <div className="flex items-center gap-2">
                                  <UserCog className="w-4 h-4" />
                                  <span>Reseller</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  <span>Admin</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.created_at!).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTopUp(user)}>
                              <Wallet className="h-4 w-4 mr-2" />
                              Nạp tiền
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xoá người dùng
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ tên</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => updateUserMutation.mutate({ userId: selectedUser?.id, data: editForm })}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nạp tiền cho người dùng</DialogTitle>
            <DialogDescription>
              Nạp tiền cho {selectedUser?.email}
              <br />
              Số dư hiện tại: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(selectedUser?.balance) || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền nạp (VND)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Nhập số tiền"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpDialogOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => topUpMutation.mutate({ userId: selectedUser?.id, amount: Number(topUpAmount) })}
              disabled={topUpMutation.isPending || !topUpAmount || Number(topUpAmount) <= 0}
            >
              {topUpMutation.isPending ? 'Đang nạp...' : 'Nạp tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá người dùng <strong>{selectedUser?.email}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(selectedUser?.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
