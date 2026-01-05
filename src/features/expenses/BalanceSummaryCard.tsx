interface TotalSpentCardProps {
  totalSpent: number;
}

export function TotalSpentCard({ totalSpent }: TotalSpentCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-6 space-y-3 border border-blue-100 dark:border-blue-900">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">💰 Total Gasto</p>
        
        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(totalSpent)}
        </p>

        <p className="text-xs text-muted-foreground mt-3">
          Total de despesas registradas
        </p>
      </div>
    </div>
  );
}


