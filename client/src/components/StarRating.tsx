interface StarRatingProps {
  readonly stars: number;
  readonly maxStars?: number;
  readonly size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function StarRating({ stars, maxStars = 5, size = 'md' }: StarRatingProps) {
  const sizeClass = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {Array.from({ length: maxStars }, (_, i) => (
        <span
          key={i}
          className={`transition-all duration-300 ${
            i < stars
              ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]'
              : 'text-slate-300'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
