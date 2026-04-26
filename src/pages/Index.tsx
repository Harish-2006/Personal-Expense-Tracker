import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BalanceOverview from "@/components/BalanceOverview";
import TransactionForm from "@/components/TransactionForm";
import TransactionHistory from "@/components/TransactionHistory";
import SpendingChart from "@/components/SpendingChart";
import CurrencySelector from "@/components/CurrencySelector";
import EditTransactionDialog from "@/components/EditTransactionDialog";
import MonthlySummary from "@/components/MonthlySummary";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState('INR');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'income' | 'expense' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching transactions",
        description: error.message,
        variant: "destructive"
      });
    } else {
      const formattedTransactions = data.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        category: t.category,
        description: t.description,
        date: new Date(t.created_at).toISOString().split('T')[0],
        currency: t.currency
      }));
      setTransactions(formattedTransactions);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: transactionData.type,
        amount: transactionData.amount,
        category: transactionData.category,
        description: transactionData.description,
        currency: currency
      });

    if (error) {
      toast({
        title: "Error adding transaction",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Transaction added",
        description: "Your transaction has been saved successfully!"
      });
      fetchTransactions();
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleSaveTransaction = async (updatedTransaction: Transaction) => {
    if (!user) return;

    const { error } = await supabase
      .from('transactions')
      .update({
        type: updatedTransaction.type,
        amount: updatedTransaction.amount,
        category: updatedTransaction.category,
        description: updatedTransaction.description
      })
      .eq('id', updatedTransaction.id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error updating transaction",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Transaction updated",
        description: "Your transaction has been updated successfully!"
      });
      fetchTransactions();
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Transaction deleted",
        description: "Your transaction has been deleted successfully!"
      });
      fetchTransactions();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleIncomeClick = () => {
    setTransactionFilter(transactionFilter === 'income' ? null : 'income');
  };

  const handleExpenseClick = () => {
    setTransactionFilter(transactionFilter === 'expense' ? null : 'expense');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Personal Expense Tracker
              </h1>
              <p className="text-xl text-muted-foreground">
                Keep track of your finances for a happy living 💚
              </p>
            </div>
            <div className="flex items-center gap-4">
              <CurrencySelector currency={currency} onCurrencyChange={setCurrency} />
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Balance Overview */}
          <BalanceOverview transactions={transactions} currency={currency} />

          {/* Monthly Summary */}
          <MonthlySummary 
            transactions={transactions} 
            currency={currency}
            onIncomeClick={handleIncomeClick}
            onExpenseClick={handleExpenseClick}
          />

          {/* Transaction Form and Chart */}
          <div className="grid gap-8 lg:grid-cols-2">
            <TransactionForm onAddTransaction={addTransaction} />
            <SpendingChart transactions={transactions} currency={currency} />
          </div>

          {/* Transaction History */}
          <TransactionHistory 
            transactions={transactions} 
            currency={currency} 
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            filter={transactionFilter}
            onClearFilter={() => setTransactionFilter(null)}
          />
        </div>

        <EditTransactionDialog
          transaction={editingTransaction}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveTransaction}
        />
      </div>
    </div>
  );
};

export default Index;