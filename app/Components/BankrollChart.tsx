interface BankrollChartProps {
  values: number[];
}

export default function BankrollChart({ values }: BankrollChartProps) {
  // ✅ Sécurité : pas assez de données
  if (!values || values.length < 2 || values.some((v) => isNaN(v))) {
    return (
      <div className="w-full h-40 mt-4 flex items-center justify-center text-muted text-sm">
        Pas encore de données
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  // ✅ Sécurité : toutes les valeurs identiques
  if (range === 0) {
    return (
      <div className="w-full h-40 mt-4 flex items-center justify-center text-muted text-sm">
        Bankroll stable ({values[0]}€)
      </div>
    );
  }

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="w-full h-40 mt-4">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#00bfff"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
}