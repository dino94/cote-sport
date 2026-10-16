interface AnalysisCardProps {
  sport: string;
  compet: string;
  date: string;
  title: string;
  resume: string;
  icon: string;
}

export default function AnalysisCard({
  sport,
  compet,
  date,
  title,
  resume,
  icon,
}: AnalysisCardProps) {
  return (
    <article className="bg-card border border-line/10 rounded-xl p-5 hover:border-primary/30 transition">
      <div className="flex items-center gap-2 text-xs text-muted mb-2">
        <span className="text-lg">{icon}</span>
        <span className="font-bold">{sport}</span>
        <span>·</span>
        <span>{compet}</span>
      </div>
      <div className="text-xs text-muted mb-1">{date}</div>
      <h3 className="font-black text-lg text-ink">{title}</h3>
      <p className="text-sm text-muted mt-1">{resume}</p>
    </article>
  );
}
