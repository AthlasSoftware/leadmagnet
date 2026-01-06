import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SupportedLang = 'sv' | 'en';

type Translations = Record<string, any>;

interface I18nContextValue {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  get: (key: string) => any;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const translations: Record<SupportedLang, Translations> = {
  sv: {
    meta: {
      title: 'PULSE by Athlas.io - Gratis Webbanalys',
      description: 'PULSE by Athlas.io - Gratis webbanalys. Få en professionell rapport om din webbplats prestanda inom tillgänglighet, SEO och design',
      keywords: 'webbanalys, SEO, tillgänglighet, webbdesign, PULSE, Athlas, gratis, AI-analys',
      ogTitle: 'PULSE by Athlas.io - Gratis Webbanalys',
      ogDescription: 'Få en professionell rapport om din webbplats prestanda inom tillgänglighet, SEO och design',
      twitterTitle: 'PULSE by Athlas.io - Gratis Webbanalys',
      twitterDescription: 'Få en professionell rapport om din webbplats prestanda inom tillgänglighet, SEO och design',
    },
    common: {
      by: 'av',
      brand: 'Athlas.io',
      contactUs: 'Kontakta oss',
      analyze: 'Analysera',
      cancelAndStartOver: 'Avbryt och börja om',
      back: 'Tillbaka',
      tryAgain: 'Försök igen',
      of100: 'av 100',
    },
    home: {
      heroTagline: 'Professionell webbanalys inom tillgänglighet, SEO och design',
      benefits: ['Professionell rapport på svenska', 'Konkreta förbättringsförslag', 'Prioriterade åtgärder', 'PDF-rapport via email', 'Kostnadsfri analys', 'Direkt resultat'],
      featuresTitle: 'Vad analyserar vi?',
      features: [
        {
          title: 'Tillgänglighet',
          description: 'WCAG-compliance, skärmläsarstöd och universal design',
          items: ['Alt-texter för bilder', 'Tangentbordsnavigation', 'Färgkontraster', 'Skärmläsarvänlighet'],
        },
        {
          title: 'SEO-optimering',
          description: 'Teknisk SEO, on-page optimering och prestanda',
          items: ['Laddningstider', 'Meta-taggar', 'Rubrikstruktur', 'Mobilanpassning'],
        },
        {
          title: 'Design & UX',
          description: 'Användarupplevelse, navigation och visuell design',
          items: ['Responsiv design', 'Navigation', 'Typografi', 'Användarflöden'],
        },
      ],
      footer: {
        about: 'Nordisk tech- och kreativ byrå som kombinerar spetskompetens inom utveckling, design, AI och digital marknadsföring.',
        needHelp: 'Behöver du hjälp med implementeringen?',
        contact: 'Kontakta oss',
        rights: 'Vi levererar snabbt, personligt och med hög kvalitet.',
      },
    },
    leadForm: {
      heading: 'Kom igång med PULSE',
      subheading: 'Fyll i dina uppgifter så analyserar vi din webbplats inom tillgänglighet, SEO och design',
      nameLabel: 'Ditt namn',
      nameRequired: 'Namn är obligatoriskt',
      nameMin: 'Namnet måste vara minst 2 tecken',
      nameMax: 'Namnet får inte vara längre än 100 tecken',
      emailLabel: 'E-postadress',
      emailRequired: 'E-postadress är obligatoriskt',
      emailInvalid: 'Ange en giltig e-postadress',
      emailHelper: 'Vi skickar rapporten hit',
      websiteLabel: 'Din webbplats',
      websiteRequired: 'Webbadress är obligatoriskt',
      websiteMin: 'Ange en giltig webbadress',
      websitePlaceholder: 'exempel.se',
      websiteHelper: 'Vi lägger till https:// automatiskt',
      consentError: 'Du behöver godkänna vår datapolicy',
      consentTextPrefix: 'Jag godkänner att Athlas behandlar mina uppgifter för att göra analysen, och att vi kan kontakta dig. Läs mer på',
      consentPolicy: 'vår datapolicy',
      submitIdle: 'Analysera min webbplats gratis',
      submitLoading: 'Startar analys...',
      toastInvalidUrl: 'Ogiltig webbadress - använd format: exempel.se',
      toastThanks: 'Tack! Analysen startar nu...',
      infoPrivacy: 'Integritet:',
      infoPrivacyText: 'Vi sparar dina uppgifter i max 15 dagar och tar sedan bort dem.',
      whatYouGet: 'Vad får du?',
      features: ['Detaljerad analys inom 3 områden', 'Resultat på mindre än 5 minuter', 'Säker och GDPR-anpassad'],
      areasTitle: 'Analysområden',
      areaAccessibility: 'Tillgänglighet',
      areaAccessibilityDesc: 'WCAG-compliance, skärmläsarstöd, tangentbordsnavigation',
      areaSeo: 'SEO',
      areaSeoDesc: 'Teknisk SEO, meta-taggar, laddningstider, mobilanpassning',
      areaDesign: 'Design & UX',
      areaDesignDesc: 'Responsiv design, navigation, typografi, användarupplevelse',
    },
    analyzer: {
      title: 'PULSE analyserar din webbplats',
      progressSuffix: '% slutfört',
      steps: {
        starting: 'Startar analys...',
        loading: 'Laddar webbsidan...',
        accessibility: 'Analyserar tillgänglighet...',
        seo: 'Kontrollerar SEO...',
        design: 'Utvärderar design & UX...',
        finalizing: 'Slutför rapporten...',
        complete: 'Analysen är klar!',
      },
      errorTitle: 'Analysen misslyckades',
      infoTitle: 'Vad händer nu?',
      infoText: 'Vi går igenom din webbplats med automatiserade verktyg som kontrollerar över 100 olika faktorer inom tillgänglighet, SEO och design. Analysen tar normalt 2-5 minuter att genomföra.',
      cancelAndStartOver: 'Avbryt och börja om',
      toast: {
        invalidUrl: 'Ogiltig webbadress - kontrollera formatet',
        domainNotFound: 'Domänen hittades inte - kontrollera stavningen',
        siteUnreachable: 'Webbplatsen är inte nåbar för tillfället',
        analysisDone: 'Analys klar! Du kan ladda ner din PDF-rapport.',
        tooManyRequests: 'För många analyser - vänta några minuter',
        analysisFailed: 'Analysen misslyckades - försök igen',
        athlasPerfect: 'Athlas.io? Den sidan är redan perfekt! 100/100 😉',
      },
      errors: {
        invalidUrl: 'Ogiltig webbadress. Kontrollera URL:en och försök igen.',
        verifyFailed: 'Kunde inte verifiera domänen',
        domainNotFound: 'Domänen kunde inte hittas. Kontrollera stavningen och försök igen.',
        siteUnreachable: 'Domänen hittades men webbplatsen kunde inte nås just nu. Försök igen senare.',
        analyzeFailed: 'Kunde inte analysera webbplatsen',
        generic: 'Något gick fel under analysen',
        rateLimited: 'För många förfrågningar. Vänta ett par minuter och försök igen.',
      },
    },
    results: {
      reportTitle: 'PULSE Analysrapport',
      proAnalysisFrom: 'Professionell webbanalys från',
      scoreText: {
        excellent: 'Utmärkt',
        good: 'Bra',
        ok: 'Okej',
        needsWork: 'Behöver förbättring',
      },
      summaryAthlas: 'Väldigt vetenskaplig mätning visar: Athlas.io är redan perfekt. 100/100 – inga förbättringar nödvändiga 😉',
      downloadPdf: 'Ladda ner PDF',
      downloadSelectedPdfs: 'Ladda ner valda PDF:er',
      exportCsv: 'Exportera CSV',
      quick: {
        priorityImprovements: 'Prioriterade förbättringar',
        quickWins: 'Snabba förbättringar',
      },
      categories: {
        accessibility: { title: 'Tillgänglighet', description: 'WCAG-compliance och användarnas behov' },
        seo: { title: 'SEO', description: 'Sökmotoroptimering och teknisk prestanda' },
        design: { title: 'Design & UX', description: 'Användarupplevelse och visuell design' },
      },
      detailsTitle: 'Detaljerade resultat',
      strengths: '✓ Styrkor',
      improvements: 'Förbättringsområden',
      recommendation: 'Rekommendation:',
      element: 'Element:',
      seoTech: 'Teknisk SEO',
      onPageSeo: 'On-page SEO',
      techLabels: {
        loadTime: 'Laddningstid:',
        mobile: 'Mobiloptimerad:',
        https: 'HTTPS:',
        robots: 'Robots.txt:',
        sitemap: 'Sitemap:',
        uniqueTitle: 'Unik titel:',
        metaDescription: 'Meta description:',
        h1: 'H1-rubrik:',
        imagesAlt: 'Bilder med alt-text:',
        responsive: 'Responsiv design:',
        colorContrast: 'Färgkontrast:',
        readableType: 'Läsbar typografi:',
        clearHierarchy: 'Tydlig hierarki:',
        clearNav: 'Klar navigation:',
        accessibleNav: 'Tillgänglig navigation:',
      },
      cta: {
        title: 'Vill du öka er konvertering och förbättra resultatet snabbt?',
        text1: 'hjälper dig att genomföra förbättringarna effektivt.',
        text2: 'Vi kombinerar utveckling, design, AI och digital marknadsföring – för mätbara resultat.',
        bookReview: 'Boka kostnadsfri genomgång',
        contactForHelp: 'Kontakta oss för hjälp',
        readMore: 'Läs mer på Athlas.io',
        analyzeNew: 'Analysera ny webbplats',
      },
      toast: {
        pdfDownloaded: 'PDF-rapport nedladdad!',
        simpleDownloaded: 'Enkel rapport nedladdad',
        pdfFailed: 'Kunde inte generera rapporten. Försök igen om ett ögonblick.',
      },
    },
    admin: {
      title: 'Admin',
      tabs: { leads: 'Inkommande Leads', batch: 'Batch-analys' },
      batch: {
        urlInputLabel: 'Ange URL:er (en per rad)',
        startAnalysis: 'Starta Analys',
        stopAnalysis: 'Avbryt',
        analyzing: 'Analyserar...',
        exportCsv: 'Exportera CSV',
        table: { url: 'URL', score: 'Total', seo: 'SEO', access: 'Access', design: 'Design', status: 'Status' },
        status: { pending: 'Väntar', analyzing: 'Körs', completed: 'Klar', failed: 'Fel' },
      },
      onlyAthlasAccess: 'Endast @athlas.io eller @athlas.se-konton har åtkomst.',
      loginGoogle: 'Logga in med Google',
      logout: 'Logga ut',
      loginPrompt: 'Logga in med din @athlas.io eller @athlas.se-adress för att se inkomna leads.',
      table: { name: 'Namn', email: 'E-post', website: 'Website', time: 'Tid' },
      noLeads: 'Inga leads ännu.',
      errors: { loginFailed: 'Kunde inte logga in', logoutFailed: 'Kunde inte logga ut' },
    },
    policy: {
      title: 'Datapolicy',
      subtitle: 'Kort och tydligt om hur vi behandlar dina uppgifter',
      whatCollect: 'Vad samlar vi in?',
      whatCollectText: 'Namn, e-postadress och webbadress för att kunna genomföra analysen och leverera resultat.',
      howLong: 'Hur länge sparas uppgifterna?',
      howLongText: 'Vi sparar uppgifterna i högst 15 dagar. Därefter tas de automatiskt bort.',
      emailUse: 'Vad används e-postadressen till?',
      emailUseText: 'För att skicka analysresultat och för att kunna kontakta dig med relevanta förslag.',
      questions: 'Frågor?',
      questionsText: 'Kontakta oss på hello@athlas.io.',
    },
    langToggle: {
      sv: 'Svenska',
      en: 'English',
      label: 'Språk',
    },
    themeToggle: {
      lighter: 'Ljusare tema',
      darker: 'Mörkare tema',
    },
  },
  en: {
    meta: {
      title: 'PULSE by Athlas.io - Free Website Analysis',
      description: 'PULSE by Athlas.io - Free website analysis. Get a professional report on your site performance for accessibility, SEO, and design',
      keywords: 'website analysis, SEO, accessibility, web design, PULSE, Athlas, free, AI analysis',
      ogTitle: 'PULSE by Athlas.io - Free Website Analysis',
      ogDescription: 'Get a professional report on your site performance for accessibility, SEO, and design',
      twitterTitle: 'PULSE by Athlas.io - Free Website Analysis',
      twitterDescription: 'Get a professional report on your site performance for accessibility, SEO, and design',
    },
    common: {
      by: 'by',
      brand: 'Athlas.io',
      contactUs: 'Contact us',
      analyze: 'Analyze',
      cancelAndStartOver: 'Cancel and start over',
      back: 'Back',
      tryAgain: 'Try again',
      of100: 'of 100',
    },
    home: {
      heroTagline: 'Professional website analysis for accessibility, SEO and design',
      benefits: ['Professional report in English', 'Concrete improvement suggestions', 'Prioritized actions', 'PDF report via email', 'Free analysis', 'Instant results'],
      featuresTitle: 'What do we analyze?',
      features: [
        { title: 'Accessibility', description: 'WCAG compliance, screen reader support and universal design', items: ['Alt text for images', 'Keyboard navigation', 'Color contrast', 'Screen reader friendliness'] },
        { title: 'SEO optimization', description: 'Technical SEO, on‑page optimization and performance', items: ['Load times', 'Meta tags', 'Heading structure', 'Mobile optimization'] },
        { title: 'Design & UX', description: 'User experience, navigation and visual design', items: ['Responsive design', 'Navigation', 'Typography', 'User flows'] },
      ],
      footer: {
        about: 'Nordic tech and creative agency combining expertise in engineering, design, AI and digital marketing.',
        needHelp: 'Need help with implementation?',
        contact: 'Contact us',
        rights: 'We deliver fast, personal and with high quality.',
      },
    },
    leadForm: {
      heading: 'Get started with PULSE',
      subheading: 'Fill in your details and we will analyze your website for accessibility, SEO and design',
      nameLabel: 'Your name',
      nameRequired: 'Name is required',
      nameMin: 'Name must be at least 2 characters',
      nameMax: 'Name cannot exceed 100 characters',
      emailLabel: 'Email address',
      emailRequired: 'Email is required',
      emailInvalid: 'Enter a valid email',
      emailHelper: 'We will send the report here',
      websiteLabel: 'Your website',
      websiteRequired: 'Website is required',
      websiteMin: 'Enter a valid website',
      websitePlaceholder: 'example.com',
      websiteHelper: 'We add https:// automatically',
      consentError: 'You need to accept our data policy',
      consentTextPrefix: 'I agree that Athlas may process my data to perform the analysis, and that we may contact you. Read more in',
      consentPolicy: 'our data policy',
      submitIdle: 'Analyze my website for free',
      submitLoading: 'Starting analysis...',
      toastInvalidUrl: '❌ Invalid URL - use format: example.com',
      toastThanks: '✅ Thanks! The analysis is starting...',
      infoPrivacy: 'Privacy:',
      infoPrivacyText: 'We store your data for at most 15 days and then delete it.',
      whatYouGet: 'What do you get?',
      features: ['Detailed analysis in 3 areas', 'Results in under 5 minutes', 'Secure and GDPR compliant'],
      areasTitle: 'Analysis areas',
      areaAccessibility: 'Accessibility',
      areaAccessibilityDesc: 'WCAG compliance, screen reader support, keyboard navigation',
      areaSeo: 'SEO',
      areaSeoDesc: 'Technical SEO, meta tags, load times, mobile optimization',
      areaDesign: 'Design & UX',
      areaDesignDesc: 'Responsive design, navigation, typography, user experience',
    },
    analyzer: {
      title: 'PULSE is analyzing your website',
      progressSuffix: '% complete',
      steps: {
        starting: 'Starting analysis...',
        loading: 'Loading website...',
        accessibility: 'Analyzing accessibility...',
        seo: 'Checking SEO...',
        design: 'Evaluating design & UX...',
        finalizing: 'Finalizing report...',
        complete: 'Analysis complete!',
      },
      errorTitle: 'The analysis failed',
      infoTitle: 'What happens now?',
      infoText: 'We scan your site with automated tools that check over 100 factors across accessibility, SEO and design. The analysis usually takes 2–5 minutes.',
      cancelAndStartOver: 'Cancel and start over',
      toast: {
        invalidUrl: '❌ Invalid URL - check the format',
        domainNotFound: '🌐 Domain not found - check the spelling',
        siteUnreachable: '⚠️ The site is not reachable right now',
        analysisDone: '🎉 Analysis complete! You can download your PDF report.',
        tooManyRequests: '⏱️ Too many analyses - please wait a few minutes',
        analysisFailed: '❌ The analysis failed - please try again',
        athlasPerfect: '🥳 Athlas.io? That site is already perfect! 100/100 😉',
      },
      errors: {
        invalidUrl: 'Invalid URL. Check it and try again.',
        verifyFailed: 'Could not verify the domain',
        domainNotFound: 'Domain could not be found. Check the spelling and try again.',
        siteUnreachable: 'Domain found but the site could not be reached right now. Please try later.',
        analyzeFailed: 'Could not analyze the website',
        generic: 'Something went wrong during the analysis',
        rateLimited: 'Too many requests. Please wait a few minutes and try again.',
      },
    },
    results: {
      reportTitle: 'PULSE Analysis Report',
      proAnalysisFrom: 'Professional website analysis from',
      scoreText: {
        excellent: 'Excellent',
        good: 'Good',
        ok: 'Okay',
        needsWork: 'Needs improvement',
      },
      summaryAthlas: 'Highly scientific measurement shows: Athlas.io is already perfect. 100/100 – no improvements necessary 😉',
      downloadPdf: 'Download PDF',
      downloadSelectedPdfs: 'Download Selected PDFs',
      exportCsv: 'Export CSV',
      quick: {
        priorityImprovements: 'Priority improvements',
        quickWins: 'Quick wins',
      },
      categories: {
        accessibility: { title: 'Accessibility', description: 'WCAG compliance and user needs' },
        seo: { title: 'SEO', description: 'Search engine optimization and technical performance' },
        design: { title: 'Design & UX', description: 'User experience and visual design' },
      },
      detailsTitle: 'Detailed results',
      strengths: '✓ Strengths',
      improvements: 'Areas for improvement',
      recommendation: 'Recommendation:',
      element: 'Element:',
      seoTech: 'Technical SEO',
      onPageSeo: 'On-page SEO',
      techLabels: {
        loadTime: 'Load time:',
        mobile: 'Mobile optimized:',
        https: 'HTTPS:',
        robots: 'Robots.txt:',
        sitemap: 'Sitemap:',
        uniqueTitle: 'Unique title:',
        metaDescription: 'Meta description:',
        h1: 'H1 heading:',
        imagesAlt: 'Images with alt text:',
        responsive: 'Responsive design:',
        colorContrast: 'Color contrast:',
        readableType: 'Readable typography:',
        clearHierarchy: 'Clear hierarchy:',
        clearNav: 'Clear navigation:',
        accessibleNav: 'Accessible navigation:',
      },
      cta: {
        title: 'Want to increase conversion and improve results quickly?',
        text1: 'helps you implement the improvements efficiently.',
        text2: 'We combine engineering, design, AI and digital marketing – for measurable results.',
        bookReview: 'Book a free review',
        contactForHelp: 'Contact us for help',
        readMore: 'Read more at Athlas.io',
        analyzeNew: 'Analyze another website',
      },
      toast: {
        pdfDownloaded: '✅ PDF report downloaded!',
        simpleDownloaded: '✅ Simple report downloaded',
        pdfFailed: '❌ Could not generate the report. Please try again shortly.',
      },
    },
    admin: {
      title: 'Admin',
      tabs: { leads: 'Incoming Leads', batch: 'Batch Analysis' },
      batch: {
        urlInputLabel: 'Enter URLs (one per line)',
        startAnalysis: 'Start Analysis',
        stopAnalysis: 'Stop',
        analyzing: 'Analyzing...',
        exportCsv: 'Export CSV',
        table: { url: 'URL', score: 'Total', seo: 'SEO', access: 'Access', design: 'Design', status: 'Status' },
        status: { pending: 'Pending', analyzing: 'Running', completed: 'Done', failed: 'Error' },
      },
      onlyAthlasAccess: 'Only @athlas.io or @athlas.se accounts have access.',
      loginGoogle: 'Sign in with Google',
      logout: 'Sign out',
      loginPrompt: 'Sign in with your @athlas.io or @athlas.se address to view incoming leads.',
      table: { name: 'Name', email: 'Email', website: 'Website', time: 'Time' },
      noLeads: 'No leads yet.',
      errors: { loginFailed: 'Could not sign in', logoutFailed: 'Could not sign out' },
    },
    policy: {
      title: 'Data policy',
      subtitle: 'Short and clear information on how we process your data',
      whatCollect: 'What do we collect?',
      whatCollectText: 'Name, email address and website to perform the analysis and deliver results.',
      howLong: 'How long are the details stored?',
      howLongText: 'We store the details for up to 15 days. After that they are automatically deleted.',
      emailUse: 'What is the email address used for?',
      emailUseText: 'To send the analysis results and to contact you with relevant suggestions.',
      questions: 'Questions?',
      questionsText: 'Contact us at hello@athlas.io.',
    },
    langToggle: {
      sv: 'Svenska',
      en: 'English',
      label: 'Language',
    },
    themeToggle: {
      lighter: 'Lighter theme',
      darker: 'Darker theme',
    },
  },
};

function getNested(obj: Translations, path: string): any {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<SupportedLang>('sv');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lang') as SupportedLang | null;
      if (stored === 'sv' || stored === 'en') {
        setLangState(stored);
        return;
      }
    } catch {}

    if (typeof navigator !== 'undefined') {
      const locale = (navigator.language || '').toLowerCase();
      if (locale.startsWith('sv') || locale.endsWith('-se')) {
        setLangState('sv');
      } else {
        setLangState('en');
      }
    } else {
      setLangState('en');
    }
  }, []);

  const setLang = (l: SupportedLang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch {}
  };

  const toggleLang = () => setLangState((prev) => {
    const next = prev === 'sv' ? 'en' : 'sv';
    try { localStorage.setItem('lang', next); } catch {}
    return next as SupportedLang;
  });

  const get = useMemo(() => {
    return (key: string) => {
      const value = getNested(translations[lang], key);
      if (value !== undefined) return value;
      return getNested(translations.sv, key) ?? getNested(translations.en, key);
    };
  }, [lang]);

  const t = useMemo(() => {
    return (key: string) => {
      const value = get(key);
      if (typeof value === 'string') return value;
      // fallback to key when non-string or missing
      return typeof value === 'undefined' ? key : String(value);
    };
  }, [get]);

  const value: I18nContextValue = { lang, setLang, toggleLang, t, get };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}


