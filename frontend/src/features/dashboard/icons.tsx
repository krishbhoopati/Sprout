type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": true as const,
};

export function LeafIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M6 20c8.5 0 13-5.5 13-14 0-.5 0-1-.1-1.9C10 4 5 8 5 15c0 2 .3 3.6.9 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20c0-3.5 1.8-7 6-9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloudIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M7 18h10a4 4 0 0 0 .5-7.97 5.5 5.5 0 0 0-10.6-1.8A4.5 4.5 0 0 0 7 18Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoinIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 7.5v9M9.5 15a2.5 2.5 0 0 0 2.5 1.5c1.4 0 2.5-.8 2.5-2s-1-1.6-2.5-2-2.5-.8-2.5-2 1.1-2 2.5-2a2.5 2.5 0 0 1 2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PackageIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M4 8.5V16l8 4.5 8-4.5V8.5M12 13v7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M4.5 16v-3.2c0-.4.1-.8.4-1.1L6.7 8.9c.3-.4.8-.6 1.3-.6h8c.5 0 1 .2 1.3.6l1.8 2.8c.3.3.4.7.4 1.1V16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 16h15v1.5a1 1 0 0 1-1 1H16a1 1 0 0 1-1-1V17H9v.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V16Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M7 13.2h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlateIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function ParkingIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M9.5 16.5v-9H13a2.75 2.75 0 0 1 0 5.5H9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
