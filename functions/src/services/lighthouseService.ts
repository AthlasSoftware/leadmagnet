import axios from 'axios';

export interface LighthouseSummary {
	performanceScore?: number; // 0-100
	accessibilityScore?: number; // 0-100
	lcpSeconds?: number;
	fcpSeconds?: number;
	cls?: number;
	tbtMs?: number;
	tiSeconds?: number;
	speedIndexSeconds?: number;
	mobileOptimized?: boolean;
	auditsFlags: Array<{ type: 'error' | 'warning' | 'info'; message: string; recommendation: string; }>;
}

export async function fetchLighthouseFromPSI(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<LighthouseSummary | null> {
	try {
		const apiKey = process.env.PSI_API_KEY;
		const params: Record<string, string> = {
			url,
			strategy,
			categories: 'performance,accessibility,seo,best-practices',
		};
		if (apiKey) params.key = apiKey;

		const resp = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', { params, timeout: 120000 });
		const lh = resp.data?.lighthouseResult;
		if (!lh) return null;

		const categories = lh.categories || {};
		const audits = lh.audits || {};

		const performanceScore = categories.performance ? Math.round((categories.performance.score || 0) * 100) : undefined;
		const accessibilityScore = categories.accessibility ? Math.round((categories.accessibility.score || 0) * 100) : undefined;

		const sec = (v: any) => typeof v === 'number' ? v / 1000 : undefined;
		const ms = (v: any) => typeof v === 'number' ? v : undefined;

		const lcpSeconds = sec(audits['largest-contentful-paint']?.numericValue);
		const fcpSeconds = sec(audits['first-contentful-paint']?.numericValue);
		const cls = typeof audits['cumulative-layout-shift']?.numericValue === 'number' ? audits['cumulative-layout-shift']?.numericValue : undefined;
		const tbtMs = ms(audits['total-blocking-time']?.numericValue);
		const tiSeconds = sec(audits['interactive']?.numericValue);
		const speedIndexSeconds = sec(audits['speed-index']?.numericValue);

		const viewportOk = (audits['viewport']?.score ?? 0) >= 1;

		const auditsFlags: LighthouseSummary['auditsFlags'] = [];

		// Compose useful issues based on thresholds
		if (typeof lcpSeconds === 'number' && lcpSeconds > 2.5) {
			auditsFlags.push({ type: lcpSeconds > 4 ? 'error' : 'warning', message: `LCP är ${lcpSeconds.toFixed(1)}s (mål < 2.5s)`, recommendation: 'Optimera bilder, minska render-blockerande resurser och använd lazy-loading.' });
		}
		if (typeof cls === 'number' && cls > 0.1) {
			auditsFlags.push({ type: cls > 0.25 ? 'error' : 'warning', message: `CLS är ${cls.toFixed(2)} (mål < 0.1)`, recommendation: 'Reservera utrymme för media, undvik sen-inlästa banners och använd aspect-ratio.' });
		}
		if (typeof tbtMs === 'number' && tbtMs > 200) {
			auditsFlags.push({ type: tbtMs > 600 ? 'error' : 'warning', message: `Total Blocking Time är ${tbtMs.toFixed(0)}ms`, recommendation: 'Splittra tunga JS-buntar, använd code-splitting och web workers.' });
		}
		if (!viewportOk) {
			auditsFlags.push({ type: 'error', message: 'Viewport-meta saknas eller är felaktig', recommendation: 'Lägg till <meta name="viewport" content="width=device-width, initial-scale=1">' });
		}

		return {
			performanceScore,
			accessibilityScore,
			lcpSeconds,
			fcpSeconds,
			cls,
			tbtMs,
			tiSeconds: tiSeconds,
			speedIndexSeconds,
			mobileOptimized: viewportOk,
			auditsFlags,
		};
	} catch (e) {
		console.error('PSI/Lighthouse fetch failed', e);
		return null;
	}
}


