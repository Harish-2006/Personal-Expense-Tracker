import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpCircle, ArrowDownCircle, History, Edit, Trash2, Eye, Search, X } from "lucide-react";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  currency: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  filter?: 'income' | 'expense' | null;
  onClearFilter?: () => void;
}

export default function TransactionHistory({ transactions, currency, onEdit, onDelete, filter, onClearFilter }: TransactionHistoryProps) {
  const { convertCurrency, formatCurrency } = useCurrencyConverter();
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Get unique categories
  const categories = Array.from(new Set(transactions.map(t => t.category)));
  
  const filteredTransactions = transactions.filter(t => {
    // Filter by type (income/expense)
    if (filter && t.type !== filter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = t.description.toLowerCase().includes(query);
      const matchesCategory = t.category.toLowerCase().includes(query);
      const matchesAmount = t.amount.toString().includes(query);
      if (!matchesDescription && !matchesCategory && !matchesAmount) return false;
    }
    
    // Filter by category
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    
    return true;
  });
    
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
          <CardDescription>Your recent financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Add your first income or expense to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {filter ? `${filter === 'income' ? 'Income' : 'Expense'} History` : 'Transaction History'}
          {filter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilter}
              className="ml-auto text-xs"
            >
              Show All
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {filter ? `Your ${filter} transactions` : 'Your recent financial activities'}
        </CardDescription>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(showAll ? sortedTransactions : sortedTransactions.slice(0, 10)).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {transaction.type === 'income' ? (
                  <ArrowUpCircle className="h-5 w-5 text-income" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-expense" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {transaction.category}
                    </Badge>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`font-semibold ${
                  transaction.type === 'income' ? 'text-income' : 'text-expense'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(convertCurrency(transaction.amount, transaction.currency, currency), currency)}
                  {transaction.currency !== currency && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (orig: {formatCurrency(transaction.amount, transaction.currency)})
                    </span>
                  )}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(transaction)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {sortedTransactions.length > 10 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showAll ? `Show Latest 10` : `View All ${sortedTransactions.length} Transactions`}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}