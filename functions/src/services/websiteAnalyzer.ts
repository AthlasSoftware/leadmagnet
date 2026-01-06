import * as cheerio from 'cheerio';
import axios from 'axios';

export interface AnalysisResults {
  accessibility: AccessibilityResults;
  seo: SEOResults;
  design: DesignResults;
  overview: OverviewResults;
}

export interface AccessibilityResults {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    element?: string;
    recommendation: string;
  }>;
  strengths: string[];
}

export interface SEOResults {
  score: number;
  technical: {
    loadSpeed: number;
    mobileOptimized: boolean;
    httpsEnabled: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
  };
  onPage: {
    hasUniqueTitle: boolean;
    hasMetaDescription: boolean;
    hasH1: boolean;
    headerStructure: string[];
    imagesWithAlt: number;
    totalImages: number;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
}

export interface DesignResults {
  score: number;
  responsive: boolean;
  loadTime: number;
  colorContrast: {
    sufficient: boolean;
    ratio: number;
  };
  typography: {
    readable: boolean;
    hierarchy: boolean;
  };
  navigation: {
    clear: boolean;
    accessible: boolean;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
}

export interface OverviewResults {
  overallScore: number;
  summary: string;
  priorityIssues: string[];
  quickWins: string[];
}

type Lang = 'sv' | 'en';

function tr(lang: Lang, sv: string, en: string): string {
  return lang === 'en' ? en : sv;
}

export async function analyzeWebsite(url: string, options?: { mode?: 'basic' | 'deep'; lang?: Lang }): Promise<AnalysisResults> {
  console.log(`Starting analysis for: ${url}`);
  
  const lang: Lang = (options?.lang === 'en' ? 'en' : 'sv');
  try {
    // Fetch page content with axios instead of Puppeteer for now
    const startTime = Date.now();
    const response = await axios.get(url, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Accept redirects and client errors
    });
    const loadTime = Date.now() - startTime;
    const content = response.data;
    const $ = cheerio.load(content);
    const headers = response.headers;

    // Simulate requests array for compatibility
    const requests: any[] = [{ timestamp: startTime }, { timestamp: Date.now() }];

    // Run enhanced analysis with all checks
    const [accessibilityResults, seoResults, designResults] = await Promise.all([
      analyzeAccessibilityEnhanced($, url, lang),
      analyzeSEOEnhanced($, url, requests, headers, lang),
      analyzeDesignEnhanced($, loadTime, url, lang)
    ]);

    // ALWAYS use deep mode with Lighthouse for professional analysis (unless explicitly disabled)
    const shouldUseDeep = (options?.mode || process.env.DEFAULT_ANALYSIS_MODE || 'deep') === 'deep';
    if (shouldUseDeep) {
      try {
        const { fetchLighthouseFromPSI } = await import('./lighthouseService');
        const lh = await fetchLighthouseFromPSI(url, 'mobile');
        if (lh) {
          // Blend scores conservatively
          if (typeof lh.accessibilityScore === 'number') {
            accessibilityResults.score = Math.round((accessibilityResults.score * 0.6) + (lh.accessibilityScore * 0.4));
          }
          // Enrich SEO technical metrics
          if (typeof lh.lcpSeconds === 'number') {
            // Penalize SEO score if LCP high
            if (lh.lcpSeconds > 2.5) {
              const penalty = lh.lcpSeconds > 4 ? 10 : 5;
              seoResults.score = Math.max(0, seoResults.score - penalty);
              seoResults.issues.push({ type: lh.lcpSeconds > 4 ? 'error' : 'warning', message: tr(lang, `LCP är ${lh.lcpSeconds.toFixed(1)}s`, `LCP is ${lh.lcpSeconds.toFixed(1)}s`), recommendation: tr(lang, 'Optimera bilder och render-blockerande resurser.', 'Optimize images and render-blocking resources.') });
            }
            seoResults.technical.loadSpeed = Math.max(seoResults.technical.loadSpeed, lh.lcpSeconds);
          }
          if (typeof lh.tbtMs === 'number') {
            // already in ms; just add an issue if large
            if (lh.tbtMs > 600) {
              seoResults.issues.push({ type: 'error', message: tr(lang, `Total Blocking Time är ${lh.tbtMs}ms`, `Total Blocking Time is ${lh.tbtMs}ms`), recommendation: tr(lang, 'Minska JS-arbete på huvudtråden; använd code-splitting.', 'Reduce main-thread JS; use code splitting.') });
              seoResults.score = Math.max(0, seoResults.score - 10);
            }
          }
          if (typeof lh.cls === 'number' && lh.cls > 0.25) {
            designResults.issues.push({ type: 'warning', message: tr(lang, `CLS är ${lh.cls.toFixed(2)}`, `CLS is ${lh.cls.toFixed(2)}`), recommendation: tr(lang, 'Reservera utrymme för media / set aspect-ratio.', 'Reserve space for media / set aspect-ratio.') });
            designResults.score = Math.max(0, designResults.score - 10);
          }
          if (typeof lh.speedIndexSeconds === 'number' && lh.speedIndexSeconds > 4) {
            designResults.issues.push({ type: 'info', message: `Speed Index ${lh.speedIndexSeconds.toFixed(1)}s`, recommendation: tr(lang, 'Optimera resursladdning och cachning.', 'Optimize resource loading and caching.') });
          }
          if (lh.mobileOptimized === false) {
            seoResults.issues.push({ type: 'error', message: tr(lang, 'Viewport-meta saknas/ogiltig enligt Lighthouse', 'Viewport meta missing/invalid per Lighthouse'), recommendation: tr(lang, 'Lägg till korrekt viewport-meta för mobil.', 'Add a correct viewport meta for mobile.') });
          }
          // Include PSI audit flags mapped to our model
          for (const flag of lh.auditsFlags || []) {
            // Prefer to attach perf flags to SEO unless contrast/UX-related
            const bucket = /contrast|layout|cls|lcp|speed|blocking|interactive/i.test(flag.message) ? (flag.message.toLowerCase().includes('cls') ? 'design' : 'seo') : 'accessibility';
            const mapped = { type: flag.type, message: flag.message, recommendation: flag.recommendation } as any;
            if (bucket === 'design') designResults.issues.push(mapped);
            else if (bucket === 'seo') seoResults.issues.push(mapped);
            else accessibilityResults.issues.push(mapped);
          }
        }
      } catch (e) {
        console.warn('Deep (PSI) enrichment failed, continuing with basic analysis', e);
      }
    }

    // Calculate overall score and summary
    const overallScore = Math.round((accessibilityResults.score + seoResults.score + designResults.score) / 3);
    
    const overview: OverviewResults = {
      overallScore,
      summary: generateSummary(overallScore, accessibilityResults, seoResults, designResults, lang),
      priorityIssues: extractPriorityIssues(accessibilityResults, seoResults, designResults, lang),
      quickWins: extractQuickWins(accessibilityResults, seoResults, designResults, lang)
    };

    return {
      accessibility: accessibilityResults,
      seo: seoResults,
      design: designResults,
      overview
    };

  } catch (error) {
    console.error('Error analyzing website:', error);
    throw new Error(`Failed to analyze website: ${error}`);
  }
}

async function analyzeAccessibilityEnhanced($: cheerio.CheerioAPI, url: string, lang: Lang): Promise<AccessibilityResults> {
  const issues: AccessibilityResults['issues'] = [];
  const strengths: string[] = [];
  let score = 100;

  // 1. Image alt text analysis (enhanced)
  const images = $('img');
  const imagesWithoutAlt = images.filter((_, img) => {
    const alt = $(img).attr('alt');
    return alt === undefined || alt === null;
  }).length;
  
  const imagesWithEmptyAlt = images.filter((_, img) => {
    const alt = $(img).attr('alt');
    return alt === '';
  }).length;
  
  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'error',
      message: tr(lang, `${imagesWithoutAlt} bilder saknar alt-attribut`, `${imagesWithoutAlt} images missing alt attribute`),
      recommendation: tr(lang, 'Lägg till beskrivande alt-text för alla bilder. Även dekorativa bilder bör ha alt="" för att markera dem som dekorativa.', 'Add descriptive alt text for all images. Decorative images should have alt="" to mark them as decorative.')
    });
    score -= Math.min(30, imagesWithoutAlt * 5);
  } else if (images.length > 0) {
    strengths.push(tr(lang, `Alla ${images.length} bilder har alt-attribut`, `All ${images.length} images have alt attribute`));
  }

  if (imagesWithEmptyAlt > 5) {
    issues.push({
      type: 'warning',
      message: tr(lang, `${imagesWithEmptyAlt} bilder har tom alt-text`, `${imagesWithEmptyAlt} images have empty alt text`),
      recommendation: tr(lang, 'Kontrollera att tomma alt-attribut endast används för dekorativa bilder.', 'Ensure empty alt attributes are only used for decorative images.')
    });
    score -= 5;
  }

  // 2. Heading structure analysis (enhanced)
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      message: tr(lang, 'Ingen H1-rubrik hittades', 'No H1 heading found'),
      recommendation: tr(lang, 'Lägg till en unik H1-rubrik som tydligt beskriver sidans huvudinnehåll. Detta är viktigt för både tillgänglighet och SEO.', 'Add a unique H1 heading that clearly describes the main content. This is important for both accessibility and SEO.')
    });
    score -= 15;
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      message: tr(lang, `${h1Count} H1-rubriker hittades (rekommenderat: 1)`, `${h1Count} H1 headings found (recommended: 1)`),
      recommendation: tr(lang, 'Använd endast en H1-rubrik per sida för tydlig dokumentstruktur. Använd H2-H6 för underrubriker.', 'Use only one H1 per page for clear document structure. Use H2-H6 for subheadings.')
    });
    score -= 10;
  } else {
    strengths.push(tr(lang, 'Korrekt H1-struktur (exakt 1 H1)', 'Correct H1 structure (exactly 1 H1)'));
  }

  // Check heading hierarchy
  if (h1Count > 0 && h2Count === 0 && (h3Count > 0 || h4Count > 0)) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Bruten rubrikhierarki (H3/H4 utan H2)', 'Broken heading hierarchy (H3/H4 without H2)'),
      recommendation: tr(lang, 'Följ en logisk rubrikhierarki: H1 → H2 → H3 → H4. Hoppa inte över nivåer.', 'Follow a logical heading hierarchy: H1 → H2 → H3 → H4. Do not skip levels.')
    });
    score -= 8;
  }

  // 3. Form accessibility (enhanced)
  const inputs = $('input:not([type="hidden"]), textarea, select');
  const inputsWithoutLabels = inputs.filter((_, input) => {
    const id = $(input).attr('id');
    const hasLabel = (id && $(`label[for="${id}"]`).length > 0);
    const hasAriaLabel = $(input).attr('aria-label');
    const hasAriaLabelledby = $(input).attr('aria-labelledby');
    const hasTitle = $(input).attr('title');
    return !hasLabel && !hasAriaLabel && !hasAriaLabelledby && !hasTitle;
  }).length;

  if (inputsWithoutLabels > 0) {
    issues.push({
      type: 'error',
      message: tr(lang, `${inputsWithoutLabels} formulärfält saknar etiketter eller ARIA-labels`, `${inputsWithoutLabels} form fields lack labels or ARIA labels`),
      recommendation: tr(lang, 'Alla formulärfält måste ha tydliga etiketter via <label>, aria-label eller aria-labelledby för skärmläsare.', 'All form fields must have clear labels via <label>, aria-label or aria-labelledby for screen readers.')
    });
    score -= Math.min(20, inputsWithoutLabels * 5);
  } else if (inputs.length > 0) {
    strengths.push(tr(lang, 'Alla formulärfält har korrekta etiketter', 'All form fields have correct labels'));
  }

  // Check for required field indicators
  const requiredFields = $('input[required], textarea[required], select[required]');
  if (requiredFields.length > 0) {
    const hasAriaRequired = requiredFields.filter((_, field) => {
      return $(field).attr('aria-required') === 'true';
    }).length;
    
    if (hasAriaRequired < requiredFields.length) {
      issues.push({
        type: 'info',
        message: tr(lang, 'Obligatoriska fält saknar aria-required', 'Required fields missing aria-required'),
        recommendation: tr(lang, 'Lägg till aria-required="true" på obligatoriska fält för bättre tillgänglighet.', 'Add aria-required="true" on required fields for better accessibility.')
      });
      score -= 3;
    }
  }

  // 4. Link accessibility
  const links = $('a');
  const linksWithoutText = links.filter((_, link) => {
    const text = $(link).text().trim();
    const ariaLabel = $(link).attr('aria-label');
    const title = $(link).attr('title');
    return !text && !ariaLabel && !title;
  }).length;

  if (linksWithoutText > 0) {
    issues.push({
      type: 'error',
      message: tr(lang, `${linksWithoutText} länkar saknar beskrivande text`, `${linksWithoutText} links lack descriptive text`),
      recommendation: tr(lang, 'Alla länkar måste ha beskrivande text eller aria-label så användare förstår vart länken leder.', 'All links must have descriptive text or aria-label so users understand where the link leads.')
    });
    score -= Math.min(15, linksWithoutText * 3);
  }

  // Check for generic link text
  const genericLinkTexts = ['klicka här', 'läs mer', 'here', 'click here', 'more'];
  const linksWithGenericText = links.filter((_, link) => {
    const text = $(link).text().trim().toLowerCase();
    return genericLinkTexts.includes(text);
  }).length;

  if (linksWithGenericText > 3) {
    issues.push({
      type: 'warning',
      message: tr(lang, `${linksWithGenericText} länkar använder generisk text (t.ex. "klicka här")`, `${linksWithGenericText} links use generic text (e.g., "click here")`),
      recommendation: tr(lang, 'Använd beskrivande länktexter som förklarar vart länken leder, t.ex. "Läs mer om tillgänglighet".', 'Use descriptive link texts that explain where the link leads, e.g., "Learn more about accessibility".')
    });
    score -= 5;
  }

  // 5. Button accessibility
  const buttons = $('button, [role="button"]');
  const buttonsWithoutText = buttons.filter((_, btn) => {
    const text = $(btn).text().trim();
    const ariaLabel = $(btn).attr('aria-label');
    return !text && !ariaLabel;
  }).length;

  if (buttonsWithoutText > 0) {
    issues.push({
      type: 'error',
      message: tr(lang, `${buttonsWithoutText} knappar saknar beskrivande text`, `${buttonsWithoutText} buttons lack descriptive text`),
      recommendation: tr(lang, 'Alla knappar måste ha text eller aria-label för att vara tillgängliga.', 'All buttons must have text or aria-label to be accessible.')
    });
    score -= buttonsWithoutText * 5;
  }

  // 6. Language attribute
  const htmlLang = $('html').attr('lang');
  if (!htmlLang) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Språkattribut saknas på HTML-elementet', 'Language attribute missing on HTML element'),
      recommendation: tr(lang, 'Lägg till lang="sv" (eller relevant språkkod) på <html>-taggen för att ange sidans språk.', 'Add a lang attribute (e.g., lang="en") on the <html> tag to declare the page language.')
    });
    score -= 8;
  } else {
    strengths.push(tr(lang, `Språkattribut är satt (${htmlLang})`, `Language attribute is set (${htmlLang})`));
  }

  // 7. ARIA landmarks and structure
  const hasMain = $('main, [role="main"]').length > 0;
  const hasNav = $('nav, [role="navigation"]').length > 0;

  if (!hasMain) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Ingen <main> landmark hittades', 'No <main> landmark found'),
      recommendation: tr(lang, 'Använd <main> för att markera huvudinnehållet på sidan.', 'Use <main> to mark the main content on the page.')
    });
    score -= 7;
  } else {
    strengths.push(tr(lang, 'Huvudinnehåll markerat med <main>', 'Main content marked with <main>'));
  }

  if (!hasNav) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Ingen <nav> landmark hittades', 'No <nav> landmark found'),
      recommendation: tr(lang, 'Använd <nav> för att markera navigationsområden.', 'Use <nav> to mark navigation areas.')
    });
    score -= 3;
  }

  // 8. Skip navigation link
  const hasSkipLink = $('a[href^="#"]').filter((_, link) => {
    const text = $(link).text().toLowerCase();
    return text.includes('skip') || text.includes('hoppa');
  }).length > 0;

  if (!hasSkipLink) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Ingen "hoppa till huvudinnehåll"-länk hittades', 'No "skip to main content" link found'),
      recommendation: tr(lang, 'Lägg till en länk överst på sidan som låter tangentbordsanvändare hoppa direkt till huvudinnehållet.', 'Add a link at the top of the page that allows keyboard users to skip directly to the main content.')
    });
    score -= 3;
  }

  // 9. Color and contrast (basic check)
  // Check for inline styles that might cause contrast issues
  const elementsWithInlineColors = $('[style*="color"]').length;
  if (elementsWithInlineColors > 10) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Många inline-stilar för färger upptäckta', 'Many inline color styles detected'),
      recommendation: tr(lang, 'Kontrollera färgkontrasten manuellt för att säkerställa WCAG 2.1 AA-compliance (4.5:1 för normal text).', 'Manually check color contrast to ensure WCAG 2.1 AA compliance (4.5:1 for normal text).')
    });
  }

  // 10. Keyboard navigation
  const focusableElements = $('a, button, input, select, textarea, [tabindex]');
  const negativeTabindex = $('[tabindex^="-"]').length;
  
  if (negativeTabindex > 0) {
    issues.push({
      type: 'warning',
      message: tr(lang, `${negativeTabindex} element har negativ tabindex`, `${negativeTabindex} elements have negative tabindex`),
      recommendation: tr(lang, 'Undvik tabindex="-1" på element som ska vara åtkomliga via tangentbord.', 'Avoid tabindex="-1" on elements that should be keyboard accessible.')
    });
    score -= 5;
  }

  if (focusableElements.length > 0) {
    strengths.push(tr(lang, `${focusableElements.length} navigerbara element för tangentbord`, `${focusableElements.length} keyboard-focusable elements`));
  }

  // 11. Video and audio accessibility
  const videos = $('video');
  const videoWithoutCaptions = videos.filter((_, video) => {
    return $(video).find('track[kind="captions"], track[kind="subtitles"]').length === 0;
  }).length;

  if (videoWithoutCaptions > 0) {
    issues.push({
      type: 'warning',
      message: tr(lang, `${videoWithoutCaptions} videor saknar textning`, `${videoWithoutCaptions} videos lack captions`),
      recommendation: tr(lang, 'Lägg till textningsspår (<track kind="captions">) för alla videor.', 'Add caption tracks (<track kind="captions">) for all videos.')
    });
    score -= videoWithoutCaptions * 8;
  }

  // 12. Title attribute (often misused)
  const titleAttributes = $('[title]').length;
  if (titleAttributes > 20) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Många title-attribut används', 'Many title attributes used'),
      recommendation: tr(lang, 'Title-attribut är inte tillgängliga på touch-enheter. Använd aria-label eller synlig text istället.', 'Title attributes are not accessible on touch devices. Use aria-label or visible text instead.')
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    strengths
  };
}

async function analyzeSEOEnhanced($: cheerio.CheerioAPI, url: string, requests: any[], headers: any, lang: Lang): Promise<SEOResults> {
  const issues: SEOResults['issues'] = [];
  let score = 100;
  const urlObj = new URL(url);

  // 1. HTTPS & Security
  const isHttps = url.startsWith('https://');
  if (!isHttps) {
    issues.push({
      type: 'error',
      message: tr(lang, 'Webbplatsen använder inte HTTPS', 'The site does not use HTTPS'),
      recommendation: tr(lang, 'Implementera SSL/TLS-certifikat (t.ex. via Let\'s Encrypt). HTTPS är en rankingfaktor och ökar användarförtroendet.', 'Implement an SSL/TLS certificate (e.g., via Let\'s Encrypt). HTTPS is a ranking factor and increases user trust.')
    });
    score -= 15;
  }

  // 2. Check robots.txt and sitemap
  let hasRobotsTxt = false;
  let hasSitemap = false;
  let robotsTxtContent = '';
  
  try {
    const robotsResponse = await axios.get(`${urlObj.origin}/robots.txt`, { timeout: 5000, validateStatus: (s) => s < 500 });
    hasRobotsTxt = robotsResponse.status === 200;
    robotsTxtContent = robotsResponse.data || '';
    
    // Check if robots.txt blocks important resources
    if (robotsTxtContent.includes('Disallow: /')) {
      issues.push({
        type: 'warning',
        message: tr(lang, 'robots.txt blockerar möjligen viktiga resurser', 'robots.txt may block important resources'),
        recommendation: tr(lang, 'Granska robots.txt noga för att säkerställa att viktiga sidor inte blockeras från indexering.', 'Review robots.txt carefully to ensure important pages are not blocked from indexing.')
      });
      score -= 8;
    }
  } catch (error) {
    // robots.txt not found
  }

  if (!hasRobotsTxt) {
    issues.push({
      type: 'info',
      message: tr(lang, 'robots.txt-fil saknas', 'robots.txt file missing'),
      recommendation: tr(lang, 'Skapa en robots.txt-fil för att styra sökbotars indexering och crawlbudget.', 'Create a robots.txt file to control search bot indexing and crawl budget.')
    });
    score -= 3;
  }

  try {
    const sitemapResponse = await axios.get(`${urlObj.origin}/sitemap.xml`, { timeout: 5000, validateStatus: (s) => s < 500 });
    hasSitemap = sitemapResponse.status === 200;
  } catch (error) {
    // Try alternative sitemap locations
    try {
      const altSitemap = await axios.get(`${urlObj.origin}/sitemap_index.xml`, { timeout: 5000, validateStatus: (s) => s < 500 });
      hasSitemap = altSitemap.status === 200;
    } catch (e) {
      // No sitemap found
    }
  }

  if (!hasSitemap) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'XML-sitemap saknas', 'XML sitemap missing'),
      recommendation: tr(lang, 'Skapa en XML-sitemap och referera till den i robots.txt. Detta hjälper sökmotorer att hitta och indexera alla dina sidor.', 'Create an XML sitemap and reference it in robots.txt. This helps search engines find and index all your pages.')
    });
    score -= 8;
  }

  // 3. Load speed analysis
  const loadSpeed = requests.length > 0 ? 
    Math.max(...requests.map(r => r.timestamp)) - Math.min(...requests.map(r => r.timestamp)) : 0;

  if (loadSpeed > 3000) {
    issues.push({
      type: 'warning',
      message: tr(lang, `Initial laddningstid är ${(loadSpeed / 1000).toFixed(1)}s (mål < 3s)`, `Initial load time is ${(loadSpeed / 1000).toFixed(1)}s (target < 3s)`),
      recommendation: tr(lang, 'Optimera bilder, minimera CSS/JS, använd CDN och aktivera caching för snabbare laddning.', 'Optimize images, minify CSS/JS, use a CDN and enable caching for faster loading.')
    });
    score -= Math.min(15, Math.floor((loadSpeed - 3000) / 1000) * 3);
  }

  // 4. Title tag analysis (comprehensive)
  const title = $('title').text().trim();
  const titleLength = title.length;
  
  if (!title || titleLength === 0) {
    issues.push({
      type: 'error',
      message: tr(lang, 'Sidrubrik (title-tagg) saknas helt', 'Page title (title tag) is missing'),
      recommendation: tr(lang, 'Lägg till en unik, beskrivande title-tagg (50-60 tecken) som inkluderar viktiga sökord.', 'Add a unique, descriptive title tag (50-60 characters) that includes important keywords.')
    });
    score -= 20;
  } else {
    // Check title length
    if (titleLength < 30) {
      issues.push({
        type: 'warning',
        message: tr(lang, `Title-taggen är kort (${titleLength} tecken, rekommenderat: 50-60)`, `Title is short (${titleLength} characters, recommended: 50-60)`),
        recommendation: tr(lang, 'Utöka title-taggen med mer beskrivande innehåll och relevanta sökord.', 'Expand the title tag with more descriptive content and relevant keywords.')
      });
      score -= 8;
    } else if (titleLength > 60) {
      issues.push({
        type: 'warning',
        message: tr(lang, `Title-taggen är lång (${titleLength} tecken, rekommenderat: 50-60)`, `Title is long (${titleLength} characters, recommended: 50-60)`),
        recommendation: tr(lang, 'Korta ner title-taggen så den inte kapas i sökresultaten. Prioritera viktiga ord först.', 'Shorten the title tag so it does not get truncated in search results. Prioritize important words first.')
      });
      score -= 5;
    }

    // Check for duplicate words
    const titleWords = title.toLowerCase().split(/\s+/);
    const duplicates = titleWords.filter((word, index) => titleWords.indexOf(word) !== index && word.length > 3);
    if (duplicates.length > 0) {
      issues.push({
        type: 'info',
        message: tr(lang, 'Title-taggen innehåller upprepade ord', 'Title contains repeated words'),
        recommendation: tr(lang, 'Undvik onödig upprepning av ord i title-taggen för bättre effektivitet.', 'Avoid unnecessary word repetition in the title tag for better efficiency.')
      });
    }
  }

  // 5. Meta description analysis (comprehensive)
  const metaDescription = $('meta[name="description"]').attr('content')?.trim();
  const metaDescLength = metaDescription?.length || 0;
  
  if (!metaDescription) {
    issues.push({
      type: 'error',
      message: tr(lang, 'Meta description saknas', 'Meta description is missing'),
      recommendation: tr(lang, 'Skapa en lockande meta description (150-160 tecken) som sammanfattar sidans innehåll och inkluderar en call-to-action.', 'Create a compelling meta description (150-160 characters) that summarizes the page content and includes a call-to-action.')
    });
    score -= 12;
  } else {
    if (metaDescLength < 120) {
      issues.push({
        type: 'warning',
        message: tr(lang, `Meta description är kort (${metaDescLength} tecken, rekommenderat: 150-160)`, `Meta description is short (${metaDescLength} characters, recommended: 150-160)`),
        recommendation: tr(lang, 'Utöka meta description med mer information och fördelar för att öka klickfrekvensen.', 'Expand the meta description with more information and benefits to increase click-through rate.')
      });
      score -= 6;
    } else if (metaDescLength > 160) {
      issues.push({
        type: 'warning',
        message: tr(lang, `Meta description är lång (${metaDescLength} tecken, rekommenderat: 150-160)`, `Meta description is long (${metaDescLength} characters, recommended: 150-160)`),
        recommendation: tr(lang, 'Korta ner meta description så den inte kapas i sökresultaten.', 'Shorten the meta description so it does not get truncated in search results.')
      });
      score -= 4;
    }
  }

  // 6. Heading structure (detailed)
  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const h1Text = h1Elements.first().text().trim();
  
  const headerStructure: string[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    headerStructure.push(el.tagName.toLowerCase());
  });

  if (h1Count === 0) {
    issues.push({
      type: 'error',
      message: tr(lang, 'Ingen H1-rubrik på sidan', 'No H1 heading on page'),
      recommendation: tr(lang, 'Lägg till en H1-rubrik som beskriver sidans huvudinnehåll. Detta är kritiskt för SEO.', 'Add an H1 heading that describes the main content. This is critical for SEO.')
    });
    score -= 15;
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      message: tr(lang, `Flera H1-rubriker hittades (${h1Count} st)`, `Multiple H1 headings found (${h1Count})`),
      recommendation: tr(lang, 'Använd endast en H1-rubrik per sida. Använd H2-H6 för underrubriker.', 'Use only one H1 heading per page. Use H2-H6 for subheadings.')
    });
    score -= 8;
  }

  // Check H1 and title similarity (should be similar but not identical)
  if (h1Text && title) {
    const similarity = h1Text.toLowerCase() === title.toLowerCase();
    if (similarity) {
      issues.push({
        type: 'info',
        message: tr(lang, 'H1 och title-tagg är identiska', 'H1 and title tag are identical'),
        recommendation: tr(lang, 'Överväg att variera formuleringen mellan H1 och title för att fånga fler sökord.', 'Consider varying the wording between H1 and title to capture more keywords.')
      });
    }
  }

  // 7. Image SEO
  const totalImages = $('img').length;
  const imagesWithAlt = $('img[alt]').filter((_, img) => {
    const altText = $(img).attr('alt');
    return !!altText && altText.trim().length > 0;
  }).length;
  const imagesWithoutAlt = totalImages - imagesWithAlt;

  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'warning',
      message: tr(lang, `${imagesWithoutAlt} av ${totalImages} bilder saknar beskrivande alt-text`, `${imagesWithoutAlt} of ${totalImages} images missing descriptive alt text`),
      recommendation: tr(lang, 'Lägg till beskrivande alt-text på alla bilder för bättre SEO och tillgänglighet.', 'Add descriptive alt text to all images for better SEO and accessibility.')
    });
    score -= Math.min(10, imagesWithoutAlt * 2);
  }

  // Check for large images (potential performance issue)
  const imagesWithSrcset = $('img[srcset]').length;
  if (totalImages > 5 && imagesWithSrcset < totalImages * 0.3) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Få bilder använder responsiva bilder (srcset)', 'Few images use responsive images (srcset)'),
      recommendation: tr(lang, 'Använd srcset för att servera olika bildstorlekar baserat på enhetens skärmstorlek.', 'Use srcset to serve different image sizes based on device screen size.')
    });
    score -= 3;
  }

  // 8. Mobile optimization
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;
  const viewportContent = $('meta[name="viewport"]').attr('content');
  
  if (!hasViewportMeta) {
    issues.push({
      type: 'error',
      message: tr(lang, 'Viewport meta-tagg saknas', 'Viewport meta tag is missing'),
      recommendation: tr(lang, 'Lägg till <meta name="viewport" content="width=device-width, initial-scale=1"> för mobilanpassning.', 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile optimization.')
    });
    score -= 15;
  } else if (viewportContent && !viewportContent.includes('width=device-width')) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Viewport meta-tagg har inte optimal konfiguration', 'Viewport meta tag is not optimally configured'),
      recommendation: tr(lang, 'Säkerställ att viewport content inkluderar "width=device-width".', 'Ensure that viewport content includes "width=device-width".')
    });
    score -= 8;
  }

  // 9. Canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Canonical URL saknas', 'Canonical URL is missing'),
      recommendation: tr(lang, 'Lägg till canonical URL för att undvika duplicerat innehåll och konsolidera ranking-signaler.', 'Add a canonical URL to avoid duplicate content and consolidate ranking signals.')
    });
    score -= 4;
  } else {
    try {
      const canonicalUrl = new URL(canonical, url);
      if (canonicalUrl.hostname !== urlObj.hostname) {
        issues.push({
          type: 'warning',
          message: tr(lang, 'Canonical URL pekar på annan domän', 'Canonical URL points to another domain'),
          recommendation: tr(lang, 'Kontrollera att canonical URL är korrekt konfigurerad.', 'Check that the canonical URL is correctly configured.')
        });
        score -= 6;
      }
    } catch (e) {
      // Invalid canonical URL
    }
  }

  // 10. Open Graph & Social Media
  const hasOgTitle = $('meta[property="og:title"]').length > 0;
  const hasOgDescription = $('meta[property="og:description"]').length > 0;
  const hasOgImage = $('meta[property="og:image"]').length > 0;
  const hasTwitterCard = $('meta[name="twitter:card"]').length > 0;

  if (!hasOgTitle || !hasOgDescription || !hasOgImage) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Open Graph-taggar saknas eller ofullständiga', 'Open Graph tags missing or incomplete'),
      recommendation: tr(lang, 'Lägg till Open Graph-taggar (og:title, og:description, og:image) för bättre delning på sociala medier.', 'Add Open Graph tags (og:title, og:description, og:image) for better social media sharing.')
    });
    score -= 5;
  }

  if (!hasTwitterCard) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Twitter Card-metadata saknas', 'Twitter Card metadata is missing'),
      recommendation: tr(lang, 'Lägg till Twitter Card-metadata för optimerade delningar på Twitter/X.', 'Add Twitter Card metadata for optimized sharing on Twitter/X.')
    });
    score -= 3;
  }

  // 11. Structured data (Schema.org)
  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
  const hasMicrodata = $('[itemscope], [itemtype]').length > 0;
  
  if (!hasJsonLd && !hasMicrodata) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Strukturerad data saknas (Schema.org)', 'Structured data missing (Schema.org)'),
      recommendation: tr(lang, 'Implementera JSON-LD structured data för rich snippets i sökresultaten (t.ex. Organization, Article, Product).', 'Implement JSON-LD structured data for rich snippets in search results (e.g., Organization, Article, Product).')
    });
    score -= 8;
  }

  // 12. Internal linking
  const internalLinks = $('a').filter((_, link) => {
    const href = $(link).attr('href');
    if (!href) return false;
    try {
      const linkUrl = new URL(href, url);
      return linkUrl.hostname === urlObj.hostname;
    } catch {
      return href.startsWith('/') || href.startsWith('#');
    }
  }).length;

  if (internalLinks < 3) {
    issues.push({
      type: 'warning',
      message: tr(lang, `Få interna länkar (${internalLinks} st)`, `Few internal links (${internalLinks})`),
      recommendation: tr(lang, 'Lägg till fler interna länkar för att förbättra navigering och distribuera "link juice".', 'Add more internal links to improve navigation and distribute "link juice".')
    });
    score -= 7;
  }

  // 13. URL structure
  const urlLength = url.length;
  if (urlLength > 100) {
    issues.push({
      type: 'info',
      message: tr(lang, 'URL:en är lång', 'The URL is long'),
      recommendation: tr(lang, 'Kortare, beskrivande URL:er är lättare att dela och bättre för SEO.', 'Shorter, descriptive URLs are easier to share and better for SEO.')
    });
    score -= 2;
  }

  // Check for parameters
  if (urlObj.search.length > 0) {
    issues.push({
      type: 'info',
      message: tr(lang, 'URL innehåller query-parametrar', 'URL contains query parameters'),
      recommendation: tr(lang, 'Använd URL rewriting för att skapa rena, SEO-vänliga URL:er när det är möjligt.', 'Use URL rewriting to create clean, SEO-friendly URLs when possible.')
    });
  }

  // 14. Content length
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').length;
  
  if (wordCount < 300) {
    issues.push({
      type: 'warning',
      message: tr(lang, `Lite textinnehåll (${wordCount} ord, rekommenderat: 300+)`, `Low text content (${wordCount} words, recommended: 300+)`),
      recommendation: tr(lang, 'Lägg till mer unikt, relevant innehåll. Längre innehåll tenderar att ranka bättre.', 'Add more unique, relevant content. Longer content tends to rank better.')
    });
    score -= 10;
  }

  // 15. Language declaration
  const htmlLang = $('html').attr('lang');
  if (!htmlLang) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Språkdeklaration saknas i HTML', 'Language declaration missing in HTML'),
      recommendation: tr(lang, 'Lägg till lang-attribut (t.ex. lang="sv") på <html>-taggen.', 'Add a lang attribute (e.g., lang="en") on the <html> tag.')
    });
    score -= 5;
  }

  // 16. Hreflang (for international sites)
  const hasHreflang = $('link[rel="alternate"][hreflang]').length > 0;
  if (!hasHreflang && htmlLang) {
    // Only suggest if language is set (indicates international awareness)
    issues.push({
      type: 'info',
      message: tr(lang, 'Hreflang-taggar saknas', 'Hreflang tags missing'),
      recommendation: tr(lang, 'Om du har internationella versioner, använd hreflang-taggar för att ange språk- och regionvarianter.', 'If you have international versions, use hreflang tags to specify language and regional variants.')
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    technical: {
      loadSpeed: loadSpeed / 1000,
      mobileOptimized: hasViewportMeta,
      httpsEnabled: isHttps,
      hasRobotsTxt,
      hasSitemap
    },
    onPage: {
      hasUniqueTitle: !!title && titleLength > 0,
      hasMetaDescription: !!metaDescription && metaDescLength > 0,
      hasH1: h1Count > 0,
      headerStructure,
      imagesWithAlt,
      totalImages
    },
    issues
  };
}

async function analyzeDesignEnhanced($: cheerio.CheerioAPI, loadTime: number, url: string, lang: Lang): Promise<DesignResults> {
  const issues: DesignResults['issues'] = [];
  let score = 100;

  // 1. Mobile responsiveness (comprehensive)
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;
  const viewportContent = $('meta[name="viewport"]').attr('content');
  const responsive = hasViewportMeta;
  
  if (!responsive) {
    issues.push({
      type: 'error',
      message: tr(lang, 'Webbplatsen saknar viewport meta-tagg', 'The site lacks a viewport meta tag'),
      recommendation: tr(lang, 'Lägg till <meta name="viewport" content="width=device-width, initial-scale=1"> för responsiv design.', 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for responsive design.')
    });
    score -= 20;
  } else if (viewportContent && viewportContent.includes('user-scalable=no')) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Viewport blockerar zoom (user-scalable=no)', 'Viewport blocks zoom (user-scalable=no)'),
      recommendation: tr(lang, 'Tillåt användare att zooma för bättre tillgänglighet.', 'Allow users to zoom for better accessibility.')
    });
    score -= 8;
  }

  // Check for responsive images
  const images = $('img');
  const responsiveImages = $('img[srcset], picture img').length;
  if (images.length > 5 && responsiveImages < images.length * 0.3) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Få bilder är responsiva', 'Few images are responsive'),
      recommendation: tr(lang, 'Använd srcset och picture-element för responsiva bilder.', 'Use srcset and picture elements for responsive images.')
    });
    score -= 5;
  }

  // 2. Load time & performance analysis
  if (loadTime > 5000) {
    issues.push({
      type: 'error',
      message: tr(lang, `Initial laddningstid är mycket hög: ${(loadTime / 1000).toFixed(1)}s`, `Initial load time is very high: ${(loadTime / 1000).toFixed(1)}s`),
      recommendation: tr(lang, 'Kritisk prestandaförbättring behövs: komprimera bilder, minimera CSS/JS, använd lazy loading och CDN.', 'Critical performance improvement needed: compress images, minify CSS/JS, use lazy loading and CDN.')
    });
    score -= Math.min(25, Math.floor((loadTime - 5000) / 1000) * 5);
  } else if (loadTime > 3000) {
    issues.push({
      type: 'warning',
      message: tr(lang, `Laddningstiden är ${(loadTime / 1000).toFixed(1)}s (mål < 3s)`, `Load time is ${(loadTime / 1000).toFixed(1)}s (target < 3s)`),
      recommendation: tr(lang, 'Optimera bilder (WebP-format), minimera och sammanfoga CSS/JS-filer, använd browser caching.', 'Optimize images (WebP format), minify and combine CSS/JS files, use browser caching.')
    });
    score -= Math.min(15, Math.floor((loadTime - 3000) / 1000) * 4);
  }

  // Check for render-blocking resources
  const externalCSS = $('link[rel="stylesheet"]').length;
  const externalScripts = $('script[src]').length;
  
  if (externalCSS > 3) {
    issues.push({
      type: 'info',
      message: tr(lang, `${externalCSS} externa CSS-filer hittades`, `${externalCSS} external CSS files found`),
      recommendation: tr(lang, 'Sammanfoga CSS-filer och inline kritisk CSS för snabbare rendering.', 'Combine CSS files and inline critical CSS for faster rendering.')
    });
    score -= 3;
  }

  if (externalScripts > 5) {
    issues.push({
      type: 'info',
      message: tr(lang, `${externalScripts} externa JavaScript-filer hittades`, `${externalScripts} external JavaScript files found`),
      recommendation: tr(lang, 'Sammanfoga JS-filer, använd async/defer-attribut och lazy-load icke-kritiska scripts.', 'Combine JS files, use async/defer attributes and lazy-load non-critical scripts.')
    });
    score -= 3;
  }

  // 3. Typography & readability
  const paragraphs = $('p');
  const avgTextLength = paragraphs.length > 0 ? 
    paragraphs.toArray().reduce((sum, p) => sum + $(p).text().length, 0) / paragraphs.length : 0;
  
  const typography = {
    readable: avgTextLength < 1000, // Not too long paragraphs
    hierarchy: $('h1, h2, h3').length > 2
  };

  // Check line length
  const hasWideContainers = $('p, div').filter((_, el) => {
    const text = $(el).text().trim();
    return text.length > 0 && !$(el).attr('style')?.includes('max-width');
  }).length;

  if (hasWideContainers > 10) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Textblock kan vara för breda', 'Text blocks may be too wide'),
      recommendation: tr(lang, 'Begränsa textbredd till 60-80 tecken per rad (max-width: 65ch) för optimal läsbarhet.', 'Limit text width to 60-80 characters per line (max-width: 65ch) for optimal readability.')
    });
    score -= 3;
  }

  if (!typography.hierarchy) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Svag typografisk hierarki', 'Weak typographic hierarchy'),
      recommendation: tr(lang, 'Använd rubriker (H1-H6) konsekvent för att skapa tydlig visuell hierarki.', 'Use headings (H1-H6) consistently to create a clear visual hierarchy.')
    });
    score -= 10;
  }

  // Check for font sizes
  const tinyText = $('*').filter((_, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/font-size:\s*(\d+)px/);
    return !!(match && parseInt(match[1]) < 12);
  }).length;

  if (tinyText > 0) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'För liten text upptäckt (< 12px)', 'Small text detected (< 12px)'),
      recommendation: tr(lang, 'Använd minst 16px för body-text för god läsbarhet.', 'Use at least 16px for body text for good readability.')
    });
    score -= 7;
  }

  // 4. Navigation analysis (comprehensive)
  const navElements = $('nav, [role="navigation"], header nav');
  const navLinks = $('nav a, [role="navigation"] a, header nav a');
  
  const navigation = {
    clear: navElements.length > 0,
    accessible: navLinks.length > 0 && navElements.length > 0
  };

  if (!navigation.clear) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Ingen tydlig huvudnavigation hittades', 'No clear main navigation found'),
      recommendation: tr(lang, 'Lägg till en <nav>-element för huvudnavigation. Använd semantic HTML.', 'Add a <nav> element for main navigation. Use semantic HTML.')
    });
    score -= 15;
  } else if (navLinks.length > 15) {
    issues.push({
      type: 'info',
      message: tr(lang, `Många navigationslänkar (${navLinks.length} st)`, `Many navigation links (${navLinks.length})`),
      recommendation: tr(lang, 'Överväg att gruppera länkar i dropdown-menyer eller kategorier för bättre översikt.', 'Consider grouping links in dropdown menus or categories for better overview.')
    });
    score -= 4;
  }

  // Check for mobile menu
  const hasMobileMenu = $('[class*="mobile"], [class*="hamburger"], [class*="menu-toggle"]').length > 0;
  if (responsive && !hasMobileMenu && navLinks.length > 5) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Ingen mobilmeny upptäckt', 'No mobile menu detected'),
      recommendation: tr(lang, 'Implementera en mobilanpassad navigationslösning (hamburger-meny) för bättre användarupplevelse.', 'Implement a mobile-friendly navigation solution (hamburger menu) for better UX.')
    });
    score -= 8;
  }

  // 5. Color contrast (basic analysis)
  // Note: This is a simplified check, full contrast analysis requires rendering
  const colorContrast = {
    sufficient: true,
    ratio: 4.5 // Placeholder - actual calculation would require rendered page
  };

  // Check for potential contrast issues
  const lightTextOnLight = $('[style*="color: white"], [style*="color: #fff"]').filter((_, el) => {
    const bg = $(el).css('background-color') || $(el).parent().css('background-color') || '';
    return bg.includes('white') || bg.includes('#fff') || bg.includes('rgb(255');
  }).length;

  if (lightTextOnLight > 0) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Potentiella kontrastproblem (ljus text på ljus bakgrund)', 'Potential contrast issues (light text on light background)'),
      recommendation: tr(lang, 'Kontrollera färgkontrast manuellt - WCAG kräver minst 4.5:1 för normal text.', 'Manually check color contrast - WCAG requires at least 4.5:1 for normal text.')
    });
    score -= 10;
    colorContrast.sufficient = false;
  }

  // 6. Whitespace & layout
  const hasSections = $('section, article, main > div').length > 0;
  if (!hasSections) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Begränsad innehållsstrukturering', 'Limited content structuring'),
      recommendation: tr(lang, 'Använd <section> och <article> för att strukturera innehåll semantiskt.', 'Use <section> and <article> to structure content semantically.')
    });
    score -= 4;
  }

  // Check for proper spacing
  const headersWithoutMargin = $('h1, h2, h3, h4').filter((_, el) => {
    const style = $(el).attr('style') || '';
    return !style.includes('margin') && $(el).next().length > 0;
  }).length;

  if (headersWithoutMargin > 3) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Rubriker saknar spacing', 'Headings lack spacing'),
      recommendation: tr(lang, 'Lägg till konsekvent spacing runt rubriker för bättre visuell hierarki.', 'Add consistent spacing around headings for better visual hierarchy.')
    });
    score -= 3;
  }

  // 7. CTA & buttons
  const buttons = $('button, [type="submit"], .btn, .button, a[class*="button"]');
  const primaryCTAs = buttons.filter((_, btn) => {
    const classes = $(btn).attr('class') || '';
    return classes.includes('primary') || classes.includes('cta');
  }).length;

  if (buttons.length === 0) {
    issues.push({
      type: 'warning',
      message: tr(lang, 'Inga knappar eller CTA:er hittades', 'No buttons or CTAs found'),
      recommendation: tr(lang, 'Lägg till tydliga call-to-action-knappar för att guida användare till viktiga åtgärder.', 'Add clear call-to-action buttons to guide users to important actions.')
    });
    score -= 12;
  } else if (primaryCTAs === 0 && buttons.length > 0) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Inga primära CTA:er identifierade', 'No primary CTAs identified'),
      recommendation: tr(lang, 'Markera viktiga åtgärder visuellt med primära knappstilar.', 'Mark important actions visually with primary button styles.')
    });
    score -= 5;
  }

  // 8. Images & media
  const imagesCount = $('img').length;
  
  // Check for lazy loading
  const lazyImages = $('img[loading="lazy"]').length;
  if (imagesCount > 5 && lazyImages < imagesCount * 0.5) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Få bilder använder lazy loading', 'Few images use lazy loading'),
      recommendation: tr(lang, 'Lägg till loading="lazy" på bilder nedanför fold för bättre prestanda.', 'Add loading="lazy" on images below the fold for better performance.')
    });
    score -= 4;
  }

  // Check for alt text on images (also important for design/UX)
  const imagesWithoutAlt = $('img').filter((_, img) => {
    const alt = $(img).attr('alt');
    return !alt || alt.trim() === '';
  }).length;

  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'warning',
      message: tr(lang, `${imagesWithoutAlt} bilder saknar alt-text`, `${imagesWithoutAlt} images missing alt text`),
      recommendation: tr(lang, 'Alt-text förbättrar både tillgänglighet och SEO.', 'Alt text improves both accessibility and SEO.')
    });
    score -= Math.min(10, imagesWithoutAlt * 2);
  }

  // 9. Forms (if present)
  const forms = $('form');
  const inputs = $('input, textarea, select');
  
  if (forms.length > 0) {
    // Check for proper form labels
    const inputsWithoutLabels = inputs.filter((_, input) => {
      const type = $(input).attr('type');
      if (type === 'hidden' || type === 'submit') return false;
      
      const id = $(input).attr('id');
      const hasLabel = id && $(`label[for="${id}"]`).length > 0;
      const hasPlaceholder = $(input).attr('placeholder');
      return !hasLabel && !hasPlaceholder;
    }).length;

    if (inputsWithoutLabels > 0) {
      issues.push({
        type: 'warning',
        message: tr(lang, `${inputsWithoutLabels} formulärfält saknar etiketter`, `${inputsWithoutLabels} form fields missing labels`),
        recommendation: tr(lang, 'Lägg till tydliga etiketter på alla formulärfält för bättre UX.', 'Add clear labels to all form fields for better UX.')
      });
      score -= 8;
    }

    // Check for form validation feedback
    const hasValidation = $('[required], [pattern], [min], [max]').length > 0;
    if (!hasValidation && inputs.length > 2) {
      issues.push({
        type: 'info',
        message: tr(lang, 'Formulär saknar HTML5-validering', 'Forms lack HTML5 validation'),
        recommendation: tr(lang, 'Använd HTML5-validering (required, pattern, etc.) för bättre användarupplevelse.', 'Use HTML5 validation (required, pattern, etc.) for better user experience.')
      });
      score -= 4;
    }
  }

  // 10. Footer
  const footer = $('footer, [role="contentinfo"]');
  if (footer.length === 0) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Ingen footer upptäckt', 'No footer detected'),
      recommendation: tr(lang, 'Lägg till en footer med kontaktinformation, länkar och copyright.', 'Add a footer with contact information, links and copyright.')
    });
    score -= 5;
  }

  // 11. Favicon
  const hasFavicon = $('link[rel*="icon"]').length > 0;
  if (!hasFavicon) {
    issues.push({
      type: 'info',
      message: tr(lang, 'Ingen favicon hittades', 'No favicon found'),
      recommendation: tr(lang, 'Lägg till en favicon för bättre varumärkesigenkänning i flikar och bokmärken.', 'Add a favicon for better brand recognition in tabs and bookmarks.')
    });
    score -= 3;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    responsive,
    loadTime: loadTime / 1000,
    colorContrast,
    typography,
    navigation,
    issues
  };
}

function generateSummary(
  overallScore: number, 
  accessibility: AccessibilityResults, 
  seo: SEOResults, 
  design: DesignResults,
  lang: Lang
): string {
  // Determine strongest and weakest areas
  const scores = [
    { area: lang === 'en' ? 'accessibility' : 'tillgänglighet', score: accessibility.score },
    { area: 'SEO', score: seo.score },
    { area: lang === 'en' ? 'design & UX' : 'design & UX', score: design.score }
  ].sort((a, b) => b.score - a.score);

  const strongest = scores[0];
  const weakest = scores[2];

  // Count critical issues
  const criticalIssues = [
    ...accessibility.issues.filter(i => i.type === 'error'),
    ...seo.issues.filter(i => i.type === 'error'),
    ...design.issues.filter(i => i.type === 'error')
  ].length;

  let summary = '';

  if (lang === 'en') {
    if (overallScore >= 85) {
      summary = `Impressive! Your website performs excellently with ${overallScore}/100 points. `;
      summary += `Particularly strong in ${strongest.area} (${strongest.score}/100). `;
      if (weakest.score < 75) {
        summary += `By focusing on ${weakest.area}, you can reach even higher levels of excellence.`;
      } else {
        summary += `Keep up the great work and follow our recommendations to maintain top quality.`;
      }
    } else if (overallScore >= 70) {
      summary = `Good results! Your website scores ${overallScore}/100 with a solid foundation. `;
      summary += `${strongest.area} is your strongest area (${strongest.score}/100). `;
      if (criticalIssues > 0) {
        summary += `There are ${criticalIssues} critical issues that should be prioritized to improve user experience and search visibility.`;
      } else {
        summary += `By improving ${weakest.area}, you can reach top level and increase both conversions and rankings.`;
      }
    } else if (overallScore >= 50) {
      summary = `Acceptable but with potential! Your website scores ${overallScore}/100. `;
      summary += `${strongest.area} performs relatively well (${strongest.score}/100), but ${weakest.area} needs attention (${weakest.score}/100). `;
      if (criticalIssues > 3) {
        summary += `${criticalIssues} critical issues significantly affect UX and SEO. Prioritize these for quick gains.`;
      } else {
        summary += `Focused improvements across accessibility, SEO and design will yield noticeable results for users and search engines.`;
      }
    } else {
      summary = `Major improvements needed. Your website scores ${overallScore}/100 and needs a comprehensive review. `;
      if (criticalIssues > 5) {
        summary += `${criticalIssues} critical issues negatively impact UX, accessibility and search visibility. `;
      }
      summary += `While there are challenges, the potential is significant — systematic improvements will deliver strong results. `;
      summary += `We recommend starting with our prioritized actions for quick wins.`;
    }
  } else {
    if (overallScore >= 85) {
      summary = `Imponerande! Din webbplats presterar excellent med ${overallScore}/100 poäng. `;
      summary += `Särskilt stark inom ${strongest.area} (${strongest.score}/100). `;
      if (weakest.score < 75) {
        summary += `Genom att fokusera på ${weakest.area} kan du nå ännu högre nivåer av excellence.`;
      } else {
        summary += `Fortsätt med det goda arbetet och följ våra rekommendationer för att bibehålla toppkvalitet.`;
      }
    } else if (overallScore >= 70) {
      summary = `Bra resultat! Din webbplats når ${overallScore}/100 poäng med solid grund. `;
      summary += `${strongest.area} är din starkaste sida (${strongest.score}/100). `;
      if (criticalIssues > 0) {
        summary += `Det finns ${criticalIssues} kritiska problem som bör åtgärdas prioritet för att förbättra användarupplevelsen och söksynligheten.`;
      } else {
        summary += `Genom att förbättra ${weakest.area} kan du nå toppnivå och öka både konverteringar och sökrankningar.`;
      }
    } else if (overallScore >= 50) {
      summary = `Godkänt men utvecklingspotential! Din webbplats får ${overallScore}/100 poäng. `;
      summary += `${strongest.area} fungerar relativt bra (${strongest.score}/100), men ${weakest.area} behöver uppmärksamhet (${weakest.score}/100). `;
      if (criticalIssues > 3) {
        summary += `${criticalIssues} kritiska problem påverkar användarupplevelsen och SEO betydligt. Prioritera dessa för snabba resultat.`;
      } else {
        summary += `Fokuserade förbättringar inom tillgänglighet, SEO och design kommer ge märkbara resultat för både användare och sökmotorer.`;
      }
    } else {
      summary = `Stort förbättringsbehov. Din webbplats når ${overallScore}/100 poäng och behöver en omfattande genomgång. `;
      if (criticalIssues > 5) {
        summary += `${criticalIssues} kritiska problem påverkar användarupplevelsen, tillgängligheten och söksynligheten negativt. `;
      }
      summary += `Även om det finns utmaningar är potentialen stor - systematiska förbättringar kommer ge dramatiska resultat. `;
      summary += `Vi rekommenderar att börja med våra prioriterade åtgärder för snabba vinster.`;
    }
  }

  return summary;
}

function extractPriorityIssues(
  accessibility: AccessibilityResults, 
  seo: SEOResults, 
  design: DesignResults,
  lang: Lang
): string[] {
  interface PriorityIssue {
    category: string;
    message: string;
    priority: number; // Higher = more critical
  }

  const allIssues: PriorityIssue[] = [];

  // Weight critical issues by impact
  const impactKeywords = {
    'https': 20,
    'viewport': 18,
    'title': 17,
    'h1': 16,
    'meta description': 15,
    'alt': 14,
    'label': 14,
    'lang': 13,
    'sitemap': 12,
    'robots': 11,
    'navigation': 10,
    'laddning': 15,
    'load': 15,
    'prestanda': 14,
    'performance': 14,
    'mobil': 13,
    'mobile': 13
  };

  // Add accessibility issues
  accessibility.issues.forEach(issue => {
    let priority = issue.type === 'error' ? 10 : issue.type === 'warning' ? 5 : 2;
    
    // Boost priority based on keywords
    for (const [keyword, boost] of Object.entries(impactKeywords)) {
      if (issue.message.toLowerCase().includes(keyword)) {
        priority += boost;
        break;
      }
    }
    
    allIssues.push({
      category: lang === 'en' ? 'Accessibility' : 'Tillgänglighet',
      message: issue.message,
      priority
    });
  });

  // Add SEO issues
  seo.issues.forEach(issue => {
    let priority = issue.type === 'error' ? 10 : issue.type === 'warning' ? 5 : 2;
    
    for (const [keyword, boost] of Object.entries(impactKeywords)) {
      if (issue.message.toLowerCase().includes(keyword)) {
        priority += boost;
        break;
      }
    }
    
    allIssues.push({
      category: 'SEO',
      message: issue.message,
      priority
    });
  });

  // Add design issues
  design.issues.forEach(issue => {
    let priority = issue.type === 'error' ? 10 : issue.type === 'warning' ? 5 : 2;
    
    for (const [keyword, boost] of Object.entries(impactKeywords)) {
      if (issue.message.toLowerCase().includes(keyword)) {
        priority += boost;
        break;
      }
    }
    
    allIssues.push({
      category: lang === 'en' ? 'Design' : 'Design',
      message: issue.message,
      priority
    });
  });

  // Sort by priority and return top issues
  return allIssues
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)
    .map(issue => `${issue.category}: ${issue.message}`);
}

function extractQuickWins(
  accessibility: AccessibilityResults, 
  seo: SEOResults, 
  design: DesignResults,
  lang: Lang
): string[] {
  interface QuickWin {
    action: string;
    effort: number; // 1 = very easy, 5 = moderate
    impact: number; // 1-10 scale
    score: number;  // Combined score (higher = better quick win)
  }

  const quickWins: QuickWin[] = [];

  // Define quick wins with effort and impact ratings
  const potentialWins = [
    {
      condition: () => accessibility.issues.some(i => i.message.toLowerCase().includes('alt')),
      action: tr(lang, 'Lägg till beskrivande alt-text på alla bilder', 'Add descriptive alt text to all images'),
      effort: 2,
      impact: 8
    },
    {
      condition: () => accessibility.issues.some(i => i.message.toLowerCase().includes('språk') || i.message.toLowerCase().includes('lang')),
      action: tr(lang, 'Lägg till lang="sv" attribut på HTML-elementet', 'Add a lang attribute to the HTML element'),
      effort: 1,
      impact: 6
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('meta description')),
      action: tr(lang, 'Skapa lockande meta description (150-160 tecken)', 'Create a compelling meta description (150-160 characters)'),
      effort: 2,
      impact: 9
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('title') && i.type === 'error'),
      action: tr(lang, 'Lägg till eller förbättra sidrubrik (title-tagg)', 'Add or improve the page title (title tag)'),
      effort: 1,
      impact: 10
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('robots.txt')),
      action: tr(lang, 'Skapa robots.txt för bättre crawling', 'Create robots.txt for better crawling'),
      effort: 1,
      impact: 5
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('sitemap')),
      action: tr(lang, 'Generera och publicera XML-sitemap', 'Generate and publish an XML sitemap'),
      effort: 2,
      impact: 7
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('canonical')),
      action: tr(lang, 'Lägg till canonical URL-taggar', 'Add canonical URL tags'),
      effort: 1,
      impact: 6
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('open graph') || i.message.toLowerCase().includes('social')),
      action: tr(lang, 'Implementera Open Graph-taggar för social delning', 'Implement Open Graph tags for social sharing'),
      effort: 2,
      impact: 7
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('h1')),
      action: tr(lang, 'Lägg till eller optimera H1-rubrik', 'Add or optimize the H1 heading'),
      effort: 1,
      impact: 8
    },
    {
      condition: () => design.issues.some(i => i.message.toLowerCase().includes('viewport') && i.type === 'error'),
      action: tr(lang, 'Lägg till viewport meta-tagg för mobilanpassning', 'Add a viewport meta tag for mobile optimization'),
      effort: 1,
      impact: 10
    },
    {
      condition: () => design.issues.some(i => i.message.toLowerCase().includes('favicon')),
      action: tr(lang, 'Skapa och lägg till favicon', 'Create and add a favicon'),
      effort: 1,
      impact: 4
    },
    {
      condition: () => accessibility.issues.some(i => i.message.toLowerCase().includes('label') || i.message.toLowerCase().includes('etikett')),
      action: tr(lang, 'Lägg till etiketter på alla formulärfält', 'Add labels to all form fields'),
      effort: 2,
      impact: 7
    },
    {
      condition: () => design.issues.some(i => i.message.toLowerCase().includes('lazy')),
      action: tr(lang, 'Implementera lazy loading för bilder', 'Implement lazy loading for images'),
      effort: 2,
      impact: 8
    },
    {
      condition: () => seo.issues.some(i => i.message.toLowerCase().includes('strukturerad data') || i.message.toLowerCase().includes('schema')),
      action: tr(lang, 'Lägg till Schema.org structured data (JSON-LD)', 'Add Schema.org structured data (JSON-LD)'),
      effort: 3,
      impact: 8
    },
    {
      condition: () => accessibility.issues.some(i => i.message.toLowerCase().includes('main') || i.message.toLowerCase().includes('landmark')),
      action: tr(lang, 'Använd semantic HTML (<main>, <nav>, <footer>)', 'Use semantic HTML (<main>, <nav>, <footer>)'),
      effort: 2,
      impact: 6
    }
  ];

  // Evaluate all potential quick wins
  potentialWins.forEach(win => {
    if (win.condition()) {
      const score = (win.impact * 2) - win.effort; // Formula: Higher impact, lower effort = better
      quickWins.push({
        action: win.action,
        effort: win.effort,
        impact: win.impact,
        score
      });
    }
  });

  // Sort by score (best quick wins first) and return top 5-7
  return quickWins
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(win => win.action);
}
