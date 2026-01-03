import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get VCB API token from environment variable
const VCB_API_TOKEN = Deno.env.get('VCB_API_TOKEN') || '';
const VCB_API_URL = `https://api.sieuthicode.net/historyapivcb/${VCB_API_TOKEN}`;

interface Transaction {
  tranDate: string;
  TransactionDate: string;
  Reference: string;
  CD: string;
  Amount: string;
  Description: string;
  PCTime: string;
  DorCCode: string;
  EffDate: string;
  PostingDate: string;
  PostingTime: string;
  Remark: string;
  SeqNo: string;
  TnxCode: string;
  Teller: string;
}

interface VCBResponse {
  mid: string;
  code: string;
  des: string;
  transactions: Transaction[];
  nextIndex: string;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  transfer_content: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching VCB transactions...');
    
    // Fetch transactions from VCB API
    const vcbResponse = await fetch(VCB_API_URL);
    const vcbData: VCBResponse = await vcbResponse.json();
    
    console.log('VCB API response:', vcbData.code, vcbData.des);
    
    if (vcbData.code !== '00') {
      console.error('VCB API error:', vcbData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bank transactions', details: vcbData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter only credit transactions (money received)
    const creditTransactions = vcbData.transactions.filter(t => t.DorCCode === 'C' || t.CD === '+');
    console.log(`Found ${creditTransactions.length} credit transactions`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending deposits
    const { data: pendingDeposits, error: depositsError } = await supabase
      .from('deposits')
      .select('id, user_id, amount, transfer_content, status')
      .eq('status', 'pending');

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending deposits', details: depositsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingDeposits?.length || 0} pending deposits`);

    const matchedDeposits: Array<{ depositId: string; transactionRef: string; amount: number }> = [];
    const processedTransactions: string[] = [];

    // Check each pending deposit against transactions
    for (const deposit of pendingDeposits || []) {
      const transferContent = deposit.transfer_content?.toUpperCase() || '';
      
      for (const transaction of creditTransactions) {
        // Skip if already processed this transaction
        if (processedTransactions.includes(transaction.Reference)) continue;
        
        const description = transaction.Description?.toUpperCase() || '';
        const remark = transaction.Remark?.toUpperCase() || '';
        
        // Parse transaction amount (remove commas)
        const transactionAmount = parseInt(transaction.Amount.replace(/,/g, ''));
        
        // Check if transfer content matches in description or remark
        const contentMatches = description.includes(transferContent) || remark.includes(transferContent);
        
        // Check if amount matches
        const amountMatches = transactionAmount === deposit.amount;
        
        if (contentMatches && amountMatches) {
          console.log(`Match found! Deposit ${deposit.id} matches transaction ${transaction.Reference}`);
          
          // Update deposit status to approved
          const { error: updateError } = await supabase
            .from('deposits')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              admin_note: `Tự động duyệt qua API VCB. Ref: ${transaction.Reference}`
            })
            .eq('id', deposit.id);

          if (updateError) {
            console.error('Error updating deposit:', updateError);
            continue;
          }

          // Update user balance
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', deposit.user_id)
            .single();

          if (!profileError && profile) {
            const newBalance = (profile.balance || 0) + deposit.amount;
            await supabase
              .from('profiles')
              .update({ balance: newBalance })
              .eq('id', deposit.user_id);
            
            console.log(`Updated balance for user ${deposit.user_id}: ${profile.balance} -> ${newBalance}`);
          }

          matchedDeposits.push({
            depositId: deposit.id,
            transactionRef: transaction.Reference,
            amount: deposit.amount
          });
          
          processedTransactions.push(transaction.Reference);
          break; // Move to next deposit
        }
      }
    }

    console.log(`Processed ${matchedDeposits.length} matching deposits`);

    return new Response(
      JSON.stringify({
        success: true,
        totalTransactions: creditTransactions.length,
        pendingDeposits: pendingDeposits?.length || 0,
        matchedDeposits: matchedDeposits.length,
        matches: matchedDeposits
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in check-vcb-transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
