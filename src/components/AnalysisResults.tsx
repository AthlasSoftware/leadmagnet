import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  ExpandMore,
  Download,
  AccessibilityNew,
  Search,
  Palette,
  TrendingUp,
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  Refresh,
  Share,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AnalysisResults as AnalysisResultsType } from '@/types/analysis';

interface Props {
  results: AnalysisResultsType;
  website: string;
  email: string;
  onStartOver: () => void;
}

const AnalysisResults: React.FC<Props> = ({ results, website, email, onStartOver }) => {
  const theme = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    if (score >= 40) return 'orange';
    return 'error.main';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Utmärkt';
    if (score >= 60) return 'Bra';
    if (score >= 40) return 'Okej';
    return 'Behöver förbättring';
  };

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      case 'info':
        return <Info sx={{ color: 'info.main' }} />;
    }
  };

  const getIssueColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'error.light';
      case 'warning':
        return 'warning.light';
      case 'info':
        return 'info.light';
    }
  };

  const downloadReport = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website, results, email: null }),
      });

      if (!response.ok) {
        throw 'Kunde inte generera rapporten';
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `athlas-webbanalys-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('✅ PDF-rapport nedladdad!', {
        duration: 4000,
      });
    } catch (error: any) {
      // Fallback to client-side PDF
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('PULSE Analysrapport', 14, 20);
        doc.setFontSize(12);
        doc.text(`Webbplats: ${website}`, 14, 30);
        doc.text(`Overgripande poang: ${results.overview.overallScore}/100`, 14, 38);
        doc.text('Sammanfattning:', 14, 48);
        doc.text(doc.splitTextToSize(results.overview.summary, 180), 14, 56);
        doc.save(`pulse-analys-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('✅ Enkel rapport nedladdad', {
          duration: 4000,
        });
      } catch (fallbackErr) {
        console.error('Download error:', error);
        toast.error('❌ Kunde inte generera rapporten. Försök igen om ett ögonblick.', {
          duration: 5000,
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Email-sändning borttagen enligt önskemål – endast nedladdning stöds

  const categoryData = [
    {
      key: 'accessibility',
      title: 'Tillgänglighet',
      icon: <AccessibilityNew />,
      score: results.accessibility.score,
      data: results.accessibility,
      description: 'WCAG-compliance och användarnas behov'
    },
    {
      key: 'seo',
      title: 'SEO',
      icon: <Search />,
      score: results.seo.score,
      data: results.seo,
      description: 'Sökmotoroptimering och teknisk prestanda'
    },
    {
      key: 'design',
      title: 'Design & UX',
      icon: <Palette />,
      score: results.design.score,
      data: results.design,
      description: 'Användarupplevelse och visuell design'
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Paper sx={{ p: 6, mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 300, color: theme.palette.text.primary }}>
            PULSE Analysrapport
          </Typography>
          <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.secondary, fontWeight: 400 }}>
            Professionell webbanalys från{' '}
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
          <Typography variant="h6" sx={{ mb: 4, color: theme.palette.text.primary }}>
            {website}
          </Typography>
          
          {/* Overall Score */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={120}
                thickness={2}
                sx={{ color: theme.palette.divider }}
              />
              <CircularProgress
                variant="determinate"
                value={results.overview.overallScore}
                size={120}
                thickness={2}
                sx={{
                  color: theme.palette.primary.main,
                  position: 'absolute',
                  left: 0,
                }}
              />
              <Box sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  {results.overview.overallScore}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, color: theme.palette.text.secondary }}>
                  av 100
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="h6" sx={{ mb: 4, color: theme.palette.text.primary }}>
            {getScoreText(results.overview.overallScore)}
          </Typography>
          
          <Typography variant="body1" sx={{ maxWidth: '600px', mx: 'auto', color: theme.palette.text.secondary, lineHeight: 1.6 }}>
            {results.overview.summary}
          </Typography>
          
          {/* Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }} justifyContent="center">
            <LoadingButton
              variant="contained"
              startIcon={<Download />}
              loading={isDownloading}
              onClick={downloadReport}
              sx={{
                minHeight: '48px',
                px: 3,
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              Ladda ner PDF
            </LoadingButton>
          </Stack>
        </Paper>

        {/* Quick Insights */}
        {(results.overview.priorityIssues.length > 0 || results.overview.quickWins.length > 0) && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {results.overview.priorityIssues.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'error.main', display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 1 }} />
                      Prioriterade förbättringar
                    </Typography>
                    <Stack spacing={1}>
                      {results.overview.priorityIssues.slice(0, 5).map((issue, index) => (
                        <Chip
                          key={index}
                          label={issue}
                          variant="outlined"
                          color="error"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {results.overview.quickWins.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'success.main', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ mr: 1 }} />
                      Snabba förbättringar
                    </Typography>
                    <Stack spacing={1}>
                      {results.overview.quickWins.slice(0, 5).map((win, index) => (
                        <Chip
                          key={index}
                          label={win}
                          variant="outlined"
                          color="success"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* Category Scores */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {categoryData.map((category, index) => (
            <Grid item xs={12} md={4} key={category.key}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {React.cloneElement(category.icon, {
                        sx: { fontSize: 48, color: getScoreColor(category.score) }
                      })}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      {category.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                      {category.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: getScoreColor(category.score) }}>
                        {category.score}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        av 100
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={category.score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(category.score),
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 1, color: getScoreColor(category.score), fontWeight: 600 }}>
                      {getScoreText(category.score)}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Detailed Results */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
            Detaljerade resultat
          </Typography>

          {/* Accessibility Details */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <AccessibilityNew sx={{ mr: 2, color: getScoreColor(results.accessibility.score) }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Tillgänglighet ({results.accessibility.score}/100)
                </Typography>
                <Chip
                  label={getScoreText(results.accessibility.score)}
                  color={results.accessibility.score >= 80 ? 'success' : results.accessibility.score >= 60 ? 'warning' : 'error'}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {results.accessibility.strengths.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, color: 'success.main', fontWeight: 600 }}>
                    ✓ Styrkor
                  </Typography>
                  <Grid container spacing={1}>
                    {results.accessibility.strengths.map((strength, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Chip label={strength} color="success" variant="outlined" size="small" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {results.accessibility.issues.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Förbättringsområden
                  </Typography>
                  <Stack spacing={2}>
                    {results.accessibility.issues.map((issue, index) => (
                      <Alert
                        key={index}
                        severity={issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info'}
                        sx={{ textAlign: 'left' }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {issue.message}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Rekommendation:</strong> {issue.recommendation}
                        </Typography>
                        {issue.element && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Element:</strong> {issue.element}
                          </Typography>
                        )}
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* SEO Details */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Search sx={{ mr: 2, color: getScoreColor(results.seo.score) }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  SEO ({results.seo.score}/100)
                </Typography>
                <Chip
                  label={getScoreText(results.seo.score)}
                  color={results.seo.score >= 80 ? 'success' : results.seo.score >= 60 ? 'warning' : 'error'}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Teknisk SEO
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Laddningstid:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.technical.loadSpeed.toFixed(1)}s
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Mobiloptimerad:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.technical.mobileOptimized ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">HTTPS:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.technical.httpsEnabled ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Robots.txt:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.technical.hasRobotsTxt ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Sitemap:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.technical.hasSitemap ? '✅' : '❌'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    On-page SEO
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Unik titel:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.onPage.hasUniqueTitle ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Meta description:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.onPage.hasMetaDescription ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">H1-rubrik:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.onPage.hasH1 ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Bilder med alt-text:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.seo.onPage.imagesWithAlt}/{results.seo.onPage.totalImages}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              {results.seo.issues.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Förbättringsområden
                  </Typography>
                  <Stack spacing={2}>
                    {results.seo.issues.map((issue, index) => (
                      <Alert
                        key={index}
                        severity={issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info'}
                        sx={{ textAlign: 'left' }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {issue.message}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Rekommendation:</strong> {issue.recommendation}
                        </Typography>
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Design Details */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Palette sx={{ mr: 2, color: getScoreColor(results.design.score) }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Design & UX ({results.design.score}/100)
                </Typography>
                <Chip
                  label={getScoreText(results.design.score)}
                  color={results.design.score >= 80 ? 'success' : results.design.score >= 60 ? 'warning' : 'error'}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Tekniska mått
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Responsiv design:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.design.responsive ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Laddningstid:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.design.loadTime.toFixed(1)}s
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Färgkontrast:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.design.colorContrast.sufficient ? '✅' : '❌'} ({results.design.colorContrast.ratio}:1)
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Användarupplevelse
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Läsbar typografi:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.design.typography.readable ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Tydlig hierarki:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.design.typography.hierarchy ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Klar navigation:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.design.navigation.clear ? '✅' : '❌'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Tillgänglig navigation:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {results.design.navigation.accessible ? '✅' : '❌'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              {results.design.issues.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Förbättringsområden
                  </Typography>
                  <Stack spacing={2}>
                    {results.design.issues.map((issue, index) => (
                      <Alert
                        key={index}
                        severity={issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info'}
                        sx={{ textAlign: 'left' }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {issue.message}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Rekommendation:</strong> {issue.recommendation}
                        </Typography>
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Call to Action */}
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center', 
          backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#0a0a0a',
        }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 400, color: theme.palette.text.primary }}>
            Vill du öka er konvertering och förbättra resultatet snabbt?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary, lineHeight: 1.6 }}>
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
            {' '}hjälper dig att genomföra förbättringarna effektivt. 
            Vi kombinerar utveckling, design, AI och digital marknadsföring – för mätbara resultat.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              href="mailto:hello@athlas.io?subject=Boka%20genomg%C3%A5ng%20av%20min%20webbanalys"
              sx={{
                minHeight: '48px',
                px: 3,
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              Boka kostnadsfri genomgång
            </Button>
            <Button
              variant="contained"
              size="large"
              href="mailto:hello@athlas.io"
              sx={{
                minHeight: '48px',
                px: 3,
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              Kontakta oss för hjälp
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="https://athlas.io"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                minHeight: '48px',
                px: 3,
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              Läs mer på Athlas.io
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Refresh />}
              onClick={onStartOver}
              sx={{
                minHeight: '48px',
                px: 3,
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              Analysera ny webbplats
            </Button>
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default AnalysisResults;
