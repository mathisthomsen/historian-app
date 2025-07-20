import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import prisma from '@/app/libs/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          // Log failed login attempt
          await logAuthEvent({
            eventType: 'LOGIN_FAILED',
            userId: null,
            email: credentials.email,
            ipAddress: 'unknown',
            userAgent: 'unknown',
            details: { reason: 'invalid_password' }
          });
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // Log failed login attempt due to unverified email
          await logAuthEvent({
            eventType: 'LOGIN_FAILED',
            userId: user.id.toString(),
            email: credentials.email,
            ipAddress: 'unknown',
            userAgent: 'unknown',
            details: { reason: 'email_not_verified' }
          });
          return null;
        }

        // Log successful login
        await logAuthEvent({
          eventType: 'LOGIN_SUCCESS',
          userId: user.id.toString(),
          email: user.email,
          ipAddress: 'unknown',
          userAgent: 'unknown'
        });

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        try {
          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: email,
            subject: 'Sign in to Historian App',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Sign in to Historian App</h2>
                <p>Click the button below to sign in to your account:</p>
                <a href="${url}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Sign In</a>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${url}</p>
                <p>This link will expire in 24 hours.</p>
              </div>
            `,
            text: `Sign in to Historian App\n\nClick this link to sign in: ${url}\n\nThis link will expire in 24 hours.`
          });

          if (error) {
            console.error('Email send error:', error);
            throw new Error('Failed to send email');
          }
        } catch (error) {
          console.error('Email verification error:', error);
          throw new Error('Failed to send verification email');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }: any) {
      // Log sign in event
      await logAuthEvent({
        eventType: 'SIGN_IN',
        userId: user.id,
        email: user.email,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        details: { provider: account?.provider }
      });
      return true;
    },
    async signOut({ token, session }: any) {
      // Log sign out event
      await logAuthEvent({
        eventType: 'SIGN_OUT',
        userId: token?.id,
        email: token?.email,
        ipAddress: 'unknown',
        userAgent: 'unknown'
      });
      return true;
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  events: {
    async createUser({ user }: any) {
      await logAuthEvent({
        eventType: 'USER_CREATED',
        userId: user.id,
        email: user.email,
        ipAddress: 'unknown',
        userAgent: 'unknown'
      });
    },
    async linkAccount({ user, account }: any) {
      await logAuthEvent({
        eventType: 'ACCOUNT_LINKED',
        userId: user.id,
        email: user.email,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        details: { provider: account.provider }
      });
    }
  }
};

// Audit logging function
async function logAuthEvent({ eventType, userId, email, ipAddress, userAgent, details = {} }: {
  eventType: string;
  userId: string | null;
  email: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}) {
  try {
    await prisma.authAuditLog.create({
      data: {
        userId: userId,
        eventType,
        ipAddress,
        userAgent,
        details
      }
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
} 