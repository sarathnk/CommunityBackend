# Community App API Documentation

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Organizations](#organizations)
- [User Profile](#user-profile)
- [Roles](#roles)
- [Members](#members)
- [Events](#events)
- [Announcements](#announcements)
- [Elections](#elections)
- [Chats](#chats)
- [Messages](#messages)
- [Notifications](#notifications)
- [Dashboard](#dashboard)
- [Event Financials](#event-financials)
- [Income](#income)
- [Subscription](#subscription)
- [Payment](#payment)
- [Upload](#upload)
- [Logo](#logo)

---

## Getting Started

### Base URL
```
http://localhost:4000
```

### Authentication
Most endpoints require authentication using Bearer token. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

The Postman collection automatically manages tokens using environment variables. After successful login or OTP verification, the token is automatically saved to `{{authToken}}`.

### Postman Setup

1. **Import Collection**: Import `CommunityApp.postman_collection.json` into Postman
2. **Import Environment**: Import `CommunityApp.postman_environment.json`
3. **Select Environment**: Choose "Community App - Local" from the environment dropdown
4. **Start Testing**: The token will be automatically set after authentication requests

---

## Authentication

### Check Phone Availability
Check if a phone number is available for registration.

**Endpoint**: `GET /api/auth/check-phone`

**Auth Required**: No

**Query Parameters**:
- `phone` (string, required) - Phone number to check (e.g., +919876543210)

**Response**:
```json
{
  "available": true
}
```

---

### Login with Password
Authenticate using phone number and password.

**Endpoint**: `POST /api/auth/login`

**Auth Required**: No

**Request Body**:
```json
{
  "phone": "+919876543210",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Token is automatically saved to environment variable `authToken`.

---

### Request OTP
Request an OTP for phone-based authentication.

**Endpoint**: `POST /api/auth/otp/request`

**Auth Required**: No

**Request Body**:
```json
{
  "phone": "+919876543210"
}
```

**Response**:
```json
{
  "message": "OTP sent",
  "code": "123456"
}
```

**Note**: In testing, the OTP is returned in the response.

---

### Verify OTP
Verify OTP and receive authentication token.

**Endpoint**: `POST /api/auth/otp/verify`

**Auth Required**: No

**Request Body**:
```json
{
  "phone": "+919876543210",
  "code": "123456"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Token is automatically saved to environment variable `authToken`.

---

### Refresh Token
Refresh an existing JWT token to extend session.

**Endpoint**: `POST /api/auth/refresh`

**Auth Required**: No (but requires existing token)

**Request Body**:
```json
{
  "token": "{{authToken}}"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Organizations

### Register Organization
Register a new organization with admin user.

**Endpoint**: `POST /api/organizations/register`

**Auth Required**: No

**Request Body**:
```json
{
  "name": "Tech Community Hub",
  "type": "Tech",
  "description": "A vibrant community for tech enthusiasts",
  "logoUrl": null,
  "themeColor": "#4F46E5",
  "place": "San Francisco, CA",
  "admin": {
    "phone": "+919876543210",
    "otp": "123456",
    "fullName": "John Doe",
    "photoUrl": null
  },
  "roles": [
    {
      "name": "Admin",
      "description": "Full access",
      "permissions": ["*"],
      "isDefault": true
    },
    {
      "name": "Member",
      "description": "Standard member",
      "permissions": ["read"],
      "isDefault": true
    }
  ]
}
```

**Response**:
```json
{
  "organization": {
    "id": "org-id",
    "name": "Tech Community Hub",
    "type": "Tech",
    "themeColor": "#4F46E5",
    "logoUrl": null,
    "place": "San Francisco, CA"
  },
  "user": {
    "id": "user-id",
    "email": null,
    "fullName": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### List Organizations
List all organizations (super admin sees all, regular users see their own).

**Endpoint**: `GET /api/organizations`

**Auth Required**: Yes

**Response**:
```json
{
  "organizations": [
    {
      "id": "org-id",
      "name": "Tech Community Hub",
      "type": "Tech",
      "description": "A vibrant community",
      "logoUrl": null,
      "themeColor": "#4F46E5",
      "place": "San Francisco, CA",
      "createdAt": "2025-11-05T00:00:00.000Z",
      "_count": {
        "users": 50,
        "events": 10,
        "announcements": 5
      }
    }
  ]
}
```

---

### Update Organization
Update organization details.

**Endpoint**: `PUT /api/organizations/update`

**Auth Required**: Yes

**Request Body**:
```json
{
  "name": "Tech Community Hub - Updated",
  "description": "Updated description",
  "themeColor": "#10B981",
  "place": "New York, NY"
}
```

**Response**:
```json
{
  "organization": {
    "id": "org-id",
    "name": "Tech Community Hub - Updated",
    "type": "Tech",
    "description": "Updated description",
    "logoUrl": null,
    "themeColor": "#10B981",
    "place": "New York, NY"
  }
}
```

---

### Switch Organization (Super Admin)
Switch organization context. Only available for super admins.

**Endpoint**: `POST /api/organizations/switch`

**Auth Required**: Yes (Super Admin only)

**Request Body**:
```json
{
  "organizationId": "org-id-here"
}
```

**Response**:
```json
{
  "organization": {
    "id": "org-id",
    "name": "Organization Name",
    "type": "Tech",
    "description": "Description",
    "logoUrl": null,
    "themeColor": "#4F46E5",
    "place": "Location",
    "_count": {
      "users": 50,
      "events": 10,
      "announcements": 5
    }
  },
  "token": "new-token-with-switched-org-context"
}
```

---

## User Profile

### Get Current User
Get current authenticated user details.

**Endpoint**: `GET /api/me`

**Auth Required**: Yes

**Response**:
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "Admin",
  "permissions": ["*"],
  "organization": {
    "id": "org-id",
    "name": "Tech Community Hub",
    "place": "San Francisco, CA"
  }
}
```

---

### Get User Organizations
Get organizations for current user.

**Endpoint**: `GET /api/me/organizations`

**Auth Required**: Yes

**Query Parameters**:
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20, max: 100)

**Response**:
```json
{
  "organizations": [
    {
      "id": "org-id",
      "name": "Tech Community Hub",
      "type": "Tech",
      "description": "A vibrant community",
      "logoUrl": null,
      "themeColor": "#4F46E5",
      "place": "San Francisco, CA",
      "createdAt": "2025-11-05T00:00:00.000Z",
      "updatedAt": "2025-11-05T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

## Roles

### List Roles
List all roles with pagination and search.

**Endpoint**: `GET /api/roles`

**Auth Required**: Yes

**Query Parameters**:
- `limit` (number, optional) - Items per page (default: 20, max: 100)
- `cursor` (string, optional) - Cursor for pagination
- `q` (string, optional) - Search query for name or description
- `organizationId` (string, optional) - Filter by organization ID (super admin only)

**Response**:
```json
{
  "items": [
    {
      "id": "role-id",
      "name": "Admin",
      "description": "Full access",
      "permissions": ["*"],
      "isDefault": true,
      "color": null,
      "createdAt": "2025-11-05T00:00:00.000Z"
    }
  ],
  "nextCursor": "cursor-value-or-null"
}
```

---

### Create Role
Create a new role.

**Endpoint**: `POST /api/roles`

**Auth Required**: Yes (requires `roles.write` permission)

**Request Body**:
```json
{
  "name": "Moderator",
  "description": "Can moderate content and manage events",
  "permissions": ["events.write", "announcements.write", "members.read"],
  "color": "#F59E0B"
}
```

**Response**:
```json
{
  "id": "role-id",
  "name": "Moderator",
  "description": "Can moderate content and manage events",
  "permissions": ["events.write", "announcements.write", "members.read"],
  "isDefault": false,
  "color": "#F59E0B",
  "organizationId": "org-id",
  "createdAt": "2025-11-05T00:00:00.000Z",
  "updatedAt": "2025-11-05T00:00:00.000Z"
}
```

---

### Update Role
Update an existing role.

**Endpoint**: `PUT /api/roles/:roleId`

**Auth Required**: Yes (requires `roles.write` permission)

**URL Parameters**:
- `roleId` (string, required) - Role ID

**Request Body**:
```json
{
  "name": "Moderator",
  "description": "Updated description",
  "permissions": ["events.write", "announcements.write", "members.read", "elections.write"],
  "color": "#EF4444"
}
```

**Response**:
```json
{
  "id": "role-id",
  "name": "Moderator",
  "description": "Updated description",
  "permissions": ["events.write", "announcements.write", "members.read", "elections.write"],
  "isDefault": false,
  "color": "#EF4444",
  "organizationId": "org-id",
  "createdAt": "2025-11-05T00:00:00.000Z",
  "updatedAt": "2025-11-05T00:00:00.000Z"
}
```

---

### Delete Role
Delete a role.

**Endpoint**: `DELETE /api/roles/:roleId`

**Auth Required**: Yes (requires `roles.write` permission)

**URL Parameters**:
- `roleId` (string, required) - Role ID

**Response**: 204 No Content

---

## Members

### List Members
List all members with pagination and search.

**Endpoint**: `GET /api/members`

**Auth Required**: Yes

**Query Parameters**:
- `limit` (number, optional) - Items per page (default: 20, max: 100)
- `cursor` (string, optional) - Cursor for pagination
- `q` (string, optional) - Search by name or phone

**Response**:
```json
{
  "items": [
    {
      "id": "user-id",
      "fullName": "John Doe",
      "phoneNumber": "+919876543210",
      "photoUrl": null,
      "role": "Admin"
    }
  ],
  "nextCursor": "cursor-value-or-null",
  "totalCount": 50
}
```

---

### Create Member
Create a new member.

**Endpoint**: `POST /api/members`

**Auth Required**: Yes (requires `members.write` permission)

**Request Body**:
```json
{
  "fullName": "Jane Smith",
  "phoneNumber": "+919876543211",
  "roleId": "role-id-here",
  "password": "Welcome123!",
  "photoUrl": null
}
```

**Response**:
```json
{
  "id": "user-id",
  "fullName": "Jane Smith",
  "phoneNumber": "+919876543211"
}
```

**Notes**:
- Phone number is normalized (adds +91 prefix if missing)
- Phone number must be unique
- Default password is "Welcome123!" if not provided
- Role must belong to the organization

---

### Update Member
Update member details.

**Endpoint**: `PUT /api/members/:memberId`

**Auth Required**: Yes (requires `members.write` permission)

**URL Parameters**:
- `memberId` (string, required) - Member ID

**Request Body**:
```json
{
  "fullName": "Jane Smith Updated",
  "roleId": "new-role-id",
  "photoUrl": "/uploads/photo.jpg"
}
```

**Response**:
```json
{
  "id": "user-id"
}
```

---

### Delete Member
Delete a member.

**Endpoint**: `DELETE /api/members/:memberId`

**Auth Required**: Yes (requires `members.write` permission)

**URL Parameters**:
- `memberId` (string, required) - Member ID

**Response**: 204 No Content

---

## Events

### List Events
List all events with pagination.

**Endpoint**: `GET /api/events`

**Auth Required**: Yes

**Query Parameters**:
- `limit` (number, optional) - Items per page (default: 20, max: 100)
- `cursor` (string, optional) - Cursor for pagination
- `q` (string, optional) - Search by title or location

**Response**:
```json
{
  "items": [
    {
      "id": "event-id",
      "title": "Annual Tech Conference 2025",
      "description": "Join us for our biggest tech conference",
      "location": "Convention Center, San Francisco",
      "startDate": "2025-12-15T09:00:00.000Z",
      "endDate": "2025-12-17T18:00:00.000Z",
      "imageUrl": "/uploads/event-banner.jpg",
      "organizerId": "user-id",
      "organizerName": "Admin",
      "organizationId": "org-id",
      "createdAt": "2025-11-05T00:00:00.000Z"
    }
  ],
  "nextCursor": "cursor-value-or-null"
}
```

---

### Create Event
Create a new event.

**Endpoint**: `POST /api/events`

**Auth Required**: Yes (requires `events.write` permission)

**Request Body**:
```json
{
  "title": "Annual Tech Conference 2025",
  "description": "Join us for our biggest tech conference of the year",
  "location": "Convention Center, San Francisco",
  "startDate": "2025-12-15T09:00:00Z",
  "endDate": "2025-12-17T18:00:00Z",
  "imageUrl": "/uploads/event-banner.jpg"
}
```

**Response**:
```json
{
  "id": "event-id",
  "title": "Annual Tech Conference 2025",
  "description": "Join us for our biggest tech conference of the year",
  "location": "Convention Center, San Francisco",
  "startDate": "2025-12-15T09:00:00.000Z",
  "endDate": "2025-12-17T18:00:00.000Z",
  "imageUrl": "/uploads/event-banner.jpg",
  "organizerId": "user-id",
  "organizerName": "Admin",
  "organizationId": "org-id",
  "createdAt": "2025-11-05T00:00:00.000Z",
  "updatedAt": "2025-11-05T00:00:00.000Z"
}
```

---

## Announcements

### List Announcements
List all announcements.

**Endpoint**: `GET /api/announcements`

**Auth Required**: Yes

**Query Parameters**:
- `limit` (number, optional) - Items per page (default: 20, max: 100)
- `cursor` (string, optional) - Cursor for pagination
- `q` (string, optional) - Search by title or content

**Response**:
```json
{
  "items": [
    {
      "id": "announcement-id",
      "title": "Important Community Update",
      "content": "We are excited to announce new features!",
      "isPinned": true,
      "authorId": "user-id",
      "authorName": "Admin",
      "organizationId": "org-id",
      "createdAt": "2025-11-05T00:00:00.000Z",
      "updatedAt": "2025-11-05T00:00:00.000Z"
    }
  ],
  "nextCursor": "cursor-value-or-null"
}
```

---

### Create Announcement
Create a new announcement.

**Endpoint**: `POST /api/announcements`

**Auth Required**: Yes (requires `announcements.write` permission)

**Request Body**:
```json
{
  "title": "Important Community Update",
  "content": "We are excited to announce new features coming to the platform!",
  "isPinned": true
}
```

**Response**:
```json
{
  "id": "announcement-id",
  "title": "Important Community Update",
  "content": "We are excited to announce new features coming to the platform!",
  "isPinned": true,
  "authorId": "user-id",
  "authorName": "Admin",
  "organizationId": "org-id",
  "createdAt": "2025-11-05T00:00:00.000Z",
  "updatedAt": "2025-11-05T00:00:00.000Z"
}
```

---

## Elections

### List Elections
List all elections.

**Endpoint**: `GET /api/elections`

**Auth Required**: Yes

**Query Parameters**:
- `limit` (number, optional) - Items per page (default: 20, max: 100)
- `cursor` (string, optional) - Cursor for pagination
- `q` (string, optional) - Search by title or description
- `status` (string, optional) - Filter by status: draft, active, completed, cancelled

**Response**:
```json
{
  "items": [
    {
      "id": "election-id",
      "title": "Board Elections 2025",
      "description": "Annual board member elections",
      "type": "board",
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": "2025-11-15T23:59:59.000Z",
      "status": "active",
      "allowMultiple": false,
      "maxVotes": null,
      "isAnonymous": true,
      "candidates": [
        {
          "id": "candidate-id",
          "name": "Alice Johnson",
          "description": "5 years of community experience",
          "photoUrl": null,
          "position": "President",
          "order": 0
        }
      ],
      "_count": {
        "votes": 150,
        "candidates": 3
      }
    }
  ],
  "nextCursor": "cursor-value-or-null"
}
```

---

### Get Election Details
Get detailed election information with candidates.

**Endpoint**: `GET /api/elections/:electionId`

**Auth Required**: Yes

**URL Parameters**:
- `electionId` (string, required) - Election ID

**Response**:
```json
{
  "id": "election-id",
  "title": "Board Elections 2025",
  "description": "Annual board member elections",
  "type": "board",
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-11-15T23:59:59.000Z",
  "status": "active",
  "allowMultiple": false,
  "maxVotes": null,
  "isAnonymous": true,
  "candidates": [
    {
      "id": "candidate-id",
      "name": "Alice Johnson",
      "description": "5 years of community experience",
      "photoUrl": null,
      "position": "President",
      "order": 0,
      "_count": {
        "votes": 75
      }
    }
  ],
  "_count": {
    "votes": 150
  }
}
```

---

### Create Election
Create a new election with candidates.

**Endpoint**: `POST /api/elections`

**Auth Required**: Yes (requires `elections.write` permission)

**Request Body**:
```json
{
  "title": "Board Elections 2025",
  "description": "Annual board member elections",
  "type": "board",
  "startDate": "2025-11-01T00:00:00Z",
  "endDate": "2025-11-15T23:59:59Z",
  "allowMultiple": false,
  "maxVotes": null,
  "isAnonymous": true,
  "candidates": [
    {
      "name": "Alice Johnson",
      "description": "5 years of community experience",
      "photoUrl": null,
      "position": "President"
    },
    {
      "name": "Bob Williams",
      "description": "Technology expert",
      "photoUrl": null,
      "position": "President"
    }
  ]
}
```

**Response**: Returns the created election with candidates.

---

### Update Election
Update election details.

**Endpoint**: `PUT /api/elections/:electionId`

**Auth Required**: Yes (requires `elections.write` permission)

**URL Parameters**:
- `electionId` (string, required) - Election ID

**Request Body**:
```json
{
  "title": "Board Elections 2025 - Updated",
  "status": "active"
}
```

**Response**: Returns the updated election.

---

### Delete Election
Delete an election.

**Endpoint**: `DELETE /api/elections/:electionId`

**Auth Required**: Yes (requires `elections.write` permission)

**URL Parameters**:
- `electionId` (string, required) - Election ID

**Response**: 204 No Content

---

### Cast Vote
Cast vote for candidate(s) in an election.

**Endpoint**: `POST /api/elections/:electionId/vote`

**Auth Required**: Yes

**URL Parameters**:
- `electionId` (string, required) - Election ID

**Request Body**:
```json
{
  "candidateIds": ["candidate-id-1"]
}
```

**Response**:
```json
{
  "message": "Vote cast successfully",
  "count": 1
}
```

**Notes**:
- Can only vote once per election
- Election must be active and within voting period
- For single-vote elections, only one candidate can be selected
- For multiple-vote elections, respect maxVotes limit

---

### Get Election Results
Get election results with vote counts.

**Endpoint**: `GET /api/elections/:electionId/results`

**Auth Required**: Yes

**URL Parameters**:
- `electionId` (string, required) - Election ID

**Response**:
```json
{
  "election": {
    "id": "election-id",
    "title": "Board Elections 2025",
    "status": "completed",
    "totalVotes": 150,
    "totalCandidates": 3
  },
  "results": [
    {
      "id": "candidate-id",
      "name": "Alice Johnson",
      "description": "5 years of experience",
      "photoUrl": null,
      "position": "President",
      "order": 0,
      "voteCount": 75,
      "percentage": 50.0,
      "_count": {
        "votes": 75
      }
    }
  ]
}
```

---

## Income

### List Income Records
List all income records with filtering.

**Endpoint**: `GET /api/income`

**Auth Required**: Yes

**Query Parameters**:
- `limit` (number, optional) - Items per page (default: 20, max: 100)
- `cursor` (number, optional) - Cursor for pagination
- `eventId` (string, optional) - Filter by event
- `paidStatus` (string, optional) - Filter by paid status: Pending, Paid
- `approveStatus` (string, optional) - Filter by approval status: Approved, Declined, Pending
- `q` (string, optional) - Search by receipt number or event title

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "receiptPic": "/uploads/receipt.jpg",
      "receiptNumber": "RCT-2025-001",
      "amount": 5000,
      "eventId": "event-id",
      "organizationId": "org-id",
      "paidStatus": "Paid",
      "approveStatus": "Approved",
      "approvePersonId": "user-id",
      "date": "2025-11-05T00:00:00.000Z",
      "time": "1970-01-01T14:30:00.000Z",
      "createdAt": "2025-11-05T00:00:00.000Z",
      "updatedAt": "2025-11-05T00:00:00.000Z",
      "event": {
        "id": "event-id",
        "title": "Annual Conference",
        "startDate": "2025-12-15T00:00:00.000Z"
      },
      "organization": {
        "id": "org-id",
        "name": "Tech Community Hub"
      }
    }
  ],
  "nextCursor": 2
}
```

---

### Get Income Statistics
Get income statistics and totals.

**Endpoint**: `GET /api/income/stats`

**Auth Required**: Yes

**Query Parameters**:
- `eventId` (string, optional) - Filter by event

**Response**:
```json
{
  "approvedIncome": {
    "total": 50000,
    "count": 10
  },
  "pendingIncome": {
    "total": 15000,
    "count": 3
  },
  "paidCount": 8,
  "unpaidCount": 5
}
```

---

### Get Income Record
Get single income record details.

**Endpoint**: `GET /api/income/:incomeId`

**Auth Required**: Yes

**URL Parameters**:
- `incomeId` (number, required) - Income record ID

**Response**: Returns single income record with event and organization details.

---

### Create Income Record
Create a new income record.

**Endpoint**: `POST /api/income`

**Auth Required**: Yes (requires `income.write` permission)

**Request Body**:
```json
{
  "receiptPic": "/uploads/receipt.jpg",
  "receiptNumber": "RCT-2025-001",
  "amount": 5000,
  "eventId": "event-id-here",
  "paidStatus": "Paid",
  "approveStatus": "Pending",
  "date": "2025-11-05",
  "time": "14:30:00"
}
```

**Response**: Returns created income record.

**Notes**:
- Amount must be positive
- Event must exist and belong to organization
- Valid paidStatus values: Pending, Paid
- Valid approveStatus values: Approved, Declined, Pending

---

### Update Income Record
Update income record.

**Endpoint**: `PUT /api/income/:incomeId`

**Auth Required**: Yes (requires `income.write` permission)

**URL Parameters**:
- `incomeId` (number, required) - Income record ID

**Request Body**:
```json
{
  "amount": 5500,
  "paidStatus": "Paid",
  "approveStatus": "Approved"
}
```

**Response**: Returns updated income record.

---

### Approve/Decline Income
Approve or decline income record.

**Endpoint**: `PATCH /api/income/:incomeId/approve`

**Auth Required**: Yes (requires `income.write` permission)

**URL Parameters**:
- `incomeId` (number, required) - Income record ID

**Request Body**:
```json
{
  "approveStatus": "Approved"
}
```

**Response**: Returns updated income record with approver information.

---

### Mark Income as Paid
Mark income as paid or pending.

**Endpoint**: `PATCH /api/income/:incomeId/paid`

**Auth Required**: Yes (requires `income.write` permission)

**URL Parameters**:
- `incomeId` (number, required) - Income record ID

**Request Body**:
```json
{
  "paidStatus": "Paid"
}
```

**Response**: Returns updated income record.

---

### Delete Income Record
Delete an income record.

**Endpoint**: `DELETE /api/income/:incomeId`

**Auth Required**: Yes (requires `income.write` permission)

**URL Parameters**:
- `incomeId` (number, required) - Income record ID

**Response**: 204 No Content

---

## Dashboard

### Get Dashboard Data
Get dashboard statistics and overview.

**Endpoint**: `GET /api/dashboard`

**Auth Required**: No (uses hardcoded user for testing)

**Response**:
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org-id",
      "name": "Tech Community Hub",
      "themeColor": "#4F46E5",
      "place": "San Francisco, CA"
    },
    "stats": {
      "members": 50,
      "events": 10,
      "announcements": 5,
      "activeMembers": 25
    },
    "financialOverview": [
      {
        "eventName": "Town Hall",
        "income": 1800,
        "expenses": 1000
      }
    ],
    "upcomingMeetings": [
      {
        "id": "1",
        "title": "Board Meeting",
        "date": "Oct 12, 2025",
        "time": "10:00 AM",
        "type": "Virtual",
        "attendees": 12,
        "color": "#3B82F6"
      }
    ],
    "lastUpdated": "2025-11-05T00:00:00.000Z"
  }
}
```

---

## Subscription

### Get User Subscription
Get current user's subscription details.

**Endpoint**: `GET /api/subscription`

**Auth Required**: Yes

**Response**:
```json
{
  "id": "sub_1234567890",
  "userId": "user-id",
  "plan": "trial",
  "startDate": "2025-11-05T00:00:00.000Z",
  "endDate": "2026-11-05T00:00:00.000Z",
  "isActive": true,
  "isTrial": true,
  "amount": 0,
  "currency": "INR",
  "status": "active"
}
```

---

### Get Subscription Plans
Get available subscription plans.

**Endpoint**: `GET /api/subscription/plans`

**Auth Required**: No

**Response**:
```json
{
  "trial": {
    "name": "Free Trial",
    "price": 0,
    "duration": 365,
    "description": "First year completely free",
    "features": [
      "Unlimited community members",
      "Unlimited events and announcements",
      "Basic analytics",
      "Email support"
    ]
  },
  "yearly": {
    "name": "Yearly Plan",
    "price": 9999,
    "duration": 365,
    "description": "Full access for one year",
    "features": [
      "Unlimited community members",
      "Unlimited events and announcements",
      "Advanced analytics and reporting",
      "Priority customer support",
      "Custom branding options",
      "API access for integrations"
    ]
  }
}
```

---

## Upload

### Upload File
Upload a file (image, document, etc.).

**Endpoint**: `POST /api/upload`

**Auth Required**: No

**Request Body**: multipart/form-data
- `file` (file, required) - File to upload

**Response**:
```json
{
  "url": "/uploads/1234567890_abc123.jpg"
}
```

**Notes**:
- Uploaded files are stored in the `uploads` directory
- File URL can be used in other API calls (e.g., event imageUrl, user photoUrl)

---

## Logo

### Generate Logo
Generate a custom logo for community.

**Endpoint**: `POST /api/logo/generate`

**Auth Required**: No

**Request Body**:
```json
{
  "communityName": "Tech Community Hub",
  "type": "Tech",
  "description": "A vibrant tech community"
}
```

**Response**:
```json
{
  "success": true,
  "logoUrl": "/uploads/logo_1234567890.svg",
  "method": "custom-svg",
  "message": "Logo generated successfully"
}
```

---

### Generate Logo Options
Generate multiple logo options.

**Endpoint**: `POST /api/logo/generate-options`

**Auth Required**: No

**Request Body**:
```json
{
  "communityName": "Tech Community Hub",
  "type": "Tech",
  "description": "A vibrant tech community"
}
```

**Response**:
```json
{
  "success": true,
  "options": [
    {
      "id": "custom",
      "name": "Custom Design",
      "description": "Unique SVG logo with icon and gradient",
      "logoUrl": "/uploads/logo_custom.svg",
      "method": "custom-svg"
    },
    {
      "id": "advanced",
      "name": "Professional",
      "description": "Clean and modern design",
      "logoUrl": "/uploads/logo_advanced.svg",
      "method": "advanced-svg"
    },
    {
      "id": "simple",
      "name": "Simple",
      "description": "Minimalist text-based logo",
      "logoUrl": "/uploads/logo_simple.svg",
      "method": "simple-svg"
    }
  ],
  "message": "Generated 3 logo options"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "message": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required or failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Permissions

The following permissions are used throughout the API:

- `*` - Super admin (full access to everything)
- `roles.write` - Create, update, delete roles
- `members.write` - Create, update, delete members
- `events.write` - Create, update events
- `announcements.write` - Create announcements
- `elections.write` - Manage elections and candidates
- `income.write` - Manage income records
- `read` - Basic read access

---

## Testing Workflow

### 1. Register a New Organization
```
POST /api/organizations/register
```
This creates an organization and returns a token. The token is automatically saved.

### 2. Test Authentication
```
POST /api/auth/otp/request
POST /api/auth/otp/verify
```
Or use password login:
```
POST /api/auth/login
```

### 3. Get Your Profile
```
GET /api/me
```

### 4. Create Roles
```
POST /api/roles
```

### 5. Add Members
```
POST /api/members
```

### 6. Create Events
```
POST /api/events
```

### 7. Create Announcements
```
POST /api/announcements
```

### 8. Create Elections
```
POST /api/elections
```

### 9. Test Income Management
```
POST /api/income
GET /api/income/stats
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Phone numbers should include country code (e.g., +91 for India)
- The API uses cursor-based pagination for most list endpoints
- Tokens expire after 24 hours
- Files are uploaded to the `/uploads` directory and served via `/uploads/:filename`

---

## Support

For issues or questions:
1. Check this documentation first
2. Review the Postman collection examples
3. Check server logs for detailed error messages
4. Ensure database is running and migrations are applied
