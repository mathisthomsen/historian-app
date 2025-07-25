import { useState } from 'react';
import Link from 'next/link';
import { Button, ListItemText, ListItemIcon, Menu, MenuItem, Stack } from '@mui/material';
import { NavItem } from './navConfig';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as MuiIcons from '@mui/icons-material';

function getMuiIcon(iconName?: string) {
  if (!iconName) return <MuiIcons.Home />;
  const IconComponent = (MuiIcons as any)[iconName];
  return IconComponent ? <IconComponent /> : <MuiIcons.Home />;
}

export function AppBarNavigation({ items }: { items: NavItem[] }) {
  const [anchorEls, setAnchorEls] = useState<{ [key: string]: HTMLElement | null }>({});

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, href: string) => {
    setAnchorEls((prev) => ({ ...prev, [href]: event.currentTarget }));
  };
  const handleMenuClose = (href: string) => {
    setAnchorEls((prev) => ({ ...prev, [href]: null }));
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2, pl: 2 }}>
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        if (!hasChildren) {
          return (
            <Button
              key={item.href}
              variant='text'
              component={Link}
              href={item.href}
              sx={{ fontWeight: 500, color: 'white' }}
            >
              {item.label}
            </Button>
          );
        }
        return (
          <>
            <Button
              key={item.href}
              aria-haspopup="true"
              aria-controls={`menu-${item.href}`}
              aria-expanded={Boolean(anchorEls[item.href])}
              onClick={(e) => handleMenuOpen(e, item.href)}
              sx={{ fontWeight: 500, color: 'white' }}
              endIcon={
                <ExpandMoreIcon
                  aria-expanded={Boolean(anchorEls[item.href])}
                  sx={{
                    transition: 'transform 0.2s',
                    transform: Boolean(anchorEls[item.href]) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              }
            >
              {item.label}
            </Button>
            <Menu
              id={`menu-${item.href}`}
              anchorEl={anchorEls[item.href]}
              open={Boolean(anchorEls[item.href])}
              onClose={() => handleMenuClose(item.href)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              keepMounted
              PaperProps={{
                sx: {
                  background: 'rgba(30, 41, 59, 0.55)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }
              }}
            >
              {item.children?.map((child) => (
                <MenuItem
                  id={`menu-item-${child.href}`}
                  key={child.href}
                  component={Link}
                  href={child.href}
                  onClick={() => handleMenuClose(item.href)}
                >
                  <ListItemIcon sx={{ color: 'white' }}>{getMuiIcon(child.icon)}</ListItemIcon>
                  <ListItemText primary={child.label} />
                </MenuItem>
              ))}
            </Menu>
          </>
        );
      })}
    </Stack>
  );
} 