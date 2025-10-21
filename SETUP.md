
# Athlas Lead Magnet - Snabbstart Guide

## 🚀 Snabbstart (5-10 minuter)

### 1. Firebase Projekt Setup

```bash
# Installera Firebase CLI
npm install -g firebase-tools

# Logga in
firebase login

# Initiera Firebase i projektmappen
firebase init
```

**Välj följande tjänster:**
- ✅ Firestore Database
- ✅ Functions
- ✅ Hosting

**Inställningar:**
- Firestore rules: `firestore.rules` (redan skapad)
- Functions språk: **TypeScript**
- Hosting public directory: `out`
- Single-page app: **Yes**

### 2. Environment Configuration

```bash
# Skapa din .env.local fil
cp env.example .env.local

# Redigera .env.local med dina Firebase credentials
nano .env.local
```

**Hitta dina Firebase credentials:**
1. Gå till [Firebase Console](https://console.firebase.google.com)
2. Välj ditt projekt
3. Klicka på ⚙️ → Project settings
4. Scrolla ner till "Your apps" → Web apps
5. Kopiera konfigurationen

### 3. E-post Konfiguration

```bash
# Konfigurera SMTP (Gmail example)
firebase functions:config:set email.smtp_host="smtp.gmail.com"
firebase functions:config:set email.smtp_port="587"
firebase functions:config:set email.smtp_secure="false"
firebase functions:config:set email.smtp_user="din-email@gmail.com"
firebase functions:config:set email.smtp_pass="ditt-app-password"
firebase functions:config:set email.from_address="noreply@athlas.se"
```

**Gmail App Password:**
1. Aktivera 2-Factor Authentication på ditt Google konto
2. Gå till Google Account settings
3. Security → App passwords
4. Generera nytt app password för "Mail"

### 4. Installation och Deploy

```bash
# Installera dependencies
npm install
cd functions && npm install && cd ..

# Deploy till Firebase
./deploy.sh
```

## 🔧 Utvecklingsmiljö

```bash
# Starta utvecklingsserver
npm run dev

# I separat terminal - starta Firebase emulators
firebase emulators:start
```

Öppna [http://localhost:3000](http://localhost:3000)

## 📝 Checklista efter deployment

### ✅ Grundläggande funktionalitet
- [ ] Lead capture form fungerar
- [ ] Website analysis körs utan fel
- [ ] PDF rapport genereras
- [ ] E-post skickas korrekt
- [ ] Responsiv design på mobil/tablet

### ✅ Säkerhet och prestanda
- [ ] HTTPS aktiverat (automatiskt via Firebase)
- [ ] GDPR notice visas
- [ ] Rate limiting fungerar
- [ ] Firestore rules konfigurerade
- [ ] Function timeout inställt korrekt

### ✅ Analytics och monitoring
- [ ] Firebase Analytics aktiverat
- [ ] Error tracking konfigurerat
- [ ] Performance monitoring aktiverat

## 🛠️ Vanliga problem och lösningar

### Problem: Function timeout
```bash
# Öka timeout i firebase.json
"functions": {
  "runtime": "nodejs18",
  "timeout": "540s"
}
```

### Problem: CORS errors
```bash
# Kontrollera Firebase hosting configuration
# Se till att rewrite rules är korrekt konfigurerade
```

### Problem: E-post skickas inte
```bash
# Kontrollera function config
firebase functions:config:get

# Testa SMTP inställningar
# Kontrollera Gmail app password
```

### Problem: Memory errors i functions
```bash
# Öka memory allocation
"functions": {
  "runtime": "nodejs18", 
  "memory": "2GB"
}
```

## 📊 Monitoring och underhåll

### Loggar
```bash
# Realtids function logs
firebase functions:log --only api

# Hosting logs
firebase hosting:channel:list
```

### Prestanda
```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse https://your-domain.web.app

# Bundle analyzer
npm install --save-dev @next/bundle-analyzer
```

### Säkerhet
```bash
# Uppdatera dependencies regelbundet
npm audit
npm update

# Kontrollera Firestore security rules
firebase firestore:rules:get
```

## 🎯 Optimeringar för produktion

### 1. CDN och Caching
- Firebase Hosting har automatisk CDN
- Konfigurera cache headers för statiska assets

### 2. Database optimering
- Indexera oft-använda queries
- Sätt upp automatisk cleanup av gamla analyser

### 3. Function optimering
- Warm-up funktioner för att undvika cold starts
- Connection pooling för database

### 4. Monitoring
- Sätt upp alerts för höga kostnader
- Övervaka error rates
- Performance metrics

## 📈 Nästa steg

### Lead Quality Improvements
- A/B testa formuläret
- Lägg till fler validationer
- Implementera progressive disclosure

### Analysis Enhancements  
- Lägg till fler analysområden
- Implementera batch processing
- Cacha vanliga analyser

### Business Intelligence
- Lead scoring
- Conversion tracking
- ROI metrics

## 🆘 Support

För teknisk support:
1. Kontrollera logs: `firebase functions:log`
2. Kolla Firebase Console för fel
3. Verifiera all konfiguration
4. Kontakta development team

## 🔐 Säkerhet

- Uppdatera dependencies regelbundet
- Övervaka för säkerhetshot
- Backup Firestore data
- Säkerhetspolicy för team access

---

**Lycka till med din lead magnet! 🎉**

*Utvecklad av Athlas för professionell lead generation.*
