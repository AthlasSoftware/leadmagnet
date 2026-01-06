import React, { useMemo, useState } from 'react';
import { IconButton, Tooltip, Badge, Menu, MenuItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useI18n } from '@/contexts/I18nContext';

const LanguageToggle: React.FC = () => {
  const theme = useTheme();
  const { lang, setLang, t } = useI18n();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const code = useMemo(() => (lang === 'sv' ? 'SV' : 'EN'), [lang]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const choose = (l: 'sv' | 'en') => {
    setLang(l);
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('langToggle.label')}>
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-controls={open ? 'lang-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{
            position: 'fixed',
            bottom: { xs: 84, md: 104 },
            right: { xs: 16, md: 24 },
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            zIndex: 1100,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#333333',
            },
          }}
        >
          <Badge
            color="primary"
            badgeContent={code}
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.55rem',
                height: 14,
                minWidth: 18,
                px: 0.5,
                border: `1px solid ${theme.palette.background.paper}`,
                backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : '#ffffff',
                color: theme.palette.mode === 'light' ? '#fff' : '#1e1e1e',
              },
            }}
          >
            <TranslateIcon fontSize="small" sx={{ color: theme.palette.text.primary }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        id="lang-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        MenuListProps={{ dense: true }}
      >
        <MenuItem selected={lang === 'sv'} onClick={() => choose('sv')}>
          <ListItemIcon sx={{ minWidth: 28 }}>🇸🇪</ListItemIcon>
          <ListItemText primary={t('langToggle.sv')} />
        </MenuItem>
        <MenuItem selected={lang === 'en'} onClick={() => choose('en')}>
          <ListItemIcon sx={{ minWidth: 28 }}>🇬🇧</ListItemIcon>
          <ListItemText primary={t('langToggle.en')} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default LanguageToggle;


