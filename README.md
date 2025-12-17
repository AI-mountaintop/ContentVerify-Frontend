# Content Verification System

A modern web application for managing SEO content verification workflows with role-based access control.

## Features

- **Role-Based Access**: SEO Analyst, Content Writer, and Content Verifier roles
- **SEO Keyword Management**: Upload and track SEO keywords for each page
- **Content Management**: Structured content input with META tags, headings, and paragraphs
- **Dynamic Keyword Analysis**: Real-time calculation of keyword frequency, density, and placement
- **Keyword Highlighting**: Visual keyword highlighting for content verifiers
- **Project & Page Management**: Organize content by projects and pages
- **Status Tracking**: Track page status through workflow (draft → pending review → approved/rejected)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts (AuthContext)
├── pages/          # Page components
├── stores/         # Zustand stores
├── mocks/          # Mock data
└── types/          # TypeScript type definitions
```

## User Roles

1. **SEO Analyst**: Upload SEO keywords for pages
2. **Content Writer**: Upload page content (META, headings, paragraphs)
3. **Content Verifier**: Review content with highlighted keywords, approve/reject/request revisions

## Deployment

### Railway

This app is configured for Railway deployment. Simply connect your GitHub repository to Railway and it will automatically deploy.

Environment variables are not required for the basic setup as it uses local state management.

## License

MIT
