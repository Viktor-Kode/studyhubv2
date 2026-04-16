import * as React from 'react';
import { Html, Head, Body, Container, Text, Section, Heading, Link } from '@react-email/components';

export function WelcomeEmail({ name = 'there' }: { name?: string }) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to StudyHelp!</Heading>
          <Section>
            <Text style={text}>Hello {name},</Text>
            <Text style={text}>
              Welcome to StudyHelp! We're thrilled to have you join our community of learners.
              Our mission is to make studying more effective and collaborative for everyone.
            </Text>
            <Text style={text}>
              Get started by exploring your dashboard and creating your first study session.
            </Text>
            <Link href="https://www.studyhelp.site/dashboard" style={link}>
              Go to Dashboard
            </Link>
          </Section>
          <Text style={footer}>
            © 2026 StudyHelp. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const link = {
  color: '#275af5',
  fontSize: '16px',
  textDecoration: 'none',
  display: 'block',
  textAlign: 'center' as const,
  margin: '40px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '32px',
};
