# Gandhi Capital Tracker

A comprehensive management system for Gandhi Capital venture capital operations, including deal pipeline, limited partners, portfolio companies, and investor communications.

## High-level Strategy and Goal

The Gandhi Capital Tracker platform serves as a comprehensive management system for Gandhi Capital, providing:

1. **Deal Pipeline Management** - Track startups from sourcing through investment
2. **Limited Partner (LP) Management** - Maintain investor relationships and communications  
3. **Portfolio Company Tracking** - Monitor investments and performance
4. **Automated Communications** - Email campaigns and investor updates
5. **Survey & Voting System** - Gather LP feedback on investment opportunities
6. **Event Management** - Coordinate investor dinners and meetings

The system emphasizes automation, data-driven decision making, and seamless communication between fund managers, limited partners, and portfolio companies.

## Admin Authentication

### Current Setup

The admin panel uses a role-based authentication system with the following tiers:

#### Automatic Admin Access (No Password Required)
- **General Partners (GP)**: Full admin access based on email match with LP records
- **Venture Partners (VP)**: Full admin access based on email match with LP records

#### Password-Required Access
- **Limited Partners (LP)**: Must enter admin password to access admin features
- **Guest Users**: Must enter admin password to access admin features

#### Configuration
- **Password Storage**: Configurable via environment variable `NEXT_PUBLIC_ADMIN_PASSWORD`
- **Session Management**: 24-hour cookie-based authentication for password-authenticated users
- **Development Mode**: Auto-authentication in development environment
- **Default Password**: `gandhicapital2024` (when no environment variable is set)

### Changing the Admin Password

To change the admin password:

1. **Via Environment Variable** (Recommended):
   - Set `NEXT_PUBLIC_ADMIN_PASSWORD=your_new_secure_password` in your environment
   - Restart the application
   - The new password takes effect immediately

2. **Via Admin Panel**:
   - Navigate to Admin Settings in the admin panel
   - Use the "Change Admin Password" feature
   - Follow the instructions to update the environment variable

### Security Features

- **Role-based Access**: General Partners and Venture Partners bypass password authentication
- **Limited Partner Protection**: Limited Partners must enter admin password to access admin functions
- Passwords must be at least 8 characters long
- Authentication is remembered for 24 hours per device
- All admin pages use the same unified authentication system
- Automatic logout after session expiry

## Changes Implemented

### Authentication System Updates
- **Unified Password Management**: Consolidated different hardcoded passwords across admin pages
- **Environment Variable Support**: Added `NEXT_PUBLIC_ADMIN_PASSWORD` configuration
- **Admin Settings Panel**: Added dedicated settings section for password management
- **Backwards Compatibility**: System falls back to default password if no environment variable is set
- **Security Improvements**: Added minimum password length requirements and confirmation validation

### Admin Panel Features
- **Portfolio Companies Management**: Comprehensive tracking with financial metrics and export capabilities
- **Deal Pipeline**: Complete deal lifecycle management from sourcing to investment
- **LP Communication**: Automated email campaigns and survey systems
- **Event Management**: Calendar integration and dinner coordination
- **Quarterly Statistics**: Investment performance tracking and reporting
- **Founder Outreach**: AI-powered icebreaker generation and Lemlist integration
- **Deal Sharing**: Secure public sharing of deal information via encrypted links

### Technical Infrastructure
- **Database Integration**: Neon PostgreSQL with proper SQL query handling
- **Email Automation**: Lemlist integration for campaign management
- **AI Integration**: OpenAI-powered content generation
- **Export Functionality**: CSV exports for portfolio and LP data
- **Responsive Design**: Mobile-friendly admin interface

### Deal Summary & Sharing Features
- **AI-Generated Summaries**: Create professional executive-level investment summaries using GenAI
- **PDF Export**: Generate beautifully formatted PDF reports with company details and analysis
- **Email Integration**: Send summaries directly to co-investors and stakeholders via Gmail integration
- **Customizable Templates**: Edit AI-generated content and customize summaries before sharing
- **Professional Formatting**: Clean, professional layout suitable for institutional investors

### Recent Updates
- **Field Generalization**: Renamed database fields and UI references for better generalization:
  - `quang_excited_note` → `excitement_note` 
  - `why_good_fit_for_cto_fund` → `why_good_fit`
  - All UI text updated from "Why Quang is excited" to "Why we're excited"
- **Code Refactoring**: Created shared components for deal displays to reduce code duplication between public and private views
- **Admin Authentication Enhancement**: Added role-based access where General Partners and Venture Partners get automatic admin access without requiring a password
- **Public Deal Sharing Fix**: Fixed issue where public deal sharing pages were inaccessible in private browsing mode or for non-authenticated users by optimizing the authentication context for public routes
- **AI-Powered Deal Summaries**: Added comprehensive deal summary generation with GenAI integration, PDF export, and email sharing capabilities for stakeholder communication

## Architecture and Technical Decisions

### Frontend Architecture
- **Next.js 15**: App router with TypeScript and React
- **Shadcn/UI**: Component library for consistent design
- **Client-Side State**: SWR for data fetching and caching
- **Form Handling**: React Hook Form with Zod validation

### Backend Services
- **Database**: Neon PostgreSQL for reliable data persistence
- **Authentication**: Cookie-based session management
- **API Structure**: RESTful endpoints with proper error handling
- **File Storage**: Integrated file upload and management

### Integration Strategy
- **Email Marketing**: Lemlist for automated campaigns
- **AI Services**: OpenAI for content generation and analysis
- **Calendar**: Event management and scheduling integration
- **Export Systems**: CSV generation for data portability

### Security Considerations
- **Environment-based Configuration**: Secure password management
- **Session Security**: HTTPOnly cookies with proper expiration
- **Input Validation**: Comprehensive form and API validation
- **CORS Protection**: Proper cross-origin request handling

### Development Practices
- **TypeScript**: Strict typing with null checks and indexed access protection
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Code Organization**: Modular component structure with shared utilities
- **Performance**: Optimized queries and caching strategies

The system prioritizes security, usability, and maintainability while providing comprehensive functionality for venture capital operations management.