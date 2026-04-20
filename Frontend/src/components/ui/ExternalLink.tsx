import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode };

export default function ExternalLink({ children, className = "", ...rest }: Props) {
  return (
    <a target="_blank" rel="noreferrer noopener" className={`inline-flex items-center gap-1 ${className}`} {...rest}>
      {children}
      <span aria-hidden className="text-[0.85em] text-violet-glow">↗</span>
    </a>
  );
}
