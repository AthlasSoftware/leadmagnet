import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp,
  AccessibilityNew,
  Search,
  Palette,
  Speed,
  Security,
  Analytics,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import WebsiteAnalyzer from '@/components/WebsiteAnalyzer';
import AnalysisResults from '@/components/AnalysisResults';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { useI18n } from '@/contexts/I18nContext';
import { AnalysisResults as AnalysisResultsType } from '@/types/analysis';
import { getFirebaseDb } from '@/firebaseClient';
import { doc, updateDoc } from 'firebase/firestore'; 
import Background from '@/components/Background';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const { t, get } = useI18n();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentStep, setCurrentStep] = useState<'capture' | 'analyze' | 'results'>('capture');
  const [leadData, setLeadData] = useState<{ name: string; email: string; website: string; leadId?: string } | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultsType | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (currentStep === 'capture') {
      // Scroll to top when resetting
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 'analyze') {
      // Scroll to content when starting analysis
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (currentStep === 'results') {
       // Also center results
       setTimeout(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    }
  }, [currentStep]);

  const handleLeadCaptured = (data: { name: string; email: string; website: string; leadId?: string }) => {
    setLeadData(data);
    setCurrentStep('analyze');
  };

  const handleAnalysisComplete = (results: AnalysisResultsType) => {
    setAnalysisResults(results);
    setCurrentStep('results');

    // Update lead with score
    if (leadData?.leadId) {
      try {
        const db = getFirebaseDb();
        const leadRef = doc(db, 'leads', leadData.leadId);
        updateDoc(leadRef, {
          score: results.overview.overallScore,
          seoScore: results.seo.score,
          accessibilityScore: results.accessibility.score,
          designScore: results.design.score
        }).catch(console.error);
      } catch (e) {
        console.error('Error updating lead score:', e);
      }
    }
  };

  const handleStartOver = () => {
    setCurrentStep('capture');
    setLeadData(null);
    setAnalysisResults(null);
  };

  const featuresData = (get('home.features') as any[]) || [];
  const features = [
    {
      icon: <AccessibilityNew sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: featuresData[0]?.title,
      description: featuresData[0]?.description,
      items: featuresData[0]?.items || [],
    },
    {
      icon: <Search sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: featuresData[1]?.title,
      description: featuresData[1]?.description,
      items: featuresData[1]?.items || [],
    },
    {
      icon: <Palette sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: featuresData[2]?.title,
      description: featuresData[2]?.description,
      items: featuresData[2]?.items || [],
    },
  ];

  const benefits = (get('home.benefits') as any[]) || [];

  return (
    <Box ref={topRef} sx={{ minHeight: '100vh', backgroundColor: 'transparent', position: 'relative' }}>
      <Background />
      <ThemeToggle />
      <LanguageToggle />
      
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ pt: { xs: 6, md: 12 }, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 800,
                fontSize: { xs: '3.5rem', md: '5rem' },
                mb: 2,
                letterSpacing: '-0.03em',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #71717a 100%)' 
                  : 'linear-gradient(135deg, #000000 0%, #52525b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PULSE
            </Typography>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 300,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                mb: 1,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}
            >
              {t('common.by')}{' '}
              <Box
                component="a"
                href="https://athlas.io"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  }
                }}
              >
                {t('common.brand')}
              </Box>
            </Typography>
            <Typography
              variant="h3"
              component="p"
              sx={{
                color: theme.palette.text.primary,
                mb: 6,
                maxWidth: '500px',
                mx: 'auto',
                fontWeight: 400,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                lineHeight: 1.4
              }}
            >
              {t('home.heroTagline')}
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 8 }}
            >
              {benefits.slice(0, 3).map((benefit, index) => (
                <Box
                  key={index}
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ 
                    width: 4, 
                    height: 4, 
                    backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.divider, 
                    borderRadius: '50%' 
                  }} />
                  {benefit}
                </Box>
              ))}
            </Stack>
          </motion.div>
        </Box>
      </Container>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ pb: 8 }} ref={contentRef}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              borderRadius: 4,
              border: '1px solid',
              borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
              background: theme.palette.mode === 'light' 
                ? 'rgba(255, 255, 255, 0.8)' 
                : 'rgba(24, 24, 27, 0.6)',
              backdropFilter: 'blur(20px)',
              boxShadow: theme.palette.mode === 'light' 
                ? '0 20px 40px -4px rgba(0,0,0,0.1)' 
                : '0 20px 40px -4px rgba(0,0,0,0.5)',
            }}
          >
            {currentStep === 'capture' && (
              <LeadCaptureForm onLeadCaptured={handleLeadCaptured} />
            )}
            
            {currentStep === 'analyze' && leadData && (
              <WebsiteAnalyzer
                website={leadData.website}
                email={leadData.email}
                leadId={leadData.leadId}
                onAnalysisComplete={handleAnalysisComplete}
                onStartOver={handleStartOver}
              />
            )}
            
            {currentStep === 'results' && analysisResults && leadData && (
              <AnalysisResults
                results={analysisResults}
                website={leadData.website}
                email={leadData.email}
                onStartOver={handleStartOver}
              />
            )}
          </Paper>
        </motion.div>
      </Container>

      {/* Features Section - Only show on initial step */}
      {currentStep === 'capture' && (
        <Container maxWidth="lg" sx={{ py: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{
                textAlign: 'center',
                color: theme.palette.text.primary,
                mb: 8,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.8rem', md: '2.5rem' }
              }}
            >
              {t('home.featuresTitle')}
            </Typography>
            
          <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    style={{ height: '100%' }}
                  >
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(24,24,27,0.4)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                          boxShadow: theme.palette.mode === 'light' 
                            ? '0 20px 40px -4px rgba(0,0,0,0.1)' 
                            : '0 20px 40px -4px rgba(0,0,0,0.5)',
                        }
                      }}
                    >
                      <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Box sx={{ mb: 3 }}>
                          {React.cloneElement(feature.icon, {
                            sx: { fontSize: 32, color: theme.palette.primary.main }
                          })}
                        </Box>
                        <Typography variant="h5" component="h3" sx={{ mb: 2, fontWeight: 400, color: theme.palette.text.primary }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                          {feature.description}
                        </Typography>
                        <Stack spacing={2}>
                          {feature.items.map((item: string, itemIndex: number) => (
                            <Box key={itemIndex} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
                              <Box sx={{ 
                                width: 4, 
                                height: 4, 
                                backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.divider, 
                                borderRadius: '50%', 
                                flexShrink: 0 
                              }} />
                              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                                {item}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      )}

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          background: theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.5)' 
            : 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 8,
          mt: 'auto'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600, letterSpacing: '-0.02em' }}>
                PULSE <span style={{ fontWeight: 300, color: theme.palette.text.secondary }}>{t('common.by')}</span>{' '}
                <Box
                  component="a"
                  href="https://athlas.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '0%',
                      height: '1px',
                      bottom: 0,
                      left: 0,
                      backgroundColor: theme.palette.primary.main,
                      transition: 'width 0.3s ease'
                    },
                    '&:hover::after': {
                      width: '100%'
                    }
                  }}
                >
                  {t('common.brand')}
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, maxWidth: 400 }}>
                {t('home.footer.about')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                {t('home.footer.needHelp')}
              </Typography>
              <Button
                variant="outlined"
                href="mailto:hello@athlas.io"
                sx={{
                  borderRadius: 50,
                  px: 4,
                  py: 1,
                  height: 40, // Fixed height to prevent layout shift
                  borderWidth: '1px',
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  boxSizing: 'border-box', // Ensure border/padding included in size
                  transition: 'background-color 0.2s ease, border-color 0.2s ease', // Smooth transition, no size change
                  '&:hover': {
                    borderWidth: '1px', // Explicitly keep same width
                    borderColor: theme.palette.primary.main,
                    backgroundColor: 'rgba(33, 150, 243, 0.05)'
                  }
                }}
              >
                {t('home.footer.contact')}
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 8, pt: 4, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              © {new Date().getFullYear()} PULSE • MADE WITH ♥ IN SWEDEN
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
