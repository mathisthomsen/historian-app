import { useState } from 'react';
import Link from 'next/link';
import { Button, Menu, MenuItem, Stack } from '@mui/material';
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
    <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2 }}>
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        if (!hasChildren) {
          return (
            <Button
              key={item.href}
              color="inherit"
              component={Link}
              href={item.href}
              sx={{ fontWeight: 500 }}
              startIcon={getMuiIcon(item.icon)}
            >
              {item.label}
            </Button>
          );
        }
        return (
          <>
            <Button
              key={item.href}
              color="inherit"
              aria-haspopup="true"
              aria-controls={`menu-${item.href}`}
              aria-expanded={Boolean(anchorEls[item.href])}
              onClick={(e) => handleMenuOpen(e, item.href)}
              sx={{ fontWeight: 500 }}
              endIcon={
                <ExpandMoreIcon
                  aria-expanded={Boolean(anchorEls[item.href])}
                  sx={{
                    transition: 'transform 0.2s',
                    transform: Boolean(anchorEls[item.href]) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              }
              startIcon={getMuiIcon(item.icon)}
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
            >
              {item.children?.map((child) => (
                <MenuItem
                  key={child.href}
                  component={Link}
                  href={child.href}
                  onClick={() => handleMenuClose(item.href)}
                >
                  {getMuiIcon(child.icon)}
                  {child.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        );
      })}
    </Stack>
  );
} 