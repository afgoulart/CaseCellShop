'use client';

import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
}

export function Breadcrumb({ crumbs }: Props) {
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">/</span>}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="text-primary-500 hover:text-primary-600 transition-colors font-medium">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-500 font-medium">{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
