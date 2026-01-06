import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  };
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  existingReview,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t('auth.loginRequired'));
      if (rating === 0) throw new Error(t('review.selectRating'));

      const reviewData = {
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim(),
      };

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('product_reviews')
          .update({ rating, comment: comment.trim() })
          .eq('id', existingReview.id);
        if (error) throw error;
      } else {
        // Create new review
        const { error } = await supabase
          .from('product_reviews')
          .insert([reviewData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', productId] });
      toast({
        title: t('common.success'),
        description: existingReview
          ? t('review.updateSuccess')
          : t('review.submitSuccess'),
      });
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {t('review.loginToReview')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingReview ? t('review.editReview') : t('review.writeReview')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reviewMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('review.yourRating')}
            </label>
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          </div>

          <div>
            <label htmlFor="comment" className="text-sm font-medium mb-2 block">
              {t('review.yourReview')}
            </label>
            <Textarea
              id="comment"
              placeholder={t('review.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={reviewMutation.isPending || rating === 0}
            className="w-full"
          >
            {reviewMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : existingReview ? (
              t('review.updateReview')
            ) : (
              t('review.submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
