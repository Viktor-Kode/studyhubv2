import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/verifyToken';

import { renderEmailTemplate, EmailTemplate } from '@/lib/email/renderer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    // 1. Authenticate the request
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get email data from request body
    const body = await req.json();
    const { to, subject, html: manualHtml, text, template, templateProps } = body;

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing to or subject' }, { status: 400 });
    }

    let finalHtml = manualHtml;

    // 3. Render template if provided
    if (template) {
      try {
        finalHtml = await renderEmailTemplate(template as EmailTemplate, templateProps || {});
      } catch (err: any) {
        return NextResponse.json({ error: `Template error: ${err.message}` }, { status: 400 });
      }
    }

    // 4. Send via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'notifications@studyhelp.site',
      to,
      subject,
      html: finalHtml || `<p>${text || ''}</p>`,
      text: text || '',
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
