import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { ensureFirebaseApp, authProvider, getAuth, signInWithPopup, signOut, onAuthStateChanged } from '@/firebaseClient';
import { collection, getDocs, getFirestore, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Box, Button, Container, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Alert } from '@mui/material';

const AdminPage: NextPage = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Array<{ id: string; name: string; email: string; website: string; timestamp?: any }>>([]);

  useEffect(() => {
    ensureFirebaseApp();
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.email?.endsWith('@athlas.io') || u?.email?.endsWith('@athlas.se')) {
        setUserEmail(u.email);
        setError(null);
      } else if (u) {
        setUserEmail(null);
        setError('Endast @athlas.io eller @athlas.se-konton har åtkomst.');
      } else {
        setUserEmail(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    const db = getFirestore();
    const q = query(collection(db, 'leads'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setLeads(rows);
    });
    return () => unsub();
  }, [userEmail]);

  const handleSignIn = async () => {
    try {
      const auth = getAuth();
      await signInWithPopup(auth, authProvider);
    } catch (e: any) {
      setError(e?.message || 'Kunde inte logga in');
    }
  };

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e: any) {
      setError(e?.message || 'Kunde inte logga ut');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#1e1e1e' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Paper sx={{ p: 4, mb: 4, backgroundColor: '#2a2a2a', border: '1px solid #404040' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 400, color: '#ffffff' }}>Admin – Leads</Typography>
            <Stack direction="row" spacing={2}>
              {userEmail ? (
                <>
                  <Typography variant="body2" sx={{ alignSelf: 'center', color: '#b0b0b0' }}>{userEmail}</Typography>
                  <Button variant="outlined" onClick={handleSignOut} sx={{ borderColor: '#666666', color: '#ffffff', '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)' } }}>Logga ut</Button>
                </>
              ) : (
                <Button variant="contained" onClick={handleSignIn} sx={{ backgroundColor: '#ffffff', color: '#1e1e1e', '&:hover': { backgroundColor: '#f0f0f0' } }}>Logga in med Google</Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: '#2a2a2a', border: '1px solid #f44336', color: '#f44336', '& .MuiAlert-icon': { color: '#f44336' } }}>{error}</Alert>
        )}

        {!userEmail ? (
          <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#2a2a2a', border: '1px solid #404040' }}>
            <Typography variant="body1" sx={{ color: '#b0b0b0' }}>Logga in med din @athlas.io eller @athlas.se-adress för att se inkomna leads.</Typography>
          </Paper>
        ) : (
          <Paper sx={{ backgroundColor: '#2a2a2a', border: '1px solid #404040' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { backgroundColor: '#1e1e1e', borderBottom: '1px solid #404040', color: '#ffffff', fontWeight: 500 } }}>
                  <TableCell>Namn</TableCell>
                  <TableCell>E-post</TableCell>
                  <TableCell>Website</TableCell>
                  <TableCell>Tid</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} sx={{ '&:hover': { backgroundColor: '#404040' }, '& .MuiTableCell-body': { borderBottom: '1px solid #404040', color: '#b0b0b0' } }}>
                    <TableCell sx={{ color: '#ffffff' }}>{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>
                      <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'underline' }}>{lead.website}</a>
                    </TableCell>
                    <TableCell>
                      {lead.timestamp?.toDate ? new Date(lead.timestamp.toDate()).toLocaleString() : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {leads.length === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: '#666666' }}>Inga leads ännu.</Typography>
              </Box>
            )}
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default AdminPage;



