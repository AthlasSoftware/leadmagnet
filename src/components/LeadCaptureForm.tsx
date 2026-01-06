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
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
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
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getFirebaseDb } from '@/firebaseClient';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useI18n } from '@/contexts/I18nContext';

interface FormData {
  name: string;
  email: string;
  website: string;
  consent: boolean;
}

interface Props {
  onLeadCaptured: (data: FormData & { leadId?: string }) => void;
}

const LeadCaptureForm: React.FC<Props> = ({ onLeadCaptured }) => {
  const theme = useTheme();
  const { t } = useI18n();
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
      consent: false,
    },
  });

  const watchedName = watch('name');
  const watchedEmail = watch('email');
  const watchedWebsite = watch('website');
  const watchedConsent = watch('consent');

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
        toast.error(t('leadForm.toastInvalidUrl'), {
          duration: 4000,
        });
        setIsSubmitting(false);
        return;
      }

      let leadId: string | undefined;

      // Try API first
      try {
        const response = await fetch(`/api/capture-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            email: data.email.trim(),
            website: normalizedWebsite,
            consent: !!data.consent,
          }),
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          let message = response.statusText || 'Error';
          if (contentType.includes('application/json')) {
            const err = await response.json();
            message = err?.error || message;
          } else {
            const text = await response.text();
            message = text || message;
          }
          throw new Error(message);
        }

        const resData = await response.json();
        leadId = resData.leadId;

      } catch (apiErr) {
        // Fallback: write directly to Firestore (unauthenticated create allowed by rules)
        try {
          const db = getFirebaseDb();
          const ref = await addDoc(collection(db, 'leads'), {
            name: data.name.trim(),
            email: data.email.trim(),
            website: normalizedWebsite,
            consent: !!data.consent,
            timestamp: serverTimestamp(),
          });
          leadId = ref.id;
        } catch (clientErr) {
          throw clientErr;
        }
      }

      toast.success(t('leadForm.toastThanks'), {
        duration: 4000,
      });
      onLeadCaptured({
        ...data,
        website: normalizedWebsite,
        leadId,
      });
    } catch (error: any) {
      console.error('Error capturing lead:', error);
      toast.error(error.message || 'Error', {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Analytics sx={{ color: 'primary.main' }} />,
      text: t('leadForm.features.0')
    },
    {
      icon: <Speed sx={{ color: 'primary.main' }} />,
      text: t('leadForm.features.1')
    },
    {
      icon: <Security sx={{ color: 'primary.main' }} />,
      text: t('leadForm.features.2')
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
          {t('leadForm.heading')}
        </Typography>
        <Typography
          variant="h6"
          component="h3"
          align="center"
          sx={{ mb: 6, color: theme.palette.text.secondary, fontWeight: 400, lineHeight: 1.5 }}
        >
          {t('leadForm.subheading')}
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
                      required: t('leadForm.nameRequired'),
                      minLength: { value: 2, message: t('leadForm.nameMin') },
                      maxLength: { value: 100, message: t('leadForm.nameMax') },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('leadForm.nameLabel')}
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
                      required: t('leadForm.emailRequired'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('leadForm.emailInvalid'),
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('leadForm.emailLabel')}
                        type="email"
                        variant="outlined"
                        fullWidth
                        error={!!errors.email}
                        helperText={errors.email?.message || t('leadForm.emailHelper')}
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
                      required: t('leadForm.websiteRequired'),
                      minLength: { value: 4, message: t('leadForm.websiteMin') },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('leadForm.websiteLabel')}
                        variant="outlined"
                        fullWidth
                        placeholder={t('leadForm.websitePlaceholder')}
                        error={!!errors.website}
                        helperText={errors.website?.message || t('leadForm.websiteHelper')}
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

              <Controller
                name="consent"
                control={control}
                rules={{
                  validate: (v) => v || t('leadForm.consentError'),
                }}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={!!field.value} />}
                    label={
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t('leadForm.consentTextPrefix')}{' '}
                        <Link href="/data-policy" passHref legacyBehavior>
                          <MuiLink target="_blank" rel="noopener noreferrer">{t('leadForm.consentPolicy')}</MuiLink>
                        </Link>.
                      </Typography>
                    }
                  />
                )}
              />
              {errors.consent && (
                <Typography variant="caption" color="error">
                  {String(errors.consent.message)}
                </Typography>
              )}

                  <LoadingButton
                    type="submit"
                    variant="contained"
                    size="large"
                    loading={isSubmitting}
                    disabled={
                      !watchedName?.trim() ||
                      !watchedEmail?.trim() ||
                      !watchedWebsite?.trim() ||
                      !watchedConsent
                    }
                    sx={{
                      py: 2,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      minHeight: '56px',
                    }}
                  >
                    {isSubmitting ? t('leadForm.submitLoading') : t('leadForm.submitIdle')}
                  </LoadingButton>

                  <Alert 
                    severity="info"
                  >
                    <Typography variant="body2">
                      <strong>{t('leadForm.infoPrivacy')}</strong> {t('leadForm.infoPrivacyText')}
                    </Typography>
                  </Alert>
                </Stack>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ pl: { md: 4 } }}>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 400, color: theme.palette.text.primary }}>
                {t('leadForm.whatYouGet')}
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
                {t('leadForm.areasTitle')}
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 400, color: theme.palette.text.primary, mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2, width: 4, height: 4, backgroundColor: theme.palette.success.main, borderRadius: '50%' }} />
                    {t('leadForm.areaAccessibility')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, ml: 3 }}>
                    {t('leadForm.areaAccessibilityDesc')}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 400, color: theme.palette.text.primary, mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2, width: 4, height: 4, backgroundColor: theme.palette.warning.main, borderRadius: '50%' }} />
                    {t('leadForm.areaSeo')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, ml: 3 }}>
                    {t('leadForm.areaSeoDesc')}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 400, color: theme.palette.text.primary, mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2, width: 4, height: 4, backgroundColor: theme.palette.primary.main, borderRadius: '50%' }} />
                    {t('leadForm.areaDesign')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, ml: 3 }}>
                    {t('leadForm.areaDesignDesc')}
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
