export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
};

export const mainNavLoggedOut: NavItem[] = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "About", href: "/about", icon: "Info" },
  { label: "Features", href: "/features", icon: "Star", children: [
      { label: "Personen", href: "/features/personen", icon: "Person" },
    ]
  },
  { label: "Blog", href: "/blog", icon: "Book" },
  { label: "Login", href: "/auth/login", icon: "Login" },
];

export const mainNavLoggedIn: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Events", href: "/events" },
  { label: "Persons", href: "/persons" },
];

export const footerNav: NavItem[] = [
  { label: "Imprint", href: "/imprint" },
  { label: "Privacy", href: "/privacy" },
  { label: "Contact", href: "/contact" },
]; 