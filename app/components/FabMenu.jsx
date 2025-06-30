'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fab, Menu, MenuItem, MenuList, Box, ListSubheader, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookIcon from '@mui/icons-material/Book';
import UploadIcon from '@mui/icons-material/Upload';

export default function FabMenu() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    handleClose();
    router.push(path);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1300,
      }}
    >
      <Tooltip title="Add New" arrow>
        <Fab color="primary" onClick={handleClick}>
          <AddIcon />
        </Fab>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuList>
          <ListSubheader>Historical Persons</ListSubheader>
          <MenuItem onClick={() => handleNavigate('/persons/create')}>
            <PersonAddIcon fontSize="small" style={{ marginRight: 8 }} />
            Add Person
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/persons/import')}>
            <UploadIcon fontSize="small" style={{ marginRight: 8 }} />
            Import Persons
          </MenuItem>
          
          <ListSubheader>Historical Events</ListSubheader>
          <MenuItem onClick={() => handleNavigate('/events/create')}>
            <EventIcon fontSize="small" style={{ marginRight: 8 }} />
            Add Event
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/events/import')}>
            <UploadIcon fontSize="small" style={{ marginRight: 8 }} />
            Import Events
          </MenuItem>
          
          <ListSubheader>Locations</ListSubheader>
          <MenuItem onClick={() => handleNavigate('/locations/create')}>
            <LocationOnIcon fontSize="small" style={{ marginRight: 8 }} />
            Add Location
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/locations/import')}>
            <UploadIcon fontSize="small" style={{ marginRight: 8 }} />
            Import Locations
          </MenuItem>
          
          <ListSubheader>Literature</ListSubheader>
          <MenuItem onClick={() => handleNavigate('/literature/create')}>
            <BookIcon fontSize="small" style={{ marginRight: 8 }} />
            Add Literature
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/literature/import')}>
            <UploadIcon fontSize="small" style={{ marginRight: 8 }} />
            Import Literature
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
