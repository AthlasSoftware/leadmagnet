import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { analyzeWebsite } from './services/websiteAnalyzer';
import { saveLead, updateLeadScore } from './services/leadService';
import { generateReport } from './services/reportGenerator';
import { sendEmailReport } from './services/emailService';
import dns from 'dns/promises';
import axios from 'axios';

admin.initializeApp();

const app = express();
const router = express.Router();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Relax rate limiting for development/testing
const rateLimiter = new RateLimiterMemory({ points: 20, duration: 60 });
const rateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
	try {
		const clientIP = req.ip || (req.connection as any).remoteAddress || 'unknown';
		await rateLimiter.consume(clientIP);
		next();
	} catch (rejRes: any) {
		res.status(429).json({ error: 'Too many requests. Please try again shortly.', retryAfter: Math.round((rejRes?.msBeforeNext || 60000) / 1000) || 60 });
	}
};

// Health check endpoint
router.get('/health', (_req, res) => {
	res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// Lead capture
router.post('/capture-lead', rateLimitMiddleware, async (req, res) => {
	try {
		const { name, email, website, consent } = req.body;
		if (!name || !email || !website) return res.status(400).json({ error: 'Name, email, and website are required fields' });
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) return res.status(400).json({ error: 'Please provide a valid email address' });
		let normalizedUrl = website.trim();
		if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
		try { new URL(normalizedUrl); } catch { return res.status(400).json({ error: 'Please provide a valid website URL' }); }
		const leadId = await saveLead({ name, email, website: normalizedUrl, consent: !!consent });
		return res.status(200).json({ success: true, leadId, message: 'Lead captured successfully' });
	} catch (error) {
		console.error('Error capturing lead:', error);
		return res.status(500).json({ error: 'Internal server error. Please try again later.' });
	}
});

// Verify domain
router.post('/verify-domain', rateLimitMiddleware, async (req, res) => {
	try {
		const website = String((req.body && (req.body.website || req.body.url)) || '').trim();
		if (!website) {
			return res.status(400).json({ error: 'Saknar webbadress' });
		}

		let normalized = website;
		if (!/^https?:\/\//i.test(normalized)) {
			normalized = `https://${normalized}`;
		}

		let url: URL;
		try {
			url = new URL(normalized);
		} catch {
			return res.status(400).json({ error: 'Ogiltig webbadress' });
		}

		const hostname = url.hostname;

		// Basic hostname sanity checks
		if (!hostname || hostname.split('.').length < 2 || /\s/.test(hostname)) {
			return res.status(400).json({ error: 'Ogiltigt domännamn' });
		}

		// DNS resolution: prefer lookup for both A/AAAA
		let addresses: Array<string> = [];
		try {
			const result = await dns.lookup(hostname, { all: true });
			addresses = result.map(r => r.address);
		} catch (e: any) {
			// Try resolve4/resolve6 as fallback
			try {
				const v4 = await dns.resolve4(hostname);
				addresses = addresses.concat(v4);
			} catch {}
			try {
				const v6 = await dns.resolve6(hostname);
				addresses = addresses.concat(v6);
			} catch {}
		}

		if (addresses.length === 0) {
			return res.status(404).json({ error: 'Domänen kunde inte hittas i DNS' });
		}

		// Optional HTTP reachability probe (best-effort)
		let httpReachable = false;
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);
			const response = await axios.get(url.origin, { 
				timeout: 5000,
				validateStatus: (status) => status < 500,
				maxRedirects: 5,
				signal: controller.signal as any
			});
			clearTimeout(timeoutId);
			httpReachable = response.status >= 200 && response.status < 500;
		} catch {
			httpReachable = false;
		}

		return res.status(200).json({
			ok: true,
			hostname,
			dnsResolved: true,
			httpReachable,
			addresses: addresses.slice(0, 5),
		});
	} catch (error: any) {
		console.error('Error verifying domain:', error);
		return res.status(500).json({ error: 'Internt fel vid domänverifiering' });
	}
});

// Analyze
router.post('/analyze-website', rateLimitMiddleware, async (req, res) => {
	try {
		const { website, sessionId, lang, leadId } = req.body;
		if (!website) return res.status(400).json({ error: 'Website URL is required' });
		let normalizedUrl = website.trim();
		if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
		try { new URL(normalizedUrl); } catch { return res.status(400).json({ error: 'Please provide a valid website URL' }); }
		const defaultMode = (process.env.DEFAULT_ANALYSIS_MODE as any) || 'deep';
		const results = await analyzeWebsite(normalizedUrl, { mode: defaultMode, lang: (lang === 'en' ? 'en' : 'sv') as any });
		if (sessionId) {
			await admin.firestore().collection('analyses').add({ sessionId, website: normalizedUrl, results, timestamp: admin.firestore.FieldValue.serverTimestamp() });
		}
		if (leadId) {
			await updateLeadScore(leadId, {
				score: results.overview.overallScore,
				seoScore: results.seo.score,
				accessibilityScore: results.accessibility.score,
				designScore: results.design.score
			});
		}
		return res.status(200).json({ success: true, results });
	} catch (error) {
		console.error('Error analyzing website:', error);
		return res.status(500).json({ error: 'Failed to analyze website. Please check the URL and try again.' });
	}
});

// Report
router.post('/generate-report', rateLimitMiddleware, async (req, res) => {
	try {
		const { website, results, email, lang } = req.body;
		if (!website || !results) return res.status(400).json({ error: 'Website and analysis results are required' });
		const reportBuffer = await generateReport(website, results, (lang === 'en' ? 'en' : 'sv') as any);
		if (email) await sendEmailReport(email, website, reportBuffer);
		res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="athlas-website-analysis-${new Date().toISOString().split('T')[0]}.pdf"`, 'Content-Length': reportBuffer.length });
		return res.send(reportBuffer);
	} catch (error) {
		console.error('Error generating report:', error);
		return res.status(500).json({ error: 'Failed to generate report. Please try again later.' });
	}
});

// Mount router on both '/' and '/api' so Hosting rewrite to /api/** works
app.use('/', router);
app.use('/api', router);

export const pulseapi = functions
	.region('europe-west1')
	.runWith({ timeoutSeconds: 300, memory: '1GB' })
	.https
	.onRequest(app);

// Scheduled cleanup: delete leads and analyses older than 15 days
export const scheduledCleanup = functions
  .region('europe-west1')
  .pubsub.schedule('every 24 hours')
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const db = admin.firestore();
    const now = Date.now();
    const cutoff = new Date(now - 15 * 24 * 60 * 60 * 1000);

    const collections = ['leads', 'analyses', 'events'];
    for (const coll of collections) {
      const snap = await db.collection(coll).where('timestamp', '<', cutoff).get();
      const batch = db.batch();
      let count = 0;
      snap.forEach((doc) => {
        batch.delete(doc.ref);
        count += 1;
      });
      if (count > 0) {
        await batch.commit();
      }
    }
    return null;
  });

