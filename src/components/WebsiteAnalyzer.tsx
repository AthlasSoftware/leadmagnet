import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Container,
  Stack,
  Chip,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  useTheme,
} from '@mui/material';
import {
  AccessibilityNew,
  Search,
  Palette,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  ArrowBack,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AnalysisResults } from '@/types/analysis';

interface Props {
  website: string;
  email: string;
  onAnalysisComplete: (results: AnalysisResults) => void;
  onStartOver: () => void;
}

const WebsiteAnalyzer: React.FC<Props> = ({ 
  website, 
  email, 
  onAnalysisComplete, 
  onStartOver 
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState<string>('starting');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

  const analysisSteps = [
    { key: 'starting', label: 'Startar analys...', icon: <Refresh />, duration: 1000 },
    { key: 'loading', label: 'Laddar webbsidan...', icon: <Refresh />, duration: 2000 },
    { key: 'accessibility', label: 'Analyserar tillgänglighet...', icon: <AccessibilityNew />, duration: 3000 },
    { key: 'seo', label: 'Kontrollerar SEO...', icon: <Search />, duration: 2500 },
    { key: 'design', label: 'Utvärderar design & UX...', icon: <Palette />, duration: 2000 },
    { key: 'finalizing', label: 'Slutför rapporten...', icon: <CheckCircle />, duration: 1500 },
    { key: 'complete', label: 'Analysen är klar!', icon: <CheckCircle />, duration: 0 },
  ];

  const getTotalDuration = () => {
    return analysisSteps.reduce((total, step) => total + step.duration, 0);
  };

  const getCurrentStepIndex = () => {
    return analysisSteps.findIndex(step => step.key === currentStep);
  };

  const startAnalysis = async () => {
    try {
      setError(null);
      // Validate URL before doing anything
      try {
        // basic validation; throws if invalid
        // eslint-disable-next-line no-new
        new URL(website);
      } catch {
        setError('Ogiltig webbadress. Kontrollera URL:en och försök igen.');
        toast.error('❌ Ogiltig webbadress - kontrollera formatet', {
          duration: 4000,
        });
        return;
      }
      
      // Verify domain exists and is reachable before starting animations
      try {
        const verifyRes = await fetch('/api/verify-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website }),
        });
        const contentType = verifyRes.headers.get('content-type') || '';
        if (!verifyRes.ok) {
          let message = verifyRes.statusText || 'Kunde inte verifiera domänen';
          if (contentType.includes('application/json')) {
            const err = await verifyRes.json();
            message = err?.error || message;
          } else {
            const text = await verifyRes.text();
            message = text || message;
          }
          throw new Error(message);
        }
        const vr = await verifyRes.json();
        if (!vr?.dnsResolved) {
          setError('Domänen kunde inte hittas. Kontrollera stavningen och försök igen.');
          toast.error('🌐 Domänen hittades inte - kontrollera stavningen', {
            duration: 5000,
          });
          return;
        }
        if (vr?.httpReachable === false) {
          setError('Domänen hittades men webbplatsen kunde inte nås just nu. Försök igen senare.');
          toast.error('⚠️ Webbplatsen är inte nåbar för tillfället', {
            duration: 5000,
          });
          return;
        }
      } catch (e: any) {
        const msg = String(e?.message || 'Kunde inte verifiera domänen');
        setError(msg);
        toast.error(`❌ ${msg}`, {
          duration: 5000,
        });
        return;
      }
      
      // Simulate step progression
      let totalElapsed = 0;
      const totalDuration = getTotalDuration();
      
      for (let i = 0; i < analysisSteps.length - 1; i++) {
        const step = analysisSteps[i];
        setCurrentStep(step.key);
        
        // Update progress during this step
        const stepStartProgress = (totalElapsed / totalDuration) * 100;
        const stepEndProgress = ((totalElapsed + step.duration) / totalDuration) * 100;
        
        await new Promise<void>((resolve) => {
          const startTime = Date.now();
          const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const stepProgress = Math.min(elapsed / step.duration, 1);
            const currentProgress = stepStartProgress + (stepEndProgress - stepStartProgress) * stepProgress;
            setProgress(currentProgress);
            
            if (elapsed < step.duration) {
              requestAnimationFrame(updateProgress);
            } else {
              resolve();
            }
          };
          updateProgress();
        });
        
        totalElapsed += step.duration;
      }

      // Call the analysis API and surface errors (no mock fallback)
      const response = await fetch(`/api/analyze-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({ website, sessionId }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let message = response.statusText || 'Kunde inte analysera webbplatsen';
        if (contentType.includes('application/json')) {
          const err = await response.json();
          message = err?.error || message;
        } else {
          const text = await response.text();
          message = text || message;
        }
        throw new Error(`${response.status} ${message}`);
      }

      const payload = await response.json();
      const results: AnalysisResults = payload.results;
      
      setCurrentStep('complete');
      setProgress(100);
      
      setTimeout(() => {
        onAnalysisComplete(results);
        toast.success('🎉 Analys klar! Rapporten skickas till din e-post.', {
          duration: 6000,
        });
      }, 1000);

    } catch (error: any) {
      console.error('Analysis error:', error);
      const msg = String(error?.message || error || 'Något gick fel under analysen');
      if (msg.includes('429')) {
        setError('För många förfrågningar. Vänta ett par minuter och försök igen.');
        toast.error('⏱️ För många analyser - vänta några minuter', {
          duration: 6000,
        });
      } else {
        setError(msg);
        toast.error('❌ Analysen misslyckades - försök igen', {
          duration: 5000,
        });
      }
    }
  };

  const retryAnalysis = () => {
    setCurrentStep('starting');
    setProgress(0);
    setError(null);
    startAnalysis();
  };

  useEffect(() => {
    startAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStepData = analysisSteps.find(step => step.key === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ErrorIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 3 }} />
            <Typography variant="h4" sx={{ mb: 2, color: theme.palette.error.main, fontWeight: 400 }}>
              Analysen misslyckades
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary }}>
              {error}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={retryAnalysis}
              >
                Försök igen
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={onStartOver}
              >
                Tillbaka
              </Button>
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{ p: { xs: 3, md: 6 } }}>
          <Typography
            variant="h4"
            component="h2"
            align="center"
            sx={{ mb: 2, fontWeight: 300, color: theme.palette.text.primary }}
          >
            PULSE analyserar din webbplats
          </Typography>
          
          <Typography
            variant="h6"
            align="center"
            sx={{ mb: 6, color: theme.palette.text.secondary, fontWeight: 400 }}
          >
            {website}
          </Typography>

          {/* Progress bar */}
          <Box sx={{ mb: 6 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 2,
                borderRadius: 0,
                backgroundColor: theme.palette.divider,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 0,
                },
              }}
            />
            <Typography
              variant="body2"
              align="center"
              sx={{ mt: 2, color: theme.palette.text.secondary, fontSize: '0.85rem' }}
            >
              {Math.round(progress)}% slutfört
            </Typography>
          </Box>

          {/* Current step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                sx={{
                  mb: 6,
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    {currentStepData?.icon && React.cloneElement(currentStepData.icon, {
                      sx: { fontSize: 32, color: theme.palette.primary.main }
                    })}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 400, color: theme.palette.text.primary }}>
                    {currentStepData?.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Step indicators */}
          <Grid container spacing={1} sx={{ mb: 4 }}>
            {analysisSteps.slice(0, -1).map((step, index) => (
              <Grid item xs key={step.key}>
                <Chip
                  icon={React.cloneElement(step.icon, { sx: { fontSize: '16px !important' } })}
                  label={step.label.replace('...', '')}
                  size="small"
                  variant={index <= currentStepIndex ? 'filled' : 'outlined'}
                  color={index < currentStepIndex ? 'success' : index === currentStepIndex ? 'primary' : 'default'}
                  sx={{
                    width: '100%',
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    '& .MuiChip-label': {
                      px: { xs: 0.5, sm: 1 },
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>

          {/* Info section */}
          <Alert 
            severity="info"
          >
            <Typography variant="body2">
              <strong>Vad händer nu?</strong> Vi går igenom din webbplats med automatiserade verktyg 
              som kontrollerar över 100 olika faktorer inom tillgänglighet, SEO och design. 
              Analysen tar normalt 2-5 minuter att genomföra.
            </Typography>
          </Alert>

          {/* Back button */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={onStartOver}
              disabled={currentStep === 'complete'}
              sx={{
                minHeight: '48px',
                px: 3,
                fontWeight: 400,
              }}
            >
              Avbryt och börja om
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default WebsiteAnalyzer;
