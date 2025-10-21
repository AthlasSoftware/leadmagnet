import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { Lightbulb, LightbulbOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();

  return (
    <Tooltip title={mode === 'light' ? 'Mörkare tema' : 'Ljusare tema'} arrow>
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          width: { xs: 56, md: 64 },
          height: { xs: 56, md: 64 },
          backgroundColor: theme.palette.background.paper,
          border: `2px solid ${theme.palette.divider}`,
          boxShadow: mode === 'light' 
            ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' 
            : '0 4px 8px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#333333',
            borderColor: theme.palette.mode === 'light' ? '#cbd5e1' : '#888888',
            transform: 'scale(1.05)',
            boxShadow: mode === 'light'
              ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
              : '0 8px 16px rgba(0,0,0,0.6)',
          },
        }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: mode === 'light' ? 0 : 180 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {mode === 'light' ? (
            <LightbulbOutlined 
              sx={{ 
                fontSize: { xs: 28, md: 32 }, 
                color: theme.palette.text.primary,
                transition: 'all 0.3s ease',
              }} 
            />
          ) : (
            <Lightbulb 
              sx={{ 
                fontSize: { xs: 28, md: 32 }, 
                color: '#fbbf24',
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))',
                transition: 'all 0.3s ease',
              }} 
            />
          )}
        </motion.div>
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;

