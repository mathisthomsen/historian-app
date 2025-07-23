import Link from 'next/link';

export type NavItem = {
  label: string;
  href: string;
};

export function Navigation({ items }: { items: NavItem[] }) {
  return (
    <nav>
      <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
} 