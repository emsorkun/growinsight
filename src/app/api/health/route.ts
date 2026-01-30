import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    bigquery: {
      hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'NOT SET',
      hasCredentialsJson: !!process.env.GOOGLE_CREDENTIALS_JSON,
      credentialsJsonLength: process.env.GOOGLE_CREDENTIALS_JSON?.length || 0,
      hasCredentialsFile: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credentialsFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT SET',
    },
    auth: {
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
  };

  // Validate credentials JSON if present
  let credentialsStatus = 'NOT CONFIGURED';
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      if (creds.client_email && creds.private_key) {
        credentialsStatus = `VALID (${creds.client_email})`;
      } else {
        credentialsStatus = 'INVALID: missing client_email or private_key';
      }
    } catch {
      credentialsStatus = 'INVALID: failed to parse JSON';
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credentialsStatus = `FILE PATH: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`;
  }

  return NextResponse.json({
    status: 'ok',
    config: {
      ...config,
      bigquery: {
        ...config.bigquery,
        credentialsStatus,
      },
    },
  });
}
