export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
};

export const mainNavLoggedOut: NavItem[] = [
  { label: "Funktionen", href: "/funktionen", icon: "Star", children: [
      { label: "Personen", href: "/funktionen/personen", icon: "Person" },
      { label: "Ereignisse", href: "/funktionen/ereignisse", icon: "Event" },
      { label: "Orte", href: "/funktionen/orte", icon: "Place" },
      { label: "Organisationen", href: "/funktionen/organisationen", icon: "Business" },
      { label: "Dokumente", href: "/funktionen/dokumente", icon: "Document" },
      { label: "Quellen", href: "/funktionen/quellen", icon: "Source" },
      { label: "Karten", href: "/funktionen/karten", icon: "Map" },
      { label: "Statistiken", href: "/funktionen/statistiken", icon: "BarChart" },
      { label: "Berichte", href: "/funktionen/berichte", icon: "Report" },
    ]
  },
  { label: "Blog", href: "/blog", icon: "Book" },
  { label: "Über uns", href: "/ueber-uns", icon: "Info" },
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