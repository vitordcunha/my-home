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
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 space-y-3 border border-primary/20">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">💰 Total Gasto</p>
        
        <p className="text-4xl font-bold text-primary">
          {formatCurrency(totalSpent)}
        </p>

        <p className="text-xs text-muted-foreground mt-3">
          Total de despesas registradas
        </p>
      </div>
    </div>
  );
}


