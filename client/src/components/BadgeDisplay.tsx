import { BADGES, type UserProgress } from '../lib/progress';

interface BadgeDisplayProps {
  readonly progress: UserProgress;
  readonly showAll?: boolean;
}

export default function BadgeDisplay({ progress, showAll = false }: BadgeDisplayProps) {
  const badgesToShow = showAll
    ? BADGES
    : BADGES.filter(b => progress.badges.includes(b.id));

  if (badgesToShow.length === 0 && !showAll) {
    return (
      <div className="text-center text-slate-600 py-6 text-sm">
        还没有获得徽章，继续加油！
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {badgesToShow.map((badge) => {
        const earned = progress.badges.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={`flex flex-col items-center p-3.5 rounded-2xl border transition-all duration-300 ${
              earned
                ? 'border-amber-200 hover:shadow-md hover:-translate-y-0.5'
                : 'border-slate-200 opacity-60'
            }`}
            style={{
              background: earned ? 'rgba(255,251,235,0.98)' : 'rgba(255,255,255,0.96)',
            }}
          >
            <span className={`text-3xl mb-1.5 ${earned ? '' : 'grayscale'}`}>
              {badge.icon}
            </span>
            <span className={`text-xs font-semibold text-center leading-tight ${
              earned ? 'text-slate-800' : 'text-slate-600'
            }`}>
              {badge.name}
            </span>
            <span className="text-[10px] text-slate-600 text-center mt-1 leading-tight font-medium">
              {badge.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
