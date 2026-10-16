interface PickCardProps {
  match: string;
  league: string;
  type: string;
  bet: string;
  cote: string;
  conf: number;
  cat: string;
}

export default function PickCard({
  match,
  league,
  type,
  bet,
  cote,
  conf,
  cat,
}: PickCardProps) {
  return (
    <div className="bg-card border border-line/10 rounded-3xl p-5 flex flex-col gap-2 hover:border-primary/40 transition">
      <div className="text-xs text-primary font-bold">{cat}</div>

      <h3 className="font-black text-lg text-ink">{match}</h3>
      <div className="text-xs text-muted">{league}</div>

      <div className="mt-2 text-sm text-muted">{type}</div>
      <div className="font-bold text-ink">{bet}</div>

      <div className="flex justify-between items-center mt-3">
        <span className="text-primary font-black text-xl">{cote}</span>

        <span className="text-xs bg-primary/10 border border-primary/20 px-2 py-1 rounded-full font-bold">
          Confiance : {conf}/5
        </span>
      </div>
    </div>
  );
}
