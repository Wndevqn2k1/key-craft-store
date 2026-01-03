import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const useDepositRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('deposit-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deposits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          const amount = payload.new.amount;

          // Only notify when status changes to approved
          if (oldStatus === 'pending' && newStatus === 'approved') {
            const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
            toast.success(`Nạp tiền thành công!`, {
              description: `${formattedAmount}đ đã được cộng vào tài khoản của bạn.`,
              duration: 10000,
            });

            // Refresh related queries
            queryClient.invalidateQueries({ queryKey: ['pending-deposit'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['deposit-history'] });
          } else if (oldStatus === 'pending' && newStatus === 'rejected') {
            toast.error(`Yêu cầu nạp tiền bị từ chối`, {
              description: payload.new.admin_note || 'Vui lòng liên hệ hỗ trợ.',
              duration: 10000,
            });

            // Refresh related queries
            queryClient.invalidateQueries({ queryKey: ['pending-deposit'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
