# Photodropper

A webapp that allows you to display photos on a TV screen during a party or social event, by uploading photos to a server.

## Features

- **Slideshow Display**: Animated slideshow of photos with customizable duration
- **Ticker System**: Two-row ticker showing photo and event comments
- **QR Code Upload**: Guests can scan QR codes to upload photos and add comments
- **Admin Panel**: Event management with password protection
- **Real-time Updates**: Polling system for synchronized playback across multiple clients

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit with Redux Persist
- **Authentication**: NextAuth.js with Credentials Provider
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd photodropper
npm install
```

### 2. Environment Configuration

Copy the `.env.local` file and update it with your configuration:

```bash
# Supabase Configuration (for file storage only)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Database URL for Prisma
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Admin Configuration
ADMIN_PASSWORD=photodropper
NEXT_PUBLIC_ADMIN_PASSWORD=photodropper

# App Configuration
PHOTO_UPLOAD_PATH=/path/to/your/photo/storage
PLAYLIST_POLL_INTERVAL_MS=5000
NEXT_PUBLIC_PLAYLIST_POLL_INTERVAL_MS=5000
```

### 3. Database Setup

Create the database schema in Supabase (see `database/schema.sql` for the complete schema).

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── slices/           # Redux slices
│   ├── auth.ts           # NextAuth configuration
│   ├── hooks.ts          # Redux hooks
│   ├── store.ts          # Redux store
│   └── supabase.ts       # Supabase client
└── types/                # TypeScript type definitions
```

## Key Components

- **Redux Store**: Manages application state with persistence
- **NextAuth**: Handles admin authentication
- **Supabase Client**: Database operations
- **Redux Slices**: Separate state management for app, photos, comments, and events

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### State Management

The app uses Redux Toolkit with the following slices:
- `appSlice`: Application state (active event, current indices, etc.)
- `photosSlice`: Photo management
- `commentsSlice`: Comment management  
- `eventsSlice`: Event management

All state is persisted to localStorage using Redux Persist.

## Next Steps

1. Set up Supabase database schema
2. Implement API endpoints
3. Create main display screen
4. Add ticker functionality
5. Implement photo upload system
6. Add admin management interface

## License

This project is licensed under the MIT License.
