import { BRAND_GRADIENT_FROM, BRAND_GRADIENT_TO } from "@/brand";

/* The Futuru mark on a 32-unit field: three stepped bars on the brand
   gradient, traced from futuru.pt's own icon. The gradient runs in user space
   so it crosses the square at the same angle the original does. Every copy on
   a page draws the same gradient, so one shared id is safe. */
export function FuturuMark({ size = 24, title }: { size?: number; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient
          id="futuru-mark-gradient"
          gradientUnits="userSpaceOnUse"
          x1="-19.56"
          y1="43.82"
          x2="45.04"
          y2="6.13"
        >
          <stop offset="0" stopColor={BRAND_GRADIENT_FROM} />
          <stop offset="1" stopColor={BRAND_GRADIENT_TO} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.5" fill="url(#futuru-mark-gradient)" />
      <g fill="#fff">
        <rect x="9.14" y="8.55" width="13.71" height="3.66" />
        <rect x="9.14" y="14.17" width="10.95" height="3.66" />
        <rect x="9.14" y="19.8" width="4.6" height="3.66" />
      </g>
    </svg>
  );
}
