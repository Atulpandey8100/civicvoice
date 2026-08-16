export default function Logo({ size = 32, className = '' }) {
  return (
    <img
      src="/logo.png"
      alt="CivicVoice logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
