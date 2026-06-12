// Lightweight dependency-free charts (server components, pure SVG/CSS).

export function HBars({
  items,
}: {
  items: Array<{ label: string; value: number; display?: string }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((i, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between gap-2 text-xs">
            <span className="truncate">{i.label}</span>
            <span className="font-medium">{i.display ?? i.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DropOffChart({
  data,
}: {
  data: Array<{ pct: number; reached: number }>;
}) {
  if (data.length === 0) {
    return null;
  }
  const max = Math.max(1, ...data.map((d) => d.reached));
  const W = 300;
  const H = 80;
  const pts = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * W : 0;
    const y = H - (d.reached / max) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(" ");
  const area = `0,${H} ${line} ${W},${H}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-20 w-full"
      role="img"
      aria-label="Drop-off curve"
    >
      <polygon points={area} fill="hsl(var(--primary))" opacity="0.12" />
      <polyline
        points={line}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
