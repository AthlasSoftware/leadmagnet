import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';

const DataPolicyPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: { xs: 3, md: 6 } }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 300 }}>
          Datapolicy
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, fontWeight: 400, color: 'text.secondary' }}>
          Kort och tydligt om hur vi behandlar dina uppgifter
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            Vad samlar vi in?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Namn, e-postadress och webbadress för att kunna genomföra analysen och leverera resultat.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            Hur länge sparas uppgifterna?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Vi sparar uppgifterna i högst 15 dagar. Därefter tas de automatiskt bort.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            Vad används e-postadressen till?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            För att skicka analysresultat och för att kunna kontakta dig med relevanta förslag.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
            Frågor?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Kontakta oss på hello@athlas.io.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DataPolicyPage;


