const navigationItems = [
  {
    href: "#dashboard",
    label: "Today",
    icon: "◉",
  },
  {
    href: "#meals",
    label: "Meals",
    icon: "▤",
  },
  {
    href: "#activity",
    label: "Activity",
    icon: "↗",
  },
  {
    href: "#progress",
    label: "Progress",
    icon: "▥",
  },
];

export default function MobileNavigation() {
  return (
    <nav className="mobile-navigation" aria-label="Primary navigation">
      {navigationItems.map((item) => (
        <a href={item.href} key={item.href}>
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.label}</small>
        </a>
      ))}
    </nav>
  );
}
