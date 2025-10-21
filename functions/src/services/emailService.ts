import * as nodemailer from 'nodemailer';
import * as functions from 'firebase-functions';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Configure email transporter
function createTransporter(): nodemailer.Transporter {
  const config: EmailConfig = {
    host: functions.config().email?.smtp_host || 'smtp.gmail.com',
    port: parseInt(functions.config().email?.smtp_port || '587'),
    secure: functions.config().email?.smtp_secure === 'true',
    auth: {
      user: functions.config().email?.smtp_user || '',
      pass: functions.config().email?.smtp_pass || ''
    }
  };

  return nodemailer.createTransport(config);
}

export async function sendEmailReport(
  recipientEmail: string, 
  websiteUrl: string, 
  reportBuffer: Buffer
): Promise<void> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'PULSE by Athlas',
      address: functions.config().email?.from_address || 'noreply@athlas.se'
    },
    to: recipientEmail,
    subject: `Din webbanalys för ${websiteUrl} är klar!`,
    html: generateEmailHTML(websiteUrl),
    attachments: [
      {
        filename: `athlas-webbanalys-${new Date().toISOString().split('T')[0]}.pdf`,
        content: reportBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Report email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email report');
  }
}

export async function sendWelcomeEmail(
  recipientEmail: string, 
  name: string,
  websiteUrl: string
): Promise<void> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'PULSE by Athlas',
      address: functions.config().email?.from_address || 'hello@athlas.se'
    },
    to: recipientEmail,
    subject: `Tack ${name}! Din webbanalys är påväg`,
    html: generateWelcomeEmailHTML(name, websiteUrl)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
  }
}

function generateEmailHTML(websiteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Din webbanalys är klar!</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        
        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .content {
            margin: 20px 0;
        }
        
        .content p {
            margin: 15px 0;
        }
        
        .highlight {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
            margin: 20px 0;
        }
        
        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            color: white;
        }
        
        .cta-button {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 15px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 0.9em;
            color: #666;
        }
        
        .social-links {
            text-align: center;
            margin: 20px 0;
        }
        
        .social-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Din PULSE analys är klar!</h1>
            <p>Professionell webbanalys av <strong>${websiteUrl}</strong></p>
        </div>

        <div class="content">
            <p>Hej!</p>
            
            <p>Tack för att du använde vår webbanalysverktyg. Vi har genomfört en omfattande analys av din webbplats och sammanställt resultaten i en detaljerad rapport.</p>
            
            <div class="highlight">
                <strong>📎 Din rapport finns bifogad som PDF-fil</strong><br>
                Rapporten innehåller detaljerad analys inom:
                <ul>
                    <li>🔍 Tillgänglighet (WCAG-compliance)</li>
                    <li>🚀 SEO & Sökmotoroptimering</li>
                    <li>🎨 Design & Användarupplevelse</li>
                </ul>
            </div>
            
            <p>I rapporten hittar du:</p>
            <ul>
                <li>Totalbetyg och sammanfattning</li>
                <li>Detaljerade rekommendationer för förbättringar</li>
                <li>Prioriterade åtgärder för snabba resultat</li>
                <li>Konkreta steg för att implementera förbättringarna</li>
            </ul>
        </div>

        <div class="cta-section">
            <h3>Behöver du hjälp med implementeringen?</h3>
            <p>PULSE by Athlas hjälper dig att genomföra förbättringarna snabbt och effektivt. Vi kombinerar spetskompetens inom utveckling, design, AI och digital marknadsföring.</p>
            <a href="mailto:hello@athlas.se" class="cta-button">Boka kostnadsfri konsultation</a>
        </div>

        <div class="footer">
            <p>Denna rapport är genererad av PULSE by Athlas. Vi hoppas att du finner den värdefull för din webbplats utveckling!</p>
            
            <div class="social-links">
                <a href="https://athlas.se">Besök vår hemsida</a> |
                <a href="mailto:hello@athlas.se">Kontakta oss</a>
            </div>
            
            <p style="font-size: 0.8em; text-align: center; margin-top: 20px;">
                <em>PULSE by Athlas - Nordisk tech- och kreativ byrå</em><br>
                Vi levererar snabbt, personligt och med hög kvalitet, utan att det ska kosta en förmögenhet.
            </p>
        </div>
    </div>
</body>
</html>`;
}

function generateWelcomeEmailHTML(name: string, websiteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tack för ditt intresse!</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .content {
            margin: 20px 0;
        }
        
        .highlight {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tack ${name}! 👋</h1>
            <p>PULSE analyserar nu <strong>${websiteUrl}</strong></p>
        </div>

        <div class="content">
            <p>Hej ${name}!</p>
            
            <p>Tack för att du använder vårt webbanalysverktyg. Vi håller nu på att genomföra en omfattande analys av din webbplats.</p>
            
            <div class="highlight">
                <strong>✅ Vad händer nu?</strong><br>
                Vi analyserar din webbplats inom tillgänglighet, SEO och design. Du får en detaljerad rapport med konkreta förbättringsförslag skickad till din e-post inom några minuter.
            </div>
            
            <p>I väntan på rapporten kan du fundera på:</p>
            <ul>
                <li>Vilka mål har du med din webbplats?</li>
                <li>Vilka utmaningar upplever dina besökare?</li>
                <li>Hur skulle förbättrad prestanda påverka din verksamhet?</li>
            </ul>
            
            <p>Vi på PULSE by Athlas hjälper företag att maximera sin digitala potential genom smart teknik, kreativ design och strategisk rådgivning.</p>
        </div>

        <div class="footer">
            <p><strong>PULSE by Athlas</strong> - Nordisk tech- och kreativ byrå</p>
            <p>Vi levererar snabbt, personligt och med hög kvalitet.</p>
        </div>
    </div>
</body>
</html>`;
}
