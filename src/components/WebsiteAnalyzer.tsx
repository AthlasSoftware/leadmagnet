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
import { useI18n } from '@/contexts/I18nContext';

interface Props {
  website: string;
  email: string;
  leadId?: string;
  onAnalysisComplete: (results: AnalysisResults) => void;
  onStartOver: () => void;
}

const WebsiteAnalyzer: React.FC<Props> = ({ 
  website, 
  email, 
  leadId,
  onAnalysisComplete, 
  onStartOver 
}) => {
  const theme = useTheme();
  const { t, lang } = useI18n() as any;
  const [currentStep, setCurrentStep] = useState<string>('starting');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

  const analysisSteps = [
    { key: 'starting', label: t('analyzer.steps.starting'), icon: <Refresh />, duration: 1000 },
    { key: 'loading', label: t('analyzer.steps.loading'), icon: <Refresh />, duration: 2000 },
    { key: 'accessibility', label: t('analyzer.steps.accessibility'), icon: <AccessibilityNew />, duration: 3000 },
    { key: 'seo', label: t('analyzer.steps.seo'), icon: <Search />, duration: 2500 },
    { key: 'design', label: t('analyzer.steps.design'), icon: <Palette />, duration: 2000 },
    { key: 'finalizing', label: t('analyzer.steps.finalizing'), icon: <CheckCircle />, duration: 1500 },
    { key: 'complete', label: t('analyzer.steps.complete'), icon: <CheckCircle />, duration: 0 },
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
        setError(t('analyzer.errors.invalidUrl'));
        toast.error(t('analyzer.toast.invalidUrl'), {
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
          let message = verifyRes.statusText || t('analyzer.errors.verifyFailed');
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
          setError(t('analyzer.errors.domainNotFound'));
          toast.error(t('analyzer.toast.domainNotFound'), {
            duration: 5000,
          });
          return;
        }
        if (vr?.httpReachable === false) {
          setError(t('analyzer.errors.siteUnreachable'));
          toast.error(t('analyzer.toast.siteUnreachable'), {
            duration: 5000,
          });
          return;
        }
      } catch (e: any) {
        const msg = String(e?.message || t('analyzer.errors.verifyFailed'));
        setError(msg);
        toast.error(msg, {
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
        body: JSON.stringify({ website, sessionId, lang, leadId }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let message = response.statusText || t('analyzer.errors.analyzeFailed');
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
        try {
          const url = new URL(website);
          const isAthlas = url.hostname.replace(/^www\./, '') === 'athlas.io';
          if (isAthlas) {
            toast.success(t('analyzer.toast.athlasPerfect'), {
              duration: 7000,
            });
          } else {
            toast.success(t('analyzer.toast.analysisDone'), {
              duration: 6000,
            });
          }
        } catch {
          toast.success(t('analyzer.toast.analysisDone'), {
            duration: 6000,
          });
        }
      }, 1000);

    } catch (error: any) {
      console.error('Analysis error:', error);
      const msg = String(error?.message || error || t('analyzer.errors.generic'));
      if (msg.includes('429')) {
        setError(t('analyzer.errors.rateLimited'));
        toast.error(t('analyzer.toast.tooManyRequests'), {
          duration: 6000,
        });
      } else {
        setError(msg);
        toast.error(t('analyzer.toast.analysisFailed'), {
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
              {t('analyzer.errorTitle')}
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
                {t('common.tryAgain')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={onStartOver}
              >
                {t('common.back')}
              </Button>
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.palette.background.default,
      py: 4
    }}>
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center' }}>
            {/* Current step animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                <Box sx={{ mb: 4 }}>
                  {currentStepData?.icon && React.cloneElement(currentStepData.icon, {
                    sx: { 
                      fontSize: 64, 
                      color: theme.palette.primary.main,
                      filter: theme.palette.mode === 'light' ? 'none' : 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.3))'
                    }
                  })}
                </Box>
              </motion.div>
            </AnimatePresence>

            {/* Website */}
            <Typography
              variant="body2"
              sx={{ 
                mb: 1, 
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 500
              }}
            >
              {t('analyzer.title')}
            </Typography>
            
            <Typography
              variant="h5"
              sx={{ mb: 4, color: theme.palette.text.primary, fontWeight: 300 }}
            >
              {website}
            </Typography>

            {/* Minimal progress */}
            <Box sx={{ mb: 2, px: 4 }}>
              <Box sx={{ 
                height: 1, 
                backgroundColor: theme.palette.divider,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    backgroundColor: theme.palette.primary.main,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{ 
                  mt: 1.5, 
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  display: 'block'
                }}
              >
                {Math.round(progress)}{t('analyzer.progressSuffix')}
              </Typography>
            </Box>

            {/* Current step label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 6,
                    color: theme.palette.text.primary,
                    fontWeight: 400,
                    minHeight: 28
                  }}
                >
                  {currentStepData?.label}
                </Typography>
              </motion.div>
            </AnimatePresence>

            {/* Minimal step dots */}
            <Stack 
              direction="row" 
              spacing={1.5} 
              justifyContent="center"
              sx={{ mb: 6 }}
            >
              {analysisSteps.slice(0, -1).map((step, index) => (
                <Box
                  key={step.key}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: index <= currentStepIndex 
                      ? theme.palette.primary.main 
                      : theme.palette.divider,
                    transition: 'all 0.3s ease',
                    transform: index === currentStepIndex ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </Stack>

            {/* Cancel button - minimal */}
            <Button
              variant="text"
              startIcon={<ArrowBack sx={{ fontSize: '16px !important' }} />}
              onClick={onStartOver}
              disabled={currentStep === 'complete'}
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.8rem',
                fontWeight: 400,
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: theme.palette.text.primary,
                },
              }}
            >
              {t('analyzer.cancelAndStartOver')}
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default WebsiteAnalyzer;
