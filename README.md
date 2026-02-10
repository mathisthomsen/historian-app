This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Historian App

A comprehensive web application for managing historical data, including persons, events, literature, and relationships. Built with Next.js, Prisma, PostgreSQL, and Material-UI.

## Features

- **User Authentication**: Secure login/register with nextAuth
- **Person Management**: Create and manage historical figures with detailed profiles
- **Event Management**: Track historical events with dates, locations, and descriptions
- **Relationship System**: Define and visualize relationships between persons
- **Literature Management**: Organize and sync bibliography with external services
- **Timeline Visualization**: Interactive timeline of events and life events
- **Analytics Dashboard**: Statistics and insights about your historical data
- **Location Tracking**: Geographic data for events and persons
- **Bibliography Sync**: Integration with Zotero and Mendeley

## Architecture

### Technology Stack

- **Frontend**: Next.js 15 with App Router, Material-UI v7, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15+
- **Authentication**: nextAuth
- **Deployment**: Docker Compose with multi-environment support

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL DB │    │   next Auth     │
│   (Port 3000)   │◄──►│   (Port 5432)   │    │                 │
│                 │    │                 │    │                 │
│ - API Routes    │    │ - Users         │    │ - Authentication│
│ - SSR Pages     │    │ - Persons       │    │                 │
│ - Auth System   │    │ - Events        │    │                 │
│ - File Uploads  │    │ - Literature    │    │                 │
└─────────────────┘    │ - Relationships │    └─────────────────┘
                       └─────────────────┘
```

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd historian_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your WorkOS configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create sample data (optional)**
   ```bash
   node create_sample_data.js
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - App: http://localhost:3000

## Authentication Setup

### WorkOS Configuration

1. **Create a WorkOS account** at [workos.com](https://workos.com)
2. **Create a new project** in your WorkOS dashboard
3. **Set up AuthKit** with the following configuration:
   - Redirect URI: `http://localhost:3000/api/auth/callback` (development)
   - Redirect URI: `https://yourdomain.com/api/auth/callback` (production)

### Environment Variables



## Deployment

### Vercel Deployment (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `WORKOS_API_KEY`
   - `WORKOS_CLIENT_ID`
   - `WORKOS_REDIRECT_URI`
   - `WORKOS_COOKIE_PASSWORD`
   - `AUTHKIT_REDIRECT_URI`
3. **Deploy** - Vercel will automatically build and deploy your app

### Docker Deployment

The application supports multiple environments (development, staging, production) using Docker Compose.

#### Quick Start

1. **Set up environment files**
   ```bash
   cp env.staging.example .env.staging
   cp env.production.example .env.production
   # Edit the files with your WorkOS configuration
   ```

2. **Deploy staging environment**
   ```bash
   ./deploy.sh staging up
   ```

3. **Deploy production environment**
   ```bash
   ./deploy.sh production up
   ```

#### Deployment Commands

```bash
# Start environment
./deploy.sh [staging|production] up

# Stop environment
./deploy.sh [staging|production] down

# Restart environment
./deploy.sh [staging|production] restart

# View logs
./deploy.sh [staging|production] logs

# Check status
./deploy.sh [staging|production] status

# Run migrations
./deploy.sh [staging|production] migrate

# Backup database
./deploy.sh [staging|production] backup

# Restore database
./deploy.sh [staging|production] restore backup_file.sql
```

### Environment Ports

| Environment | App Port | PostgreSQL Port |
|-------------|----------|-----------------|
| Development | 3000     | 5432            |
| Staging     | 3001     | 5433            |
| Production  | 3000     | 5432            |

### Production Considerations

1. **SSL/TLS**: Use HTTPS for all production deployments
2. **Database**: Consider using managed PostgreSQL service (Neon, Supabase, AWS RDS)
3. **WorkOS**: Configure production redirect URIs in WorkOS dashboard
4. **Backups**: Regular database backups and monitoring
5. **Monitoring**: Set up logging and monitoring (ELK stack, Prometheus)

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          # SSH to server and run deployment
          ssh user@server "./deploy.sh staging up"
```

### Deployment Pipeline Options

1. **Simple**: Direct deployment with deploy script
2. **Advanced**: GitHub Actions + Docker Registry
3. **Enterprise**: Kubernetes with Helm charts

## Database Schema

### Core Tables

- **users**: User accounts and authentication (linked to WorkOS)
- **persons**: Historical figures and their details
- **events**: Historical events with dates and locations
- **life_events**: Personal events linked to persons
- **relationships**: Connections between persons
- **literature**: Books, papers, and references
- **bibliography_sync**: External service integrations

### Relationships

```
users (1) ── (many) persons
users (1) ── (many) events
users (1) ── (many) literature

persons (1) ── (many) life_events
persons (1) ── (many) relationships
events (1) ── (many) life_events
```

## API Documentation

### Authentication Endpoints

- `GET /api/auth/login` - Redirect to WorkOS hosted UI for login
- `GET /api/auth/register` - Redirect to WorkOS hosted UI for registration
- `GET /api/auth/logout` - User logout
- `GET /api/auth/callback` - WorkOS authentication callback

### Data Endpoints

- `GET /api/persons` - List persons
- `POST /api/persons` - Create person
- `GET /api/persons/[id]` - Get person details
- `PUT /api/persons/[id]` - Update person
- `DELETE /api/persons/[id]` - Delete person

- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
