import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import { useI18n } from '@/contexts/I18nContext';

const DataPolicyPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: { xs: 3, md: 6 } }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 300 }}>
          {t('policy.title')}
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, fontWeight: 400, color: 'text.secondary' }}>
          {t('policy.subtitle')}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            {t('policy.whatCollect')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('policy.whatCollectText')}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            {t('policy.howLong')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('policy.howLongText')}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            {t('policy.emailUse')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('policy.emailUseText')}
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            {t('policy.questions')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('policy.questionsText')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DataPolicyPage;


