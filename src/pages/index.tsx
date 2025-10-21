import React, { useState } from 'react';
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
import { AnalysisResults as AnalysisResultsType } from '@/types/analysis';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentStep, setCurrentStep] = useState<'capture' | 'analyze' | 'results'>('capture');
  const [leadData, setLeadData] = useState<{ name: string; email: string; website: string } | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultsType | null>(null);

  const handleLeadCaptured = (data: { name: string; email: string; website: string }) => {
    setLeadData(data);
    setCurrentStep('analyze');
  };

  const handleAnalysisComplete = (results: AnalysisResultsType) => {
    setAnalysisResults(results);
    setCurrentStep('results');
  };

  const handleStartOver = () => {
    setCurrentStep('capture');
    setLeadData(null);
    setAnalysisResults(null);
  };

  const features = [
    {
      icon: <AccessibilityNew sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Tillgänglighet',
      description: 'WCAG-compliance, skärmläsarstöd och universal design',
      items: ['Alt-texter för bilder', 'Tangentbordsnavigation', 'Färgkontraster', 'Skärmläsarvänlighet']
    },
    {
      icon: <Search sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'SEO-optimering',
      description: 'Teknisk SEO, on-page optimering och prestanda',
      items: ['Laddningstider', 'Meta-taggar', 'Rubrikstruktur', 'Mobilanpassning']
    },
    {
      icon: <Palette sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Design & UX',
      description: 'Användarupplevelse, navigation och visuell design',
      items: ['Responsiv design', 'Navigation', 'Typografi', 'Användarflöden']
    }
  ];

  const benefits = [
    'Professionell rapport på svenska',
    'Konkreta förbättringsförslag',
    'Prioriterade åtgärder',
    'PDF-rapport via email',
    'Kostnadsfri analys',
    'Direkt resultat'
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <ThemeToggle />
      
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
                fontWeight: 200,
                fontSize: { xs: '3rem', md: '4rem' },
                mb: 2,
                letterSpacing: '-0.02em'
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
              by{' '}
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
                Athlas.io
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
              Professionell webbanalys inom tillgänglighet, SEO och design
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
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Paper
            sx={{
              overflow: 'hidden',
            }}
          >
            {currentStep === 'capture' && (
              <LeadCaptureForm onLeadCaptured={handleLeadCaptured} />
            )}
            
            {currentStep === 'analyze' && leadData && (
              <WebsiteAnalyzer
                website={leadData.website}
                email={leadData.email}
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
                fontWeight: 300,
                fontSize: { xs: '1.8rem', md: '2.2rem' }
              }}
            >
              Vad analyserar vi?
            </Typography>
            
            <Grid container spacing={6}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: theme.palette.mode === 'light' ? theme.palette.primary.light : '#666666',
                          transform: 'translateY(-4px)',
                          boxShadow: theme.palette.mode === 'light' 
                            ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                            : 'none',
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
                          {feature.items.map((item, itemIndex) => (
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
        sx={{
          backgroundColor: theme.palette.mode === 'light' ? '#f1f5f9' : '#0a0a0a',
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 6,
          mt: 'auto'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 400 }}>
                PULSE by{' '}
                <Box
                  component="a"
                  href="https://athlas.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Athlas.io
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                Nordisk tech- och kreativ byrå som kombinerar spetskompetens inom utveckling, design, AI och digital marknadsföring.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                Behöver du hjälp med implementeringen?
              </Typography>
              <Button
                variant="outlined"
                href="mailto:hello@athlas.io"
              >
                Kontakta oss
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
              © {new Date().getFullYear()} PULSE by{' '}
              <Box
                component="a"
                href="https://athlas.io"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  }
                }}
              >
                Athlas.io
              </Box>
              . Vi levererar snabbt, personligt och med hög kvalitet.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
