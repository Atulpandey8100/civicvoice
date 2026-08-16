const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl'
};

export default function Avatar({ user, size = 'md', className = '' }) {
  const name = user?.name || user?.firstName || user?.email || 'U';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const sizeClass = SIZES[size] || SIZES.md;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${sizeClass} shrink-0 rounded-full border border-line object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{ background: 'var(--accent)' }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
