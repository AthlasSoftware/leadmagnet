import * as admin from 'firebase-admin';
import validator from 'validator';

export interface LeadData {
  name: string;
  email: string;
  website: string;
}

export async function saveLead(leadData: LeadData): Promise<string> {
  // Validate and sanitize input data
  const sanitizedData = {
    name: validator.escape(leadData.name.trim()),
    email: validator.normalizeEmail(leadData.email.trim()) || '',
    website: leadData.website.trim(),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    source: 'website_analyzer',
    userAgent: '', // Could be added from request headers
    ipAddress: '', // Could be added from request (hashed for privacy)
  };

  // Additional validation
  if (!validator.isLength(sanitizedData.name, { min: 1, max: 100 })) {
    throw new Error('Name must be between 1 and 100 characters');
  }

  if (!validator.isEmail(sanitizedData.email)) {
    throw new Error('Invalid email format');
  }

  if (!validator.isURL(sanitizedData.website, { 
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true
  })) {
    throw new Error('Invalid website URL');
  }

  try {
    // Check if lead already exists (optional duplicate prevention)
    const existingLead = await admin.firestore()
      .collection('leads')
      .where('email', '==', sanitizedData.email)
      .where('website', '==', sanitizedData.website)
      .limit(1)
      .get();

    let leadRef;
    
    if (!existingLead.empty) {
      // Update existing lead with new timestamp
      leadRef = existingLead.docs[0].ref;
      await leadRef.update({
        name: sanitizedData.name,
        timestamp: sanitizedData.timestamp,
        lastActivity: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create new lead
      leadRef = await admin.firestore().collection('leads').add(sanitizedData);
    }

    // Log lead capture event (for analytics)
    await admin.firestore().collection('events').add({
      type: 'lead_captured',
      leadId: leadRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        website: sanitizedData.website,
        source: sanitizedData.source
      }
    });

    return leadRef.id;
  } catch (error) {
    console.error('Error saving lead:', error);
    throw new Error('Failed to save lead data');
  }
}

export async function getLeadStats(): Promise<{
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
}> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalSnapshot, todaySnapshot, weekSnapshot, monthSnapshot] = await Promise.all([
      admin.firestore().collection('leads').get(),
      admin.firestore().collection('leads').where('timestamp', '>=', today).get(),
      admin.firestore().collection('leads').where('timestamp', '>=', weekAgo).get(),
      admin.firestore().collection('leads').where('timestamp', '>=', monthAgo).get()
    ]);

    return {
      totalLeads: totalSnapshot.size,
      leadsToday: todaySnapshot.size,
      leadsThisWeek: weekSnapshot.size,
      leadsThisMonth: monthSnapshot.size
    };
  } catch (error) {
    console.error('Error getting lead stats:', error);
    throw new Error('Failed to retrieve lead statistics');
  }
}
