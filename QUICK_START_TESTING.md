# CHAPTERS FEATURE - QUICK TESTING GUIDE

## ✅ STATUS: READY TO TEST

Your chapters feature is now **fully implemented and running**!

### Build Status
- [x] Module created and compiled
- [x] Database configured with Chapter entity
- [x] API registered with Docker containers
- [x] Endpoint: `GET /chapters/book/:bookId`

---

## 🚀 HOW TO TEST (3 Methods)

### METHOD 1: Use Postman (Easiest) ⭐

**Step 1: Import Collection**
1. Open Postman
2. Click `File` → `Import`
3. Select `Chapters-API-Postman.json` from project folder
4. Click `Import`

**Step 2: Set JWT Token Variable**
1. After login/signup, copy the JWT token
2. In Postman, go to `Collections` → `Chapters API Testing` → `Variables`
3. Paste token in `jwt_token` → `Current value`
4. Click Save

**Step 3: Test Endpoints**

Run requests in this order:

```
1. Auth > Signup (creates test user)
2. Auth > Login (get JWT token) ← Save this token!
3. Books > Create Book (creates test book)
4. Chapters > Get Chapters by Book ID (should return [])
5. Chapters > Create Chapter (add chapters)
6. Chapters > Get Chapters by Book ID (should return chapters array)
```

---

### METHOD 2: Command Line Testing (cURL/PowerShell)

**Step 1: Login and Get JWT Token**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/auth/login" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body @{
    email = "testuser@example.com"
    password = "TestPassword123"
  } | ConvertTo-Json

$jwt = ($response.Content | ConvertFrom-Json).accessToken
Write-Host "JWT Token: $jwt"
```

**Step 2: Create a Book**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/books" `
  -Method Post `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $jwt"
  } `
  -Body @{
    title = "My Book"
    content = "Book content"
  } | ConvertTo-Json

$bookId = ($response.Content | ConvertFrom-Json).id
Write-Host "Book ID: $bookId"
```

**Step 3: Test Get Chapters (Empty)**
```powershell
curl -X GET "http://localhost:3001/chapters/book/$bookId"
```
Expected: `[]` (Status 200)

**Step 4: Create a Chapter**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/chapters" `
  -Method Post `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $jwt"
  } `
  -Body @{
    title = "Chapter 1"
    content = "Chapter content..."
    chapterNumber = 1
    bookId = $bookId
    type = "CHAPTER"
    order = 0
  } | ConvertTo-Json
```

**Step 5: Get Chapters Again (With Data)**
```powershell
curl -X GET "http://localhost:3001/chapters/book/$bookId"
```
Expected: Chapter data (Status 200)

---

### METHOD 3: Run PowerShell Test Script

```powershell
cd "d:\I4\SERMISTER II\Internet Programming 2\Project\kdrc-api"
.\test-chapters-complete.ps1
```

This runs automated tests and shows results.

---

## 📊 EXPECTED RESPONSES

### Test 1: Non-existent Book
```
GET /chapters/book/00000000-0000-0000-0000-000000000000

Status: 404 Not Found
Response: {
  "statusCode": 404,
  "message": "Book with ID 00000000-0000-0000-0000-000000000000 not found",
  "error": "Not Found"
}
```

### Test 2: Book with No Chapters
```
GET /chapters/book/{valid-book-id-without-chapters}

Status: 200 OK
Response: []
```

### Test 3: Book with Chapters
```
GET /chapters/book/{valid-book-id-with-chapters}

Status: 200 OK
Response: [
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Chapter 1: The Beginning",
    "chapterNumber": 1,
    "order": 0,
    "type": "CHAPTER",
    "description": "Introduction",
    "createdAt": "2024-05-15T10:30:00Z",
    "updatedAt": "2024-05-15T10:30:00Z"
  }
]
```

---

## ✅ VERIFICATION CHECKLIST

After testing, verify these work:

- [ ] API is running (status 200 on any GET request)
- [ ] Signup/Login works
- [ ] Can create a book
- [ ] GET chapters returns `[]` for new book
- [ ] Can create chapters
- [ ] GET chapters returns array with chapters
- [ ] Chapters are sorted correctly (by chapterNumber)
- [ ] Non-existent book returns 404
- [ ] Can update chapter
- [ ] Can delete chapter

---

## 🔑 KEY POINTS

### Authentication
- `Signup` and `Login` are in `/auth` endpoints
- Get JWT token from `Login` response
- Use `Bearer {token}` in Authorization header for protected endpoints

### Chapters Endpoint
- `GET /chapters/book/:bookId` - **No auth required** (public)
- `POST /chapters` - **Requires JWT**
- `PATCH /chapters/:id` - **Requires JWT**
- `DELETE /chapters/:id` - **Requires JWT**

### Response Format
Returns array of chapters:
```json
[
  {
    "id": "uuid",
    "title": "string",
    "chapterNumber": "number",
    "order": "number",
    "type": "CHAPTER|PROLOGUE|BONUS|EPILOGUE",
    "description": "string (optional)",
    "createdAt": "date",
    "updatedAt": "date"
  }
]
```

---

## 🐛 TROUBLESHOOTING

### ❌ "Cannot connect to localhost:3001"
**Solution:** Check Docker containers are running
```bash
docker-compose ps
```
Should show `kdrc-api` and `kdrc-db` as "Up"

### ❌ "401 Unauthorized" on POST /chapters
**Solution:** You need JWT token
1. Login: `POST /auth/login`
2. Copy the `accessToken` from response
3. Add to header: `Authorization: Bearer <token>`

### ❌ "Book not found" error
**Solution:** Make sure you:
1. Created a book first
2. Got the correct book ID
3. Used same book ID in chapters endpoint

### ❌ Empty response when expecting chapters
**This is correct!** If book has no chapters, it returns `[]`

---

## 📝 NEXT STEPS

1. **Immediate:** Run one of the 3 testing methods above
2. **Verify:** Check that all endpoints return expected responses
3. **Deploy:** Once verified, ready for production
4. **Integrate:** Connect to your frontend with the book ID

---

## 📚 DOCUMENTATION

For complete details, see:
- `CHAPTERS_API.md` - Full API documentation
- `CHAPTERS_TESTING.md` - Detailed test cases
- `chapters.controller.ts` - Source code with inline docs

---

## 🎉 YOU'RE ALL SET!

The feature is **complete and ready**. Pick a testing method above and start testing!

Questions? Check the documentation files above.

**Happy Testing!** 🚀
