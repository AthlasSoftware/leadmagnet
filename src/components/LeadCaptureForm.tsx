import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Alert,
  InputAdornment,
  Grid,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Person,
  Email,
  Language,
  Analytics,
  Security,
  Speed,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getFirebaseDb } from '@/firebaseClient';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface FormData {
  name: string;
  email: string;
  website: string;
}

interface Props {
  onLeadCaptured: (data: FormData) => void;
}

const LeadCaptureForm: React.FC<Props> = ({ onLeadCaptured }) => {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      website: '',
    },
  });

  const watchedWebsite = watch('website');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Normalize website URL
      let normalizedWebsite = data.website.trim();
      if (!normalizedWebsite.startsWith('http://') && !normalizedWebsite.startsWith('https://')) {
        normalizedWebsite = 'https://' + normalizedWebsite;
      }

      // Validate URL format
      try {
        new URL(normalizedWebsite);
      } catch {
        toast.error('❌ Ogiltig webbadress - använd format: exempel.se', {
          duration: 4000,
        });
        setIsSubmitting(false);
        return;
      }

      // Try API first
      try {
        const response = await fetch(`/api/capture-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            email: data.email.trim(),
            website: normalizedWebsite,
          }),
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          let message = response.statusText || 'Något gick fel';
          if (contentType.includes('application/json')) {
            const err = await response.json();
            message = err?.error || message;
          } else {
            const text = await response.text();
            message = text || message;
          }
          throw new Error(message);
        }
      } catch (apiErr) {
        // Fallback: write directly to Firestore (unauthenticated create allowed by rules)
        try {
          const db = getFirebaseDb();
          await addDoc(collection(db, 'leads'), {
            name: data.name.trim(),
            email: data.email.trim(),
            website: normalizedWebsite,
            timestamp: serverTimestamp(),
          });
        } catch (clientErr) {
          throw clientErr;
        }
      }

      toast.success('✅ Tack! Analysen startar nu...', {
        duration: 4000,
      });
      onLeadCaptured({
        ...data,
        website: normalizedWebsite,
      });
    } catch (error: any) {
      console.error('Error capturing lead:', error);
      toast.error(`❌ ${error.message || 'Något gick fel - försök igen'}`, {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Analytics sx={{ color: 'primary.main' }} />,
      text: 'Detaljerad analys inom 3 områden'
    },
    {
      icon: <Speed sx={{ color: 'primary.main' }} />,
      text: 'Resultat på mindre än 5 minuter'
    },
    {
      icon: <Security sx={{ color: 'primary.main' }} />,
      text: 'Säker och GDPR-anpassad'
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h3"
          component="h2"
          align="center"
          sx={{ mb: 2, fontWeight: 300, color: theme.palette.text.primary }}
        >
          Kom igång med PULSE
        </Typography>
        <Typography
          variant="h6"
          component="h3"
          align="center"
          sx={{ mb: 6, color: theme.palette.text.secondary, fontWeight: 400, lineHeight: 1.5 }}
        >
          Fyll i dina uppgifter så analyserar vi din webbplats inom tillgänglighet, SEO och design
        </Typography>

        <Grid container spacing={6} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 4,
              }}
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                  <Controller
                    name="name"
                    control={control}
                    rules={{
                      required: 'Namn är obligatoriskt',
                      minLength: { value: 2, message: 'Namnet måste vara minst 2 tecken' },
                      maxLength: { value: 100, message: 'Namnet får inte vara längre än 100 tecken' },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Ditt namn"
                        variant="outlined"
                        fullWidth
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            minHeight: '56px',
                          },
                        }}
                      />
                    )}
                  />

                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: 'E-postadress är obligatoriskt',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Ange en giltig e-postadress',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="E-postadress"
                        type="email"
                        variant="outlined"
                        fullWidth
                        error={!!errors.email}
                        helperText={errors.email?.message || 'Vi skickar rapporten hit'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            minHeight: '56px',
                          },
                        }}
                      />
                    )}
                  />

                  <Controller
                    name="website"
                    control={control}
                    rules={{
                      required: 'Webbadress är obligatoriskt',
                      minLength: { value: 4, message: 'Ange en giltig webbadress' },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Din webbplats"
                        variant="outlined"
                        fullWidth
                        placeholder="exempel.se eller https://www.exempel.se"
                        error={!!errors.website}
                        helperText={errors.website?.message || 'Vi lägger till https:// automatiskt'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Language sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            minHeight: '56px',
                          },
                        }}
                      />
                    )}
                  />

                  <LoadingButton
                    type="submit"
                    variant="contained"
                    size="large"
                    loading={isSubmitting}
                    disabled={!watchedWebsite?.trim()}
                    sx={{
                      py: 2,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      minHeight: '56px',
                    }}
                  >
                    {isSubmitting ? 'Startar analys...' : 'Analysera min webbplats gratis'}
                  </LoadingButton>

                  <Alert 
                    severity="info"
                  >
                    <Typography variant="body2">
                      <strong>GDPR-säkert:</strong> Vi använder endast dina uppgifter för att skicka rapporten. 
                      Inga uppgifter delas med tredje part.
                    </Typography>
                  </Alert>
                </Stack>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ pl: { md: 4 } }}>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 400, color: theme.palette.text.primary }}>
                Vad får du?
              </Typography>
              
              <Stack spacing={3}>
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 2,
                    }}>
                      <Box sx={{ 
                        width: 4, 
                        height: 4, 
                        backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.divider, 
                        borderRadius: '50%', 
                        flexShrink: 0 
                      }} />
                      <Typography variant="body1" sx={{ fontWeight: 400, color: theme.palette.text.secondary }}>
                        {feature.text}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Stack>

              <Box sx={{ height: '1px', backgroundColor: theme.palette.divider, my: 4 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 400, color: theme.palette.text.primary }}>
                Analysområden
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 400, color: theme.palette.text.primary, mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2, width: 4, height: 4, backgroundColor: theme.palette.success.main, borderRadius: '50%' }} />
                    Tillgänglighet
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, ml: 3 }}>
                    WCAG-compliance, skärmläsarstöd, tangentbordsnavigation
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 400, color: theme.palette.text.primary, mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2, width: 4, height: 4, backgroundColor: theme.palette.warning.main, borderRadius: '50%' }} />
                    SEO
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, ml: 3 }}>
                    Teknisk SEO, meta-taggar, laddningstider, mobilanpassning
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 400, color: theme.palette.text.primary, mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2, width: 4, height: 4, backgroundColor: theme.palette.primary.main, borderRadius: '50%' }} />
                    Design & UX
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, ml: 3 }}>
                    Responsiv design, navigation, typografi, användarupplevelse
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default LeadCaptureForm;
