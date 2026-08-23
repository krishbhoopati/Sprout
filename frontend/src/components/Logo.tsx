import { Link } from "react-router-dom";

export function Logo({
  to = "/",
  className = "text-sprout-700",
}: {
  to?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 font-extrabold transition-transform duration-150 active:scale-95 ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
        <path
          d="M16 29V14"
          stroke="#40721d"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M16 16C16 16 9 16 6 11C6 11 14 8 16 16Z" fill="#72ab43" />
        <path d="M16 13C16 13 17 6 24 5C24 5 24 13 16 13Z" fill="#548f28" />
      </svg>
      <span className="text-lg">Sprout</span>
    </Link>
  );
}
