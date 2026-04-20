# Social Media App Backend

Backend بسيط بـ Express و TypeScript للـ authentication part.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

لازم MongoDB و Redis يكونوا شغالين قبل تشغيل المشروع.

## Auth Routes

Base URL:

```text
http://localhost:3000/api/auth
```

### Signup

```http
POST /signup
```

```json
{
  "name": "Ahmed",
  "email": "ahmed@test.com",
  "password": "123456"
}
```

### Confirm Email

```http
POST /confirm-email
```

```json
{
  "email": "ahmed@test.com",
  "code": "123456"
}
```

لو مفيش email config الكود هيظهر في terminal.

### Login

```http
POST /login
```

```json
{
  "email": "ahmed@test.com",
  "password": "123456"
}
```

### Gmail Login

```http
POST /google
```

```json
{
  "idToken": "google_id_token"
}
```

### Forget Password

```http
POST /forgot-password
```

```json
{
  "email": "ahmed@test.com"
}
```

### Reset Password

```http
POST /reset-password
```

```json
{
  "email": "ahmed@test.com",
  "code": "123456",
  "password": "new123456"
}
```

### Update Password

```http
PATCH /update-password
Authorization: Bearer token
```

```json
{
  "oldPassword": "123456",
  "newPassword": "new123456"
}
```

### Logout

```http
POST /logout
Authorization: Bearer token
```

### Profile

```http
GET /me
Authorization: Bearer token
```

## Authorization Route

```http
GET /api/users
Authorization: Bearer admin_token
```

الـ user العادي role بتاعه `user`. عشان تجرب admin route غير role من database إلى `admin`.
