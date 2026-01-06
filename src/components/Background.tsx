import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme, Box } from '@mui/material';

const Background: React.FC = () => {
    const theme = useTheme();
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const rotate = useTransform(scrollY, [0, 1000], [0, 180]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = theme.palette.mode === 'dark';
    const primaryColor = theme.palette.primary.main;

    // Subtle orb colors
    const color1 = isDark ? 'radial-gradient(circle, rgba(33, 150, 243, 0.15) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, rgba(255,255,255,0) 70%)';
    const color2 = isDark ? 'radial-gradient(circle, rgba(156, 39, 176, 0.15) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(156, 39, 176, 0.1) 0%, rgba(255,255,255,0) 70%)';

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: -1,
                pointerEvents: 'none',
                background: theme.palette.background.default
            }}
        >
            {/* Grid Pattern Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundImage: isDark 
                        ? `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)`
                        : `radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    opacity: 0.3,
                }}
            />

            {/* Orb 1 */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: '60vw',
                    height: '60vw',
                    background: color1,
                    y: y1,
                    rotate: rotate,
                    opacity: 0.6,
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Orb 2 */}
            <motion.div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '-10%',
                    width: '50vw',
                    height: '50vw',
                    background: color2,
                    y: y2,
                    opacity: 0.6,
                }}
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [0, -30, 0]
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </Box>
    );
};

export default Background;
