# Postman Collection - Community App API

This folder contains a complete Postman collection for testing all Community App APIs.

## 📁 Files

- **CommunityApp.postman_collection.json** - Complete API collection with all endpoints and test data
- **CommunityApp.postman_environment.json** - Environment configuration with variables
- **API_DOCUMENTATION.md** - Comprehensive API documentation

## 🚀 Quick Start

### 1. Import into Postman

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop or select both files:
   - `CommunityApp.postman_collection.json`
   - `CommunityApp.postman_environment.json`
4. Click **Import**

### 2. Select Environment

1. Click the environment dropdown (top right)
2. Select **"Community App - Local"**

### 3. Start Testing

The collection is now ready to use! The authentication token will be automatically managed.

## 🔑 Authentication

The collection automatically handles authentication tokens:

1. **Login or Register** using one of these endpoints:
   - `POST /api/auth/login` - Login with password
   - `POST /api/auth/otp/verify` - Login with OTP
   - `POST /api/organizations/register` - Register new organization

2. **Token Auto-Save**: The token is automatically saved to the `{{authToken}}` environment variable

3. **Auto-Use**: All authenticated endpoints automatically use `{{authToken}}` from the environment

## 📋 Collection Structure

The collection is organized into the following folders:

### Authentication
- Check phone availability
- Login with password
- Request OTP
- Verify OTP
- Refresh token

### Organizations
- Register organization
- List organizations
- Update organization
- Switch organization (super admin)

### User Profile
- Get current user
- Get user organizations

### Roles
- List, create, update, delete roles

### Members
- List, create, update, delete members

### Events
- List, create events

### Announcements
- List, create announcements

### Elections
- Full election management
- Candidate management
- Voting
- Results

### Chats
- Create and manage group chats
- Participant management

### Messages
- Send messages
- Edit and delete messages
- Mark as read
- Unread count

### Notifications
- List notifications
- Mark as read
- Test notifications

### Dashboard
- Get dashboard statistics
- Database connection test

### Event Financials
- List event financials
- Get event financial details

### Income
- Complete income management
- Statistics
- Approval workflow
- Payment tracking

### Subscription
- Get subscription
- Subscription plans
- Payment integration
- Cancel subscription

### Payment
- Payment order creation
- Payment verification
- Refunds

### Upload
- File upload

### Logo
- Logo generation
- Multiple logo options

## 🌐 Environment Variables

The environment includes the following variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | API base URL | `http://localhost:4000` |
| `authToken` | Authentication token | Auto-set after login |
| `organizationId` | Current organization ID | Auto-set after registration |
| `userId` | Current user ID | Auto-set after registration |

## 📝 Test Data

Each request in the collection includes realistic test data. You can use these as-is or modify them as needed.

### Example Test Phone Numbers
- `+919876543210` - Primary test account
- `+919876543211` - Secondary test account
- `+919876543212` - Additional test account

### Example Test Passwords
- `password123` - Standard test password
- `Welcome123!` - Default member password

### Example OTP
- `123456` - Test OTP (returned in response during testing)

## 🔄 Testing Workflow

Follow this recommended workflow for testing:

### 1. Setup Organization
```
1. POST /api/organizations/register
   → Creates org and admin user
   → Auto-saves token
```

### 2. Verify Authentication
```
2. GET /api/me
   → Confirms authentication works
```

### 3. Create Roles
```
3. POST /api/roles
   → Create custom roles for your org
```

### 4. Add Members
```
4. POST /api/members
   → Add team members
```

### 5. Create Content
```
5. POST /api/events
6. POST /api/announcements
7. POST /api/elections
```

### 6. Test Income Management
```
8. POST /api/income
9. GET /api/income/stats
10. PATCH /api/income/:id/approve
```

### 7. Test Subscriptions
```
11. GET /api/subscription/plans
12. POST /api/subscription/purchase
```

## 🧪 Testing Tips

### Automatic Token Management
- Tokens are automatically saved after successful authentication
- No need to manually copy/paste tokens
- Token is used in all authenticated requests

### Variable Placeholders
Some requests use placeholders that need to be replaced:
- `:roleId` - Replace with actual role ID
- `:memberId` - Replace with actual member ID
- `:eventId` - Replace with actual event ID
- `:electionId` - Replace with actual election ID
- `:incomeId` - Replace with actual income ID

### Sequential Testing
Some APIs depend on others:
1. Create organization first
2. Create roles before members
3. Create events before income records
4. Create elections before voting

### Filtering and Pagination
Most list endpoints support:
- `limit` - Number of items (default: 20, max: 100)
- `cursor` - For pagination
- `q` - Search query
- Additional filters specific to each endpoint

## 🔍 Troubleshooting

### "User organization not found"
- Ensure you're authenticated
- Check that your token is valid
- Verify organization was created successfully

### "Invalid role"
- Role must belong to your organization
- Create roles before assigning to members

### "Phone number already exists"
- Phone numbers must be unique
- Use different phone numbers for each test

### "Token expired"
- Use the `/api/auth/refresh` endpoint
- Or login again to get a new token

### Connection Errors
- Ensure the backend server is running on `http://localhost:4000`
- Check that the database is running
- Verify migrations have been applied

## 📖 Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🛠️ Server Setup

Before using this collection, ensure:

1. **Database is running**:
   ```bash
   # PostgreSQL should be running on localhost:5432
   ```

2. **Backend server is running**:
   ```bash
   npm run dev
   # Server should start on http://localhost:4000
   ```

3. **Migrations are applied**:
   ```bash
   npm run prisma:migrate
   ```

4. **Optional: Seed data**:
   ```bash
   npm run prisma:seed
   ```

## 🌟 Features

### Automatic Token Management
- Login once, token is saved automatically
- All authenticated requests use saved token
- No manual token management needed

### Comprehensive Test Data
- Realistic test data for all endpoints
- Multiple scenarios covered
- Easy to modify for your needs

### Well-Organized Structure
- Logical folder organization
- Clear naming conventions
- Helpful descriptions

### Environment Configuration
- Easy to switch between environments
- Centralized configuration
- No hardcoded values

## 📞 Support

If you encounter issues:
1. Check the [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Verify server and database are running
3. Check server logs for detailed errors
4. Ensure all migrations are applied

## 🎯 Pro Tips

1. **Use Collection Runner**: Run the entire collection or specific folders to test multiple endpoints at once

2. **Environment Switching**: Create multiple environments (Local, Staging, Production) for different testing scenarios

3. **Save Responses**: Use Postman's "Save Response" feature to keep examples of successful responses

4. **Tests Tab**: Some requests include test scripts that automatically verify responses

5. **Pre-request Scripts**: Some requests include scripts that prepare data or validate prerequisites

6. **Documentation**: Use Postman's documentation feature to generate shareable API docs from this collection

## 📄 License

This collection is part of the Community App project.
