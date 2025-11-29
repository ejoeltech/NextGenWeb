# Conference Module Documentation

## Overview

The Conference Module has been successfully integrated into the NextGen Community website. This comprehensive system allows for conference management, pre-registration, QR code generation, and attendance tracking.

## Features Implemented

### 1. Frontend Pages

#### Conference Listing (`/conferences`)
- Displays all published conferences in a glassmorphic card layout
- Shows conference title, date, time, venue, and description
- Indicates upcoming vs past events
- Responsive grid layout
- Links to individual conference detail pages

#### Conference Detail (`/conference/:id`)
- Full conference information display
- Banner image
- Date, time, venue, and address
- Description
- Speakers list (if available)
- Agenda/Schedule (if available)
- Event guidelines
- Pre-registration button

#### Registration Form (`/conference/:id/register`)
- Pre-registration form with all required fields:
  - Full Name
  - Email
  - Phone
  - Age
  - State
  - School/Organization
  - Attendance Type (Physical/Virtual)
  - Consent checkbox
- Form validation
- Automatic QR code generation upon registration

#### Confirmation Page (`/conference/:id/confirmation`)
- Displays registration confirmation
- Shows generated QR code
- Displays unique attendee code
- Download QR code option
- Links back to conferences or home

### 2. Backend API

#### Conference Routes (`/api/conferences`)
- `GET /api/conferences` - Get all published conferences (public)
- `GET /api/conferences?status=all` - Get all conferences (admin)
- `GET /api/conferences/:id` - Get single conference
- `POST /api/conferences` - Create conference (protected)
- `PUT /api/conferences/:id` - Update conference (protected)
- `DELETE /api/conferences/:id` - Delete conference (protected)

#### Registration Routes (`/api/registrations`)
- `POST /api/registrations/register` - Register for conference (public)
- `GET /api/registrations/conference/:id` - Get registrations (protected)
- `GET /api/registrations/conference/:id?checked_in=true` - Get check-ins (protected)
- `POST /api/registrations/checkin` - Check in attendee (protected)
- `POST /api/registrations/verify` - Verify QR code (protected)
- `GET /api/registrations/export/:id` - Export to CSV (protected)

### 3. Admin Panel Features

#### Conference Management
- **List View**: See all conferences with status indicators
- **Create Conference**: Full form with all fields
- **Edit Conference**: Update existing conferences
- **Delete Conference**: Remove unpublished conferences
- **View Registrations**: See all registrants for a conference
- **Export CSV**: Download registrations as CSV

#### Attendance Scanner
- **Camera Integration**: Use device camera to scan QR codes
- **Real-time Scanning**: Automatic QR code detection
- **Check-in Processing**: Marks attendees as checked in
- **Duplicate Prevention**: Prevents double check-ins
- **Check-in List**: View all checked-in attendees
- **Export Functionality**: Export attendance list to CSV

### 4. Database Schema

#### `conferences` Table
- `id` (PK)
- `title`
- `description`
- `date`
- `time`
- `venue`
- `address`
- `banner` (image URL)
- `speakers` (JSON array)
- `agenda` (JSON array)
- `guidelines`
- `status` (draft/published)
- `created_at`
- `updated_at`

#### `registrations` Table
- `id` (PK)
- `conference_id` (FK)
- `fullname`
- `email`
- `phone`
- `age`
- `state`
- `organization`
- `attendance_type` (Physical/Virtual)
- `qr_code_path`
- `attendee_code` (unique)
- `checked_in` (boolean)
- `checkin_time`
- `created_at`

### 5. QR Code System

- **Generation**: Automatic QR code generation on registration
- **Format**: PNG images stored in `/uploads/qrcodes/`
- **Data Structure**: JSON containing attendee_code, conference_id, email
- **Download**: Users can download their QR code
- **Scanning**: Admin can scan QR codes using device camera
- **Verification**: System verifies QR code and checks in attendee

### 6. Integration Points

- **Navigation**: Added "Conferences" link to main navigation
- **Admin Sidebar**: Added "Conferences" and "Attendance Scanner" sections
- **Theme Consistency**: All pages use the same glassmorphic design
- **Responsive Design**: Works on all devices
- **Error Handling**: Comprehensive error handling throughout

## Usage Guide

### For Admins

1. **Create a Conference**:
   - Go to Admin Panel → Conferences
   - Click "New Conference"
   - Fill in all details
   - Set status to "Published" to make it visible
   - Save

2. **Manage Registrations**:
   - Click "View Registrations" on any conference
   - See all registered attendees
   - Export to CSV if needed

3. **Check-in Attendees**:
   - Go to Admin Panel → Attendance Scanner
   - Select a conference
   - Click "Start Camera"
   - Point camera at attendee's QR code
   - System automatically checks them in

### For Users

1. **Browse Conferences**:
   - Visit `/conferences` page
   - View all upcoming events

2. **Register**:
   - Click on a conference
   - Click "Pre-Register Now"
   - Fill out the form
   - Submit

3. **Get QR Code**:
   - After registration, you'll see your QR code
   - Download and save it
   - Bring it to the event for check-in

## Technical Details

### Dependencies Added
- `qrcode` - For QR code generation
- `jsQR` (CDN) - For QR code scanning in admin panel

### File Structure
```
backend/
  routes/
    conferences.js      # Conference CRUD
    registrations.js    # Registration & QR codes
  uploads/
    qrcodes/           # Generated QR codes

frontend/
  conferences.html              # Listing page
  conference-detail.html        # Detail page
  conference-register.html      # Registration form
  conference-confirmation.html  # Confirmation page

admin/
  index.html  # Updated with conference sections
  script.js   # Conference management & scanner
```

### API Authentication
- Public endpoints: Conference listing, detail, registration
- Protected endpoints: All admin functions require JWT token
- Token stored in localStorage for admin panel

## Security Features

- JWT authentication for admin functions
- SQL injection protection (parameterized queries)
- Input validation on all forms
- Duplicate registration prevention
- Double check-in prevention
- File upload validation

## Future Enhancements

Potential improvements:
- Email notifications on registration
- SMS reminders
- Multiple conference dates
- Waitlist functionality
- Payment integration
- Certificate generation
- Analytics dashboard

## Support

For issues or questions:
- Check server logs: `pm2 logs nextgen`
- Verify database tables exist
- Ensure QR code directory has write permissions
- Check camera permissions for scanner

---

**Module Status**: ✅ Fully Implemented and Tested

