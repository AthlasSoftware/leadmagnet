import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AnalysisResults } from './websiteAnalyzer';

export async function generateReport(website: string, results: AnalysisResults): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  const { accessibility, seo, design, overview } = results;
  const currentDate = new Date().toLocaleDateString('sv-SE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const colors = {
    primary: rgb(0.145, 0.388, 0.922),    // #2563eb
    success: rgb(0.133, 0.773, 0.369),    // #22c55e
    warning: rgb(0.961, 0.620, 0.043),    // #f59e0b
    error: rgb(0.937, 0.267, 0.267),      // #ef4444
    text: rgb(0.118, 0.161, 0.231),       // #1e293b
    textLight: rgb(0.392, 0.455, 0.545),  // #64748b
    white: rgb(1, 1, 1),
    lightGray: rgb(0.886, 0.910, 0.941),  // #e2e8f0
    background: rgb(0.973, 0.980, 0.988), // #f8fafc
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  // PAGE 1: Cover & Overview
  const page1 = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page1.getSize();

  // Header background
  page1.drawRectangle({
    x: 0,
    y: height - 180,
    width: width,
    height: 180,
    color: colors.primary,
  });

  // Title
  page1.drawText('PULSE', {
    x: 50,
    y: height - 90,
    size: 42,
    font: helveticaBold,
    color: colors.white,
  });

  page1.drawText('Webbanalysrapport fran Athlas.io', {
    x: 50,
    y: height - 125,
    size: 14,
    font: helveticaFont,
    color: colors.white,
  });

  // Website info
  let yPos = height - 220;
  page1.drawText('Analyserad webbplats:', {
    x: 50,
    y: yPos,
    size: 13,
    font: helveticaBold,
    color: colors.text,
  });

  yPos -= 25;
  page1.drawText(website.length > 60 ? website.substring(0, 60) + '...' : website, {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: colors.primary,
  });

  yPos -= 20;
  page1.drawText(`Datum: ${currentDate}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: helveticaFont,
    color: colors.textLight,
  });

  // Overall score circle
  yPos -= 80;
  const centerX = width / 2;
  const circleY = yPos;

  page1.drawCircle({
    x: centerX,
    y: circleY,
    size: 50,
    borderColor: colors.lightGray,
    borderWidth: 3,
  });

  page1.drawCircle({
    x: centerX,
    y: circleY,
    size: 45,
    color: getScoreColor(overview.overallScore),
  });

  page1.drawText(overview.overallScore.toString(), {
    x: centerX - 18,
    y: circleY - 12,
    size: 32,
    font: helveticaBold,
    color: colors.white,
  });

  yPos -= 80;
  const scoreLabel = overview.overallScore >= 85 ? 'Utmarkt!' :
                     overview.overallScore >= 70 ? 'Bra resultat!' :
                     overview.overallScore >= 50 ? 'Godkant' : 'Behoer forbattring';
  
  page1.drawText(scoreLabel, {
    x: width / 2 - (scoreLabel.length * 5),
    y: yPos,
    size: 18,
    font: helveticaBold,
    color: colors.text,
  });

  yPos -= 30;
  
  // Summary - split into lines
  const summaryLines = splitTextIntoLines(overview.summary, 70);
  summaryLines.slice(0, 4).forEach(line => {
    page1.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: colors.text,
    });
    yPos -= 15;
  });

  yPos -= 20;

  // Priority Issues
  if (overview.priorityIssues.length > 0 && yPos > 150) {
    page1.drawText('PRIORITERADE FORBATTRINGAR', {
      x: 50,
      y: yPos,
      size: 13,
      font: helveticaBold,
      color: colors.error,
    });
    yPos -= 20;

    overview.priorityIssues.slice(0, 3).forEach((issue, i) => {
      const issueLines = splitTextIntoLines(`${i + 1}. ${issue}`, 65);
      issueLines.slice(0, 2).forEach(line => {
        page1.drawText(line, {
          x: 60,
          y: yPos,
          size: 10,
          font: helveticaFont,
          color: colors.text,
        });
        yPos -= 14;
      });
    });
  }

  // PAGE 2: Accessibility
  const page2 = pdfDoc.addPage([595, 842]);
  yPos = height - 80;

  page2.drawText('TILLGANGLIGHET', {
    x: 50,
    y: yPos,
    size: 22,
    font: helveticaBold,
    color: colors.primary,
  });

  yPos -= 25;
  page2.drawText('Sakertstaller att alla kan anvanda din webbplats.', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: colors.textLight,
  });

  yPos -= 40;

  // Score bar
  page2.drawRectangle({
    x: 50,
    y: yPos - 18,
    width: width - 100,
    height: 18,
    color: colors.lightGray,
  });

  page2.drawRectangle({
    x: 50,
    y: yPos - 18,
    width: ((width - 100) * accessibility.score) / 100,
    height: 18,
    color: getScoreColor(accessibility.score),
  });

  page2.drawText(`${accessibility.score}/100`, {
    x: width - 80,
    y: yPos - 14,
    size: 12,
    font: helveticaBold,
    color: colors.text,
  });

  yPos -= 40;

  // Strengths
  if (accessibility.strengths.length > 0) {
    page2.drawText('STYRKOR', {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaBold,
      color: colors.success,
    });
    yPos -= 20;

    accessibility.strengths.slice(0, 5).forEach(strength => {
      const strengthLines = splitTextIntoLines(`+ ${strength}`, 68);
      strengthLines.slice(0, 2).forEach(line => {
        page2.drawText(line, {
          x: 60,
          y: yPos,
          size: 10,
          font: helveticaFont,
          color: colors.text,
        });
        yPos -= 13;
      });
    });
    yPos -= 10;
  }

  // Issues
  if (accessibility.issues.length > 0) {
    page2.drawText('FORBATTRINGSOMRADEN', {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaBold,
      color: colors.text,
    });
    yPos -= 20;

    accessibility.issues.slice(0, 4).forEach(issue => {
      if (yPos < 120) return;

      const bgColor = issue.type === 'error' ? rgb(1, 0.894, 0.902) :
                      issue.type === 'warning' ? rgb(0.996, 0.953, 0.780) :
                      rgb(0.859, 0.949, 0.988);

      page2.drawRectangle({
        x: 50,
        y: yPos - 55,
        width: width - 100,
        height: 60,
        color: bgColor,
      });

      page2.drawText(issue.message.substring(0, 70), {
        x: 60,
        y: yPos - 15,
        size: 10,
        font: helveticaBold,
        color: colors.text,
      });

      const recLines = splitTextIntoLines(`Rekommendation: ${issue.recommendation}`, 65);
      page2.drawText(recLines[0].substring(0, 70), {
        x: 60,
        y: yPos - 30,
        size: 9,
        font: helveticaFont,
        color: colors.textLight,
      });

      yPos -= 70;
    });
  }

  // PAGE 3: SEO
  const page3 = pdfDoc.addPage([595, 842]);
  yPos = height - 80;

  page3.drawText('SEO', {
    x: 50,
    y: yPos,
    size: 22,
    font: helveticaBold,
    color: colors.primary,
  });

  yPos -= 25;
  page3.drawText('Hjalper din webbplats synas battre i sokresultat.', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: colors.textLight,
  });

  yPos -= 40;

  // SEO Score bar
  page3.drawRectangle({
    x: 50,
    y: yPos - 18,
    width: width - 100,
    height: 18,
    color: colors.lightGray,
  });

  page3.drawRectangle({
    x: 50,
    y: yPos - 18,
    width: ((width - 100) * seo.score) / 100,
    height: 18,
    color: getScoreColor(seo.score),
  });

  page3.drawText(`${seo.score}/100`, {
    x: width - 80,
    y: yPos - 14,
    size: 12,
    font: helveticaBold,
    color: colors.text,
  });

  yPos -= 40;

  // Technical SEO
  page3.drawText('TEKNISK SEO', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: colors.text,
  });
  yPos -= 18;

  const techItems = [
    `- Laddningstid: ${seo.technical.loadSpeed.toFixed(1)}s`,
    `- Mobiloptimerad: ${seo.technical.mobileOptimized ? 'Ja' : 'Nej'}`,
    `- HTTPS: ${seo.technical.httpsEnabled ? 'Ja' : 'Nej'}`,
    `- Robots.txt: ${seo.technical.hasRobotsTxt ? 'Ja' : 'Nej'}`,
    `- Sitemap: ${seo.technical.hasSitemap ? 'Ja' : 'Nej'}`,
  ];

  techItems.forEach(item => {
    page3.drawText(item, {
      x: 60,
      y: yPos,
      size: 10,
      font: helveticaFont,
      color: colors.text,
    });
    yPos -= 13;
  });

  yPos -= 15;

  // On-page SEO
  page3.drawText('ON-PAGE SEO', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: colors.text,
  });
  yPos -= 18;

  const onPageItems = [
    `- Titel: ${seo.onPage.hasUniqueTitle ? 'Ja' : 'Nej'}`,
    `- Meta description: ${seo.onPage.hasMetaDescription ? 'Ja' : 'Nej'}`,
    `- H1: ${seo.onPage.hasH1 ? 'Ja' : 'Nej'}`,
    `- Alt-text: ${seo.onPage.imagesWithAlt}/${seo.onPage.totalImages}`,
  ];

  onPageItems.forEach(item => {
    page3.drawText(item, {
      x: 60,
      y: yPos,
      size: 10,
      font: helveticaFont,
      color: colors.text,
    });
    yPos -= 13;
  });

  yPos -= 20;

  // SEO Issues
  if (seo.issues.length > 0) {
    page3.drawText('FORBATTRINGSOMRADEN', {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaBold,
      color: colors.text,
    });
    yPos -= 20;

    seo.issues.slice(0, 4).forEach(issue => {
      if (yPos < 120) return;

      const bgColor = issue.type === 'error' ? rgb(1, 0.894, 0.902) :
                      issue.type === 'warning' ? rgb(0.996, 0.953, 0.780) :
                      rgb(0.859, 0.949, 0.988);

      page3.drawRectangle({
        x: 50,
        y: yPos - 55,
        width: width - 100,
        height: 60,
        color: bgColor,
      });

      page3.drawText(issue.message.substring(0, 70), {
        x: 60,
        y: yPos - 15,
        size: 10,
        font: helveticaBold,
        color: colors.text,
      });

      const recLines = splitTextIntoLines(`Rekommendation: ${issue.recommendation}`, 65);
      page3.drawText(recLines[0].substring(0, 70), {
        x: 60,
        y: yPos - 30,
        size: 9,
        font: helveticaFont,
        color: colors.textLight,
      });

      yPos -= 70;
    });
  }

  // PAGE 4: Design & UX
  const page4 = pdfDoc.addPage([595, 842]);
  yPos = height - 80;

  page4.drawText('DESIGN & UX', {
    x: 50,
    y: yPos,
    size: 22,
    font: helveticaBold,
    color: colors.primary,
  });

  yPos -= 25;
  page4.drawText('Paverkar hur anvandare interagerar med webbplatsen.', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: colors.textLight,
  });

  yPos -= 40;

  // Design Score bar
  page4.drawRectangle({
    x: 50,
    y: yPos - 18,
    width: width - 100,
    height: 18,
    color: colors.lightGray,
  });

  page4.drawRectangle({
    x: 50,
    y: yPos - 18,
    width: ((width - 100) * design.score) / 100,
    height: 18,
    color: getScoreColor(design.score),
  });

  page4.drawText(`${design.score}/100`, {
    x: width - 80,
    y: yPos - 14,
    size: 12,
    font: helveticaBold,
    color: colors.text,
  });

  yPos -= 40;

  // Technical metrics
  page4.drawText('TEKNISKA MATT', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: colors.text,
  });
  yPos -= 18;

  const designItems = [
    `- Responsiv: ${design.responsive ? 'Ja' : 'Nej'}`,
    `- Laddning: ${design.loadTime.toFixed(1)}s`,
    `- Kontrast: ${design.colorContrast.sufficient ? 'OK' : 'Dalig'}`,
    `- Typografi: ${design.typography.readable ? 'OK' : 'Dalig'}`,
    `- Hierarki: ${design.typography.hierarchy ? 'Ja' : 'Nej'}`,
    `- Navigation: ${design.navigation.clear ? 'Ja' : 'Nej'}`,
  ];

  designItems.forEach(item => {
    page4.drawText(item, {
      x: 60,
      y: yPos,
      size: 10,
      font: helveticaFont,
      color: colors.text,
    });
    yPos -= 13;
  });

  yPos -= 20;

  // Design Issues
  if (design.issues.length > 0) {
    page4.drawText('FORBATTRINGSOMRADEN', {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaBold,
      color: colors.text,
    });
    yPos -= 20;

    design.issues.slice(0, 4).forEach(issue => {
      if (yPos < 120) return;

      const bgColor = issue.type === 'error' ? rgb(1, 0.894, 0.902) :
                      issue.type === 'warning' ? rgb(0.996, 0.953, 0.780) :
                      rgb(0.859, 0.949, 0.988);

      page4.drawRectangle({
        x: 50,
        y: yPos - 55,
        width: width - 100,
        height: 60,
        color: bgColor,
      });

      page4.drawText(issue.message.substring(0, 70), {
        x: 60,
        y: yPos - 15,
        size: 10,
        font: helveticaBold,
        color: colors.text,
      });

      const recLines = splitTextIntoLines(`Rekommendation: ${issue.recommendation}`, 65);
      page4.drawText(recLines[0].substring(0, 70), {
        x: 60,
        y: yPos - 30,
        size: 9,
        font: helveticaFont,
        color: colors.textLight,
      });

      yPos -= 70;
    });
  }

  // PAGE 5: Contact
  const page5 = pdfDoc.addPage([595, 842]);
  
  page5.drawRectangle({
    x: 0,
    y: height - 160,
    width: width,
    height: 160,
    color: colors.primary,
  });

  page5.drawText('Behoer du hjalp?', {
    x: 50,
    y: height - 80,
    size: 28,
    font: helveticaBold,
    color: colors.white,
  });

  page5.drawText('Vi hjalper dig implementera forbattringarna', {
    x: 50,
    y: height - 115,
    size: 13,
    font: helveticaFont,
    color: colors.white,
  });

  yPos = height - 220;

  page5.drawText('Om PULSE by Athlas.io', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: colors.text,
  });

  yPos -= 25;
  const aboutLines = [
    'Vi ar en nordisk tech- och kreativ byra med spetskompetens',
    'inom utveckling, design, AI och digital marknadsforing.',
    '',
    'Vi levererar snabbt, personligt och med hog kvalitet.'
  ];

  aboutLines.forEach(line => {
    page5.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: colors.textLight,
    });
    yPos -= 15;
  });

  yPos -= 20;

  page5.drawText('KONTAKT', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: colors.primary,
  });
  yPos -= 18;

  page5.drawText('E-post: hello@athlas.io', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: colors.text,
  });
  yPos -= 15;

  page5.drawText('Webb: athlas.io', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: colors.text,
  });

  // Footer
  page5.drawText(`(c) ${new Date().getFullYear()} PULSE by Athlas.io`, {
    x: width / 2 - 80,
    y: 50,
    size: 9,
    font: helveticaFont,
    color: colors.textLight,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function splitTextIntoLines(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}
