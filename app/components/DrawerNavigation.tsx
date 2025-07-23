import { useState } from 'react';
import Link from 'next/link';
import { List, ListItem, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import * as MuiIcons from '@mui/icons-material';
import { NavItem } from './navConfig';

function getMuiIcon(iconName?: string) {
  if (!iconName) return <MuiIcons.Home />;
  const IconComponent = (MuiIcons as any)[iconName];
  return IconComponent ? <IconComponent /> : <MuiIcons.Home />;
}

export function DrawerNavigation({ items }: { items: NavItem[] }) {
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});

  const handleToggle = (href: string) => {
    setOpenStates((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const renderItems = (navItems: NavItem[], level = 0) => (
    navItems.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      if (hasChildren) {
        return (
          <div key={item.href}>
            <ListItem onClick={() => handleToggle(item.href)} sx={{ pl: 2 * level, cursor: 'pointer' }}>
              <ListItemIcon>{getMuiIcon(item.icon)}</ListItemIcon>
              <ListItemText primary={item.label} />
              {openStates[item.href] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openStates[item.href]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderItems(item.children!, level + 1)}
              </List>
            </Collapse>
          </div>
        );
      } else {
        return (
          <ListItem key={item.href} component={Link} href={item.href} sx={{ pl: 2 * level }}>
            <ListItemIcon>{getMuiIcon(item.icon)}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        );
      }
    })
  );

  return <List>{renderItems(items)}</List>;
} 