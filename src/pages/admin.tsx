import React, { useEffect, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import type { NextPage } from 'next';
import { ensureFirebaseApp, authProvider, getAuth, signInWithPopup, signOut, onAuthStateChanged } from '@/firebaseClient';
import { collection, getDocs, getFirestore, onSnapshot, orderBy, query, where, updateDoc, doc } from 'firebase/firestore';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Alert,
  Tabs,
  Tab,
  TextField,
  LinearProgress,
  Chip,
  Checkbox,
  Collapse,
  IconButton,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Dashboard,
  People,
  Assessment,
  Logout,
  Google,
  CheckCircle,
  Error as ErrorIcon,
  Download,
  Search,
  Refresh,
  Speed
} from '@mui/icons-material';
import { useI18n } from '@/contexts/I18nContext';
import { AnalysisResults } from '@/types/analysis';

interface BatchResult {
  url: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  data?: AnalysisResults;
  error?: string;
  selected?: boolean;
}

const AdminPage: NextPage = () => {
  const { t, lang } = useI18n();
  const theme = useTheme();
  
  // Auth & Data State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Array<{ 
    id: string; 
    name: string; 
    email: string; 
    website: string; 
    timestamp?: any; 
    score?: number;
    seoScore?: number;
    accessibilityScore?: number;
    designScore?: number;
  }>>([]);
  
  // Auto-Repair Logic: If a lead has no score, re-analyze it to fix it.
  const [reanalyzingIds, setReanalyzingIds] = useState<Set<string>>(new Set());
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set()); // Track session-based attempts

  useEffect(() => {
    if (!leads.length || !userEmail) return;

    // Identify blank leads (null, undefined, OR 0) that we haven't tried fixing yet
    const blankLeads = leads.filter(l => 
      (l.score === undefined || l.score === null || l.score === 0) && // Treat 0 as invalid/missing
      !reanalyzingIds.has(l.id) &&
      !processedIds.has(l.id)
    );

    if (blankLeads.length === 0) return;

    const processQueue = async () => {
      // Mark these ids as in-progress immediately
      setReanalyzingIds(prev => {
        const next = new Set(prev);
        blankLeads.forEach(bl => next.add(bl.id));
        return next;
      });

      // Process one by one to avoid rate limits
      for (const lead of blankLeads) {
        try {
          console.log(`Auto-repairing lead: ${lead.email} (${lead.website})`);
          
          const res = await fetch('/api/analyze-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              website: lead.website, 
              leadId: lead.id, // Still sending this for future backend support
              lang: lang || 'sv'
            })
          });

          const data = await res.json();
          const results = data.results || data;

          if (results && results.overview) {
            const db = getFirestore();
            await updateDoc(doc(db, 'leads', lead.id), {
              score: results.overview.overallScore,
              seoScore: results.seo?.score ?? 0,
              accessibilityScore: results.accessibility?.score ?? 0,
              designScore: results.design?.score ?? 0
            });
            console.log(`Successfully patched lead ${lead.id}`);
          }
          
        } catch (e) {
          console.error(`Auto-analysis failed for ${lead.website}`, e);
        } finally {
           setReanalyzingIds(prev => {
             const next = new Set(prev);
             next.delete(lead.id);
             return next;
           });
           setProcessedIds(prev => {
             const next = new Set(prev);
             next.add(lead.id);
             return next;
           });
           // Add slight delay to be nice to the API
           await new Promise(r => setTimeout(r, 1000));
        }
      }
    };

    processQueue();
  }, [leads, userEmail, lang, processedIds.size]); // processedIds.size to avoid deep dep loop

  // UI State
  const [activeTab, setActiveTab] = useState(0);
  const [batchUrls, setBatchUrls] = useState('');
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // --- Auth & Data Effects ---
  useEffect(() => {
    ensureFirebaseApp();
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.email?.endsWith('@athlas.io') || u?.email?.endsWith('@athlas.se')) {
        setUserEmail(u.email);
        setError(null);
      } else if (u) {
        setUserEmail(null);
        setError(t('admin.onlyAthlasAccess'));
      } else {
        setUserEmail(null);
      }
    });
    return () => unsub();
  }, [t]);

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

  // --- Handlers ---
  const handleSignIn = async () => {
    try {
      const auth = getAuth();
      await signInWithPopup(auth, authProvider);
    } catch (e: any) {
      setError(e?.message || t('admin.errors.loginFailed'));
    }
  };

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e: any) {
      setError(e?.message || t('admin.errors.logoutFailed'));
    }
  };

  const toggleRow = (url: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(url)) newSet.delete(url);
    else newSet.add(url);
    setExpandedRows(newSet);
  };

  const handleRunBatch = async () => {
    if (!batchUrls.trim()) return;
    setIsAnalyzing(true);
    setProgress(0);
    
    const urls = Array.from(new Set(
      batchUrls.split('\n')
        .map(u => u.trim())
        .filter(u => u.length > 0)
    ));

    const initialResults: BatchResult[] = urls.map(u => ({ url: u, status: 'pending' }));
    setBatchResults(initialResults);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      setBatchResults(prev => prev.map(r => r.url === url ? { ...r, status: 'analyzing' } : r));

      try {
        const res = await fetch('/api/analyze-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: url, lang: 'sv' })
        });
        const payload = await res.json();
        // The API returns { results: ... } structure
        const data = payload.results || payload;
        
        if (res.ok && data?.overview?.overallScore !== undefined) {
          setBatchResults(prev => prev.map(r => r.url === url ? { ...r, status: 'completed', data } : r));
        } else {
          setBatchResults(prev => prev.map(r => r.url === url ? { 
            ...r, 
            status: 'failed', 
            error: data?.error || payload?.error || 'Analysis returned incomplete data' 
          } : r));
        }
      } catch (err: any) {
        setBatchResults(prev => prev.map(r => r.url === url ? { ...r, status: 'failed', error: err.message } : r));
      }
      
      setProgress(Math.round(((i + 1) / urls.length) * 100));
    }
    setIsAnalyzing(false);
  };

  const handleExportCsv = () => {
    const headers = ['URL', 'Total Score', 'SEO Score', 'Access Score', 'Design Score', 'Status', 'Error'];
    const rows = batchResults.map(r => {
      if (r.status === 'completed' && r.data?.overview) {
        return [
          r.url,
          r.data.overview.overallScore,
          r.data.seo?.score ?? 0,
          r.data.accessibility?.score ?? 0,
          r.data.design?.score ?? 0,
          'Completed',
          ''
        ];
      }
      return [r.url, '', '', '', '', r.status, r.error || ''];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'batch_analysis_batch.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setBatchResults(prev => prev.map(r => r.status === 'completed' ? { ...r, selected: checked } : r));
  };

  const handleSelectOne = (url: string, checked: boolean) => {
    setBatchResults(prev => prev.map(r => r.url === url ? { ...r, selected: checked } : r));
  };

  const handleDownloadPdfs = async (specificUrl?: string) => {
    const targets = specificUrl 
      ? batchResults.filter(r => r.url === specificUrl && r.status === 'completed' && r.data)
      : batchResults.filter(r => r.selected && r.status === 'completed' && r.data);

    if (!targets.length) return;

    for (const item of targets) {
      if (!item.data) continue;
      try {
        const response = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website: item.url,
            results: item.data,
            email: '',
            lang
          }),
        });
        if (response.ok) {
          const blob = await response.blob();
          const cleanUrl = item.url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[\/\.]/g, '_');
          const fileName = `${cleanUrl}_pulse.pdf`;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
            console.error(`Failed to generate PDF for ${item.url}`);
        }
      } catch (e) {
        console.error(`Error downloading PDF for ${item.url}`, e);
      }
    }
  };

  // --- Components ---

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: '16px !important' }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#888', mb: 0.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#fff' }}>{value}</Typography>
        </Box>
        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
          {icon}
        </Box>
      </CardContent>
    </Card>
  );

  const ScoreBadge = ({ score }: { score: number }) => {
    let color = '#f44336';
    if (score >= 90) color = '#4caf50';
    else if (score >= 70) color = '#ff9800';

    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', border: `2px solid ${color}`, color: color, fontWeight: 'bold', fontSize: '0.85rem' }}>
        {score}
      </Box>
    );
  };

  const StatusChip = ({ status, error }: { status: BatchResult['status'], error?: string }) => {
    let color = '#b0b0b0';
    let bgcolor = 'rgba(255, 255, 255, 0.1)';
    let text = status as string;

    switch(status) {
        case 'completed': color = '#81c784'; bgcolor = 'rgba(76, 175, 80, 0.1)'; text = 'Completed'; break;
        case 'failed': color = '#e57373'; bgcolor = 'rgba(244, 67, 54, 0.1)'; text = 'Failed'; break;
        case 'analyzing': color = '#64b5f6'; bgcolor = 'rgba(33, 150, 243, 0.1)'; text = 'Analyzing...'; break;
    }

    if (error) return <Tooltip title={error}><Chip size="small" label="Failed" sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#e57373', border: '1px solid rgba(244, 67, 54, 0.2)' }} /></Tooltip>;

    return (
      <Chip 
        size="small" 
        label={text} 
        sx={{ 
          bgcolor, 
          color, 
          border: `1px solid ${color}40`,
          fontWeight: 500
        }} 
      />
    );
  };

  // --- Render ---

  if (!userEmail) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#09090b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#18181b', border: '1px solid #27272a', borderRadius: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <Dashboard fontSize="large" />
            </Box>
            <Typography variant="h4" sx={{ color: '#fff', mb: 1, fontWeight: 700 }}>Pulse Admin</Typography>
            <Typography variant="body1" sx={{ color: '#a1a1aa', mb: 4 }}>Sign in to manage leads and run analysis batch jobs.</Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#ff8a80' }}>
                {error}
              </Alert>
            )}

            <Button 
                variant="contained" 
                size="large"
                startIcon={<Google />}
                onClick={handleSignIn} 
                fullWidth
                sx={{ 
                    bgcolor: '#fff', 
                    color: '#000', 
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#e4e4e7' }
                }}
            >
                {t('admin.loginGoogle')}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#09090b', color: '#e4e4e7' }}>
        {/* Navbar */}
        <Box sx={{ borderBottom: '1px solid #27272a', bgcolor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
            <Container maxWidth="xl">
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 64 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Dashboard sx={{ color: '#2196f3' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>Pulse Admin</Typography>
                        <Divider orientation="vertical" flexItem sx={{ borderColor: '#27272a', mx: 2 }} />
                        <Tabs 
                            value={activeTab} 
                            onChange={(e, v) => setActiveTab(v)}
                            sx={{ 
                                '& .MuiTab-root': { color: '#71717a', minHeight: 64, textTransform: 'none', fontSize: '0.95rem', fontWeight: 500 },
                                '& .Mui-selected': { color: '#fff' },
                                '& .MuiTabs-indicator': { bgcolor: '#2196f3', height: 2 }
                            }}
                        >
                            <Tab icon={<People sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Leads Database" />
                            <Tab icon={<Assessment sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Batch Analysis" />
                        </Tabs>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#2196f3', fontSize: '0.8rem' }}>{userEmail[0].toUpperCase()}</Avatar>
                        <Button 
                            startIcon={<Logout />} 
                            onClick={handleSignOut}
                            sx={{ color: '#71717a', '&:hover': { color: '#fff', bgcolor: 'transparent' } }}
                        >
                            Sign out
                        </Button>
                    </Stack>
                </Stack>
            </Container>
        </Box>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {activeTab === 0 ? (
                // --- Leads Tab ---
                <Stack spacing={4}>
                    {/* Stats */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Total Leads" value={leads.length} icon={<People />} color="#2196f3" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Avg Score" value={Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / (leads.filter(l => l.score).length || 1))} icon={<Speed />} color="#4caf50" />
                        </Grid>
                    </Grid>

                    {/* Table */}
                    <Paper sx={{ bgcolor: '#18181b', border: '1px solid #27272a', borderRadius: 2, overflow: 'hidden' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#27272a' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#a1a1aa', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Client</TableCell>
                                    <TableCell sx={{ color: '#a1a1aa', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Scores</TableCell>
                                    <TableCell sx={{ color: '#a1a1aa', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Details</TableCell>
                                    <TableCell sx={{ color: '#a1a1aa', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Captured</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id} hover sx={{ '&:hover': { bgcolor: '#27272a' } }}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>{lead.name}</Typography>
                                                <Typography variant="body2" sx={{ color: '#71717a' }}>{lead.email}</Typography>
                                                <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: '#2196f3', textDecoration: 'none', fontSize: '0.875rem' }}>{lead.website}</a>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={3} alignItems="center">
                                                <Box sx={{ textAlign: 'center' }}>
                                                    {reanalyzingIds.has(lead.id) ? (
                                                        <CircularProgress size={32} sx={{ color: '#2196f3' }} /> 
                                                    ) : (
                                                        <ScoreBadge score={lead.score || 0} />
                                                    )}
                                                    <Typography variant="caption" display="block" sx={{ color: '#71717a', mt: 0.5 }}> Overall</Typography>
                                                </Box>
                                                <Divider orientation="vertical" flexItem sx={{ borderColor: '#3f3f46' }} />
                                                <Stack direction="row" spacing={2}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography sx={{ color: '#e4e4e7', fontWeight: 600 }}>
                                                            {reanalyzingIds.has(lead.id) ? '...' : (lead.seoScore ?? '-')}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#71717a' }}>SEO</Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography sx={{ color: '#e4e4e7', fontWeight: 600 }}>
                                                            {reanalyzingIds.has(lead.id) ? '...' : (lead.accessibilityScore ?? '-')}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#71717a' }}>A11y</Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography sx={{ color: '#e4e4e7', fontWeight: 600 }}>
                                                            {reanalyzingIds.has(lead.id) ? '...' : (lead.designScore ?? '-')}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#71717a' }}>Design</Typography>
                                                    </Box>
                                                </Stack>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label="Lead" size="small" sx={{ bgcolor: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46' }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: '#71717a' }}>
                                                {lead.timestamp?.toDate ? new Date(lead.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#52525b' }}>
                                                {lead.timestamp?.toDate ? new Date(lead.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {leads.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">No leads captured yet.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </Stack>
            ) : (
                // --- Batch Tab ---
                <Grid container spacing={4}>
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, bgcolor: '#18181b', border: '1px solid #27272a', borderRadius: 2, height: '100%' }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>New Batch</Typography>
                                <Typography variant="body2" sx={{ color: '#a1a1aa' }}>Enter one URL per line to analyze multiple websites at once.</Typography>
                            </Box>
                            
                            <TextField
                                multiline
                                rows={10}
                                fullWidth
                                placeholder="https://example.com&#10;https://another-site.com"
                                value={batchUrls}
                                onChange={(e) => setBatchUrls(e.target.value)}
                                sx={{ 
                                    mb: 3,
                                    bgcolor: '#09090b',
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: '#27272a' },
                                        '&:hover fieldset': { borderColor: '#3f3f46' },
                                        '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                                    },
                                    '& .MuiInputBase-input': { 
                                        color: '#fff', 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.9rem',
                                        WebkitTextFillColor: '#ffffff !important',
                                    }
                                }}
                            />

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={handleRunBatch}
                                disabled={isAnalyzing || !batchUrls.trim()}
                                startIcon={isAnalyzing ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Search />}
                                sx={{ 
                                    py: 1.5, 
                                    mb: 2, 
                                    bgcolor: '#2196f3',
                                    color: '#fff',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#1976d2' },
                                    '&.Mui-disabled': { bgcolor: '#27272a', color: '#52525b' }
                                }}
                            >
                                {isAnalyzing ? `Analyzing... ${progress}%` : 'Start Analysis'}
                            </Button>
                            
                            {isAnalyzing && (
                                <LinearProgress variant="determinate" value={progress} sx={{ bgcolor: '#27272a', '& .MuiLinearProgress-bar': { bgcolor: '#2196f3' } }} />
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ overflow: 'hidden', bgcolor: '#18181b', border: '1px solid #27272a', borderRadius: 2, minHeight: 500 }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>Results ({batchResults.length})</Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button 
                                        startIcon={<Download />}
                                        size="small"
                                        variant="outlined"
                                        onClick={handleExportCsv}
                                        disabled={batchResults.length === 0}
                                        sx={{ borderColor: '#27272a', color: '#a1a1aa', '&:hover': { borderColor: '#fff', color: '#fff' } }}
                                    >
                                        CSV
                                    </Button>
                                    <Button 
                                        startIcon={<Download />}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleDownloadPdfs()}
                                        disabled={!batchResults.some(r => r.selected && r.status === 'completed')}
                                        sx={{ borderColor: '#27272a', color: '#a1a1aa', '&:hover': { borderColor: '#fff', color: '#fff' } }}
                                    >
                                        Selected PDFs
                                    </Button>
                                </Stack>
                            </Box>
                            
                            {batchResults.length > 0 ? (
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#27272a' }}>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox 
                                                    size="small" 
                                                    sx={{ color: '#52525b', '&.Mui-checked': { color: '#2196f3' } }} 
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#a1a1aa', fontWeight: 600 }}>URL</TableCell>
                                            <TableCell sx={{ color: '#a1a1aa', fontWeight: 600 }}>Score</TableCell>
                                            <TableCell sx={{ color: '#a1a1aa', fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>SEO</TableCell>
                                            <TableCell sx={{ color: '#a1a1aa', fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>A11y</TableCell>
                                            <TableCell sx={{ color: '#a1a1aa', fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Design</TableCell>
                                            <TableCell sx={{ color: '#a1a1aa', fontWeight: 600 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ color: '#a1a1aa', fontWeight: 600 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {batchResults.map((result, idx) => (
                                            <React.Fragment key={idx}>
                                                <TableRow 
                                                    hover
                                                    onClick={() => result.status === 'completed' && toggleRow(result.url)}
                                                    sx={{ 
                                                        cursor: result.status === 'completed' ? 'pointer' : 'default',
                                                        bgcolor: expandedRows.has(result.url) ? 'rgba(255,255,255,0.02)' : 'transparent' 
                                                    }}
                                                >
                                                    <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                                                        <Checkbox 
                                                            size="small"
                                                            checked={!!result.selected} 
                                                            disabled={result.status !== 'completed'}
                                                            onChange={(e) => handleSelectOne(result.url, e.target.checked)}
                                                            sx={{ color: '#52525b', '&.Mui-checked': { color: '#2196f3' } }} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.85rem' }}>{result.url}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {result.status === 'completed' && result.data?.overview ? (
                                                            <ScoreBadge score={result.data.overview.overallScore} />
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: '#a1a1aa' }}>
                                                        {result.data?.seo?.score ?? '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: '#a1a1aa' }}>
                                                        {result.data?.accessibility?.score ?? '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: '#a1a1aa' }}>
                                                        {result.data?.design?.score ?? '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip status={result.status} error={result.error} />
                                                    </TableCell>
                                                    <TableCell align="right" onClick={e => e.stopPropagation()}>
                                                        <Stack direction="row" justifyContent="flex-end" alignItems="center">
                                                            <IconButton 
                                                                size="small" 
                                                                disabled={result.status !== 'completed'}
                                                                onClick={() => handleDownloadPdfs(result.url)}
                                                                sx={{ color: '#2196f3', '&:disabled': { color: '#3f3f46' } }}
                                                            >
                                                                <Download fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => toggleRow(result.url)} sx={{ color: '#71717a' }}>
                                                                {expandedRows.has(result.url) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                            </IconButton>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0, border: 0 }} colSpan={8}>
                                                        <Collapse in={expandedRows.has(result.url)} timeout="auto" unmountOnExit>
                                                            <Box sx={{ p: 2, bgcolor: '#09090b', borderTop: '1px solid #27272a', borderBottom: '1px solid #27272a' }}>
                                                                <Grid container spacing={3}>
                                                                    <Grid item xs={6}>
                                                                        <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority Issues</Typography>
                                                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                                                            {result.data?.overview.priorityIssues.map((issue, i) => (
                                                                                <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                                                                                    <ErrorIcon sx={{ fontSize: 16, color: '#f44336', mt: 0.5 }} />
                                                                                    <Typography variant="body2" sx={{ color: '#d4d4d8', fontSize: '0.85rem' }}>{issue}</Typography>
                                                                                </Box>
                                                                            ))}
                                                                            {!result.data?.overview.priorityIssues.length && <Typography variant="body2" sx={{ color: '#52525b', fontStyle: 'italic' }}>None found.</Typography>}
                                                                        </Stack>
                                                                    </Grid>
                                                                    <Grid item xs={6}>
                                                                        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Wins</Typography>
                                                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                                                            {result.data?.overview.quickWins.map((win, i) => (
                                                                                <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                                                                                    <CheckCircle sx={{ fontSize: 16, color: '#4caf50', mt: 0.5 }} />
                                                                                    <Typography variant="body2" sx={{ color: '#d4d4d8', fontSize: '0.85rem' }}>{win}</Typography>
                                                                                </Box>
                                                                            ))}
                                                                            {!result.data?.overview.quickWins.length && <Typography variant="body2" sx={{ color: '#52525b', fontStyle: 'italic' }}>None found.</Typography>}
                                                                        </Stack>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, color: '#52525b' }}>
                                    <Assessment sx={{ fontSize: 64, mb: 2, color: '#27272a' }} />
                                    <Typography variant="body1">Results will appear here</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Container>
    </Box>
  );
};

export default AdminPage;



