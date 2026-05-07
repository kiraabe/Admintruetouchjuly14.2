# API Request/Response Examples

## Complete Request/Response Flow

### Sign In

#### Request
```bash
curl -X POST http://localhost:3000/api/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-01@ecme.com",
    "password": "123Qwe"
  }'
```

#### Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFkbWluLTAxQGVjbWUuY29tIiwiaWF0IjoxNzE2MTExNjAwLCJleHAiOjE3MTY3MTY0MDB9.xxxx",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userName": "Admin User",
    "email": "admin-01@ecme.com",
    "avatar": "",
    "authority": ["admin"]
  }
}
```

#### Error Response (401 Unauthorized)
```json
{
  "message": "Invalid email or password"
}
```

#### Error Response (400 Bad Request)
```json
{
  "message": "Email and password are required"
}
```

---

### Sign Up

#### Request
```bash
curl -X POST http://localhost:3000/api/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "userName": "John Doe"
  }'
```

#### Response (201 Created)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx",
  "user": {
    "userId": "660e8400-e29b-41d4-a716-446655440111",
    "userName": "John Doe",
    "email": "newuser@example.com",
    "avatar": "",
    "authority": ["user"]
  }
}
```

#### Error Response (409 Conflict)
```json
{
  "message": "Email already in use"
}
```

#### Error Response (400 Bad Request)
```json
{
  "message": "Password must be at least 6 characters"
}
```

---

### Get Profile (Protected)

#### Request
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx"
```

#### Response (200 OK)
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin-01@ecme.com",
  "message": "Profile retrieved successfully"
}
```

#### Error Response (401 Unauthorized)
```json
{
  "message": "No token provided"
}
```

#### Error Response (401 Invalid Token)
```json
{
  "message": "Invalid token"
}
```

---

### Sign Out

#### Request
```bash
curl -X POST http://localhost:3000/api/sign-out \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx"
```

#### Response (200 OK)
```json
{
  "message": "Signed out successfully"
}
```

---

## Frontend Integration Code

### Sign In with Error Handling

```typescript
import { useAuth } from '@/auth'

function MyComponent() {
  const { signIn } = useAuth()

  const handleSignIn = async () => {
    const result = await signIn({
      email: 'admin-01@ecme.com',
      password: '123Qwe'
    })

    if (result?.status === 'success') {
      console.log('Sign in successful!')
      // User is already redirected to /home by AuthProvider
    } else if (result?.status === 'failed') {
      console.error('Sign in failed:', result.message)
      // Display error to user
    }
  }

  return <button onClick={handleSignIn}>Sign In</button>
}
```

### Using Authentication State

```typescript
import { useAuth } from '@/auth'

function ProfileComponent() {
  const { authenticated, user, signOut } = useAuth()

  if (!authenticated) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <p>Welcome, {user.userName}!</p>
      <p>Email: {user.email}</p>
      <p>Authority: {user.authority?.join(', ')}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Making Authenticated API Calls

```typescript
import ApiService from '@/services/ApiService'

async function getProfile() {
  try {
    const response = await ApiService.fetchDataWithAxios({
      url: '/profile',
      method: 'get'
    })
    console.log('Profile:', response)
  } catch (error) {
    console.error('Failed to get profile:', error)
  }
}
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  avatar VARCHAR(255),
  authority VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample query to verify data
SELECT user_id, email, user_name, authority, is_active, created_at FROM users;
```

### Reset Tokens Table

```sql
CREATE TABLE reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Postman Collection

Import this JSON into Postman for testing:

```json
{
  "info": {
    "name": "ECME Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Sign In",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"admin-01@ecme.com\",\"password\":\"123Qwe\"}"
        },
        "url": {
          "raw": "http://localhost:3000/api/sign-in",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "sign-in"]
        }
      }
    },
    {
      "name": "Sign Up",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"newuser@example.com\",\"password\":\"password123\",\"userName\":\"New User\"}"
        },
        "url": {
          "raw": "http://localhost:3000/api/sign-up",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "sign-up"]
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_TOKEN_HERE"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/profile",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "profile"]
        }
      }
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|---|
| 200 | OK | Successful request |
| 201 | Created | User created successfully |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Invalid credentials or token |
| 403 | Forbidden | Account inactive |
| 409 | Conflict | Email already exists |
| 500 | Server Error | Internal server error |

