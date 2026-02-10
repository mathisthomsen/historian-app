import { useState } from 'react';
import Link from 'next/link';
import { List, ListItem, ListItemIcon, ListItemText, Collapse, ListItemButton } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import * as MuiIcons from '@mui/icons-material';
import { NavItem } from '../layout/navConfig';

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
          <li key={item.href}>
            <ListItemButton onClick={() => handleToggle(item.href)} component={'button'} sx={{width: '100%'}}>
                <ListItemIcon sx={{ color: 'white' }}>{getMuiIcon(item.icon)}</ListItemIcon>
                <ListItemText primary={item.label} />
                {openStates[item.href] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openStates[item.href]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {renderItems(item.children!, level + 1)}
              </List>
            </Collapse>
          </li>
        );
      } else {
        return (
          <ListItem 
            disablePadding
            key={item.href}
            component="li"
            sx={{ pl: 2 * level }}
            >
            <ListItemButton component={Link} href={item.href}>
              <ListItemIcon>{getMuiIcon(item.icon)}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        );
      }
    })
  );

  return <List>{renderItems(items)}</List>;
} 