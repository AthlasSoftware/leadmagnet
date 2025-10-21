# PULSE by Athlas - Webbanalysverktyg

Ett fullständigt produktionsfärdigt leadmagnet-verktyg som analyserar webbplatser inom tillgänglighet, SEO och design.

## Funktioner

- **Lead Capture**: Säker insamling av namn, e-post och webbadress
- **Webbanalys**: Omfattande analys inom:
  - 🔍 **Tillgänglighet**: WCAG-compliance, skärmläsarstöd, färgkontraster
  - 🚀 **SEO**: Teknisk SEO, meta-taggar, laddningstider, mobilanpassning
  - 🎨 **Design & UX**: Responsiv design, navigation, typografi
- **Professionell rapport**: Detaljerad PDF-rapport med konkreta rekommendationer
- **E-post distribution**: Automatisk rapportutskick till användare
- **GDPR-säker**: Säker datahantering enligt GDPR-krav

## Teknikstack

- **Frontend**: Next.js, React, TypeScript, Material-UI, Framer Motion
- **Backend**: Firebase Cloud Functions, Node.js, TypeScript
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting
- **Analys**: Puppeteer, Lighthouse, Cheerio
- **E-post**: Nodemailer
- **PDF**: Puppeteer PDF generation

## Projektstruktur

```
.
├── src/                    # Frontend källkod
│   ├── components/         # React komponenter
│   ├── pages/             # Next.js sidor och API routes
│   ├── types/             # TypeScript definitioner
│   └── utils/             # Hjälpfunktioner
├── functions/             # Firebase Cloud Functions
│   └── src/               
│       ├── services/      # Backend tjänster
│       └── index.ts       # Huvudfunktion
├── firebase.json          # Firebase konfiguration
├── firestore.rules        # Databasregler
└── firestore.indexes.json # Databasindex
```

## Installation och Setup

### 1. Förberedelser

```bash
# Klona projektet
git clone <repository-url>
cd athlas-leadmagnet

# Installera dependencies för frontend
npm install

# Installera dependencies för functions
cd functions
npm install
cd ..
```

### 2. Firebase Setup

```bash
# Installera Firebase CLI
npm install -g firebase-tools

# Logga in på Firebase
firebase login

# Initiera Firebase projekt (välj befintligt projekt eller skapa nytt)
firebase init

# Välj följande tjänster:
# - Firestore
# - Functions
# - Hosting
```

### 3. Environment Configuration

```bash
# Kopiera exempel-filen
cp env.example .env.local

# Redigera .env.local med dina Firebase konfigurationsvärden
# Dessa hittar du i Firebase Console > Project Settings > General
```

### 4. Firebase Functions Configuration

```bash
# Konfigurera e-post inställningar
firebase functions:config:set email.smtp_host="smtp.gmail.com"
firebase functions:config:set email.smtp_port="587"
firebase functions:config:set email.smtp_secure="false"
firebase functions:config:set email.smtp_user="din-email@gmail.com"
firebase functions:config:set email.smtp_pass="ditt-app-lösenord"
firebase functions:config:set email.from_address="noreply@athlas.se"
```

### 5. Utveckling

```bash
# Starta utvecklingsserver för frontend
npm run dev

# I ett annat terminal, starta Firebase emulators
firebase emulators:start

# Öppna http://localhost:3000
```

## Deployment

### Automatisk deployment

```bash
# Bygg och deploya hela applikationen
npm run build
npm run deploy
```

### Manuell deployment

```bash
# Bygg frontend
npm run build

# Deploya till Firebase
firebase deploy
```

## Konfiguration för produktion

### 1. Domän och SSL

- Konfigurera din egen domän i Firebase Hosting
- SSL-certifikat hanteras automatiskt av Firebase

### 2. E-post konfiguration

För produktion, använd en dedikerad e-post tjänst:
- Gmail med App Password
- SendGrid
- Mailgun
- AWS SES

### 3. Säkerhet

- Konfigurera CORS-policies
- Sätt upp rate limiting
- Övervaka användning och kostnader
- Backup av Firestore data

### 4. Analytics och Monitoring

```bash
# Aktivera Firebase Analytics
firebase analytics

# Konfigurera error reporting
firebase crashlytics
```

## API Endpoints

Alla API endpoints är proxade genom Next.js API routes:

- `POST /api/capture-lead` - Sparar lead data
- `POST /api/analyze-website` - Startar webbanalys  
- `POST /api/generate-report` - Genererar och skickar PDF rapport

## Datastruktur

### Leads Collection

```typescript
{
  name: string;
  email: string;
  website: string;
  timestamp: Timestamp;
  source: string;
  userAgent: string;
  ipAddress: string; // hashed för privacy
}
```

### Analyses Collection

```typescript
{
  sessionId: string;
  website: string;
  results: AnalysisResults;
  timestamp: Timestamp;
}
```

## Säkerhet och GDPR

- **Rate limiting**: Förhindrar missbruk
- **Input validering**: Alla inputs sanitizeras
- **HTTPS only**: Krypterad kommunikation
- **Minimal data**: Endast nödvändig data samlas in
- **Automatisk radering**: Gamla analyser raderas automatiskt
- **Consent**: Tydlig information om dataanvändning

## Prestanda

- **Caching**: Intelligenta caching strategier
- **CDN**: Global distribution via Firebase
- **Optimerade bilder**: Automatisk bildoptimering
- **Lazy loading**: Komponentvis laddning
- **Bundle optimization**: Minimala JavaScript bundles

## Monitoring och Underhåll

### Loggar

```bash
# Visa function logs
firebase functions:log

# Visa hosting logs
firebase hosting:channel:deploy preview
```

### Kostnadsoptimering

- Övervaka Firebase användning
- Sätt upp billing alerts
- Optimera function cold starts
- Cache analyser för återkommande webbplatser

## Support och Underhåll

### Vanliga problem

1. **Function timeout**: Öka timeout i firebase.json
2. **Memory issues**: Öka memory allocation för functions
3. **Rate limits**: Justera rate limiting konfiguration
4. **E-post delivery**: Kontrollera SMTP konfiguration

### Uppdateringar

```bash
# Uppdatera dependencies
npm update
cd functions && npm update

# Deploya uppdateringar
firebase deploy
```

## Kontakt

För support eller frågor, kontakta Athlas development team.

## Licens

Detta projekt är utvecklat av Athlas för intern användning som leadmagnet.
