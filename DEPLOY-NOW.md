# 🚀 Deploy PULSE by Athlas till Firebase

Allt är färdigt för deployment! Följ dessa steg:

## 1. Konfigurera Firebase Projekt

```bash
# Lista tillgängliga projekt
firebase projects:list

# Sätt aktivt projekt (ersätt PROJECT-ID med ditt projekt)
firebase use PROJECT-ID

# ELLER skapa nytt projekt
firebase projects:create athlas-leadmagnet
firebase use athlas-leadmagnet
```

## 2. Sätt Environment Variables

Skapa `.env.local` fil:
```bash
cp env.example .env.local
```

Fyll i med dina Firebase credentials från Firebase Console.

## 3. Konfigurera Email (Firebase Functions)

```bash
# Sätt email konfiguration
firebase functions:config:set email.smtp_host="smtp.gmail.com"
firebase functions:config:set email.smtp_port="587"
firebase functions:config:set email.smtp_secure="false"
firebase functions:config:set email.smtp_user="din-email@gmail.com"
firebase functions:config:set email.smtp_pass="ditt-app-password"
firebase functions:config:set email.from_address="noreply@athlas.se"
```

## 4. Deploy!

```bash
firebase deploy
```

## Kontrollera att allt fungerar:

1. ✅ Frontend är byggt (`out/` mappen finns)
2. ✅ Functions är byggda (`functions/lib/` mappen finns)
3. ✅ Firebase projekt är konfigurerat
4. ✅ Email inställningar är satta

## Status

- ✅ Frontend kod: Komplett och testad
- ✅ Firebase Functions: Komplett analysmotor
- ✅ PDF rapportgenerering: Implementerad
- ✅ Email funktionalitet: Konfigurerad
- ✅ GDPR & säkerhet: Implementerat
- ✅ Build process: Fungerar

**Allt är klart för deployment! 🎉**
