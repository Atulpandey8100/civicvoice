import Logo from './Logo';

export default function SplashScreen() {
  return (
    <div
      role="status"
      aria-label="Loading CivicVoice"
      className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-5 bg-surface"
    >
      <div className="animate-pop-in">
        <div className="animate-pulse">
          <Logo size={92} />
        </div>
      </div>
      <p className="font-display text-2xl font-bold tracking-tight text-ink">
        Civic<span className="text-accent">Voice</span>
      </p>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:240ms]" />
      </div>
    </div>
  );
}
