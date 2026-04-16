import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import React from 'react';

export type EmailTemplate = 'welcome';

export async function renderEmailTemplate(template: EmailTemplate, props: any) {
  let element: React.ReactElement;

  switch (template) {
    case 'welcome':
      element = React.createElement(WelcomeEmail, props);
      break;
    default:
      throw new Error(`Unknown template: ${template}`);
  }

  const html = await render(element);
  return html;
}
