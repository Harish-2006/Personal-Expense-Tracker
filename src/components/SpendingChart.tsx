import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
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

interface SpendingChartProps {
  transactions: Transaction[];
  currency: string;
}

const COLORS = [
  'hsl(25, 95%, 53%)',   // Orange
  'hsl(45, 93%, 58%)',   // Yellow
  'hsl(142, 71%, 45%)',  // Green
  'hsl(217, 91%, 60%)',  // Blue
  'hsl(262, 83%, 58%)',  // Purple
  'hsl(346, 87%, 43%)',  // Pink
  'hsl(173, 80%, 40%)',  // Teal
  'hsl(20, 79%, 52%)',   // Red-orange
];

export default function SpendingChart({ transactions, currency }: SpendingChartProps) {
  const { convertCurrency, formatCurrency } = useCurrencyConverter();
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const categoryData = expenseTransactions.reduce((acc, transaction) => {
    const convertedAmount = convertCurrency(transaction.amount, transaction.currency, currency);
    if (acc[transaction.category]) {
      acc[transaction.category] += convertedAmount;
    } else {
      acc[transaction.category] = convertedAmount;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
    }))
    .sort((a, b) => b.value - a.value);

  if (expenseTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Spending by Category
          </CardTitle>
          <CardDescription>Breakdown of your expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No expenses to show</p>
            <p className="text-sm">Add some expenses to see your spending breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Spending by Category
        </CardTitle>
        <CardDescription>Breakdown of your expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number, currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {chartData.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}