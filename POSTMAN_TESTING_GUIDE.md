# Testing Chapter Content Endpoint in Postman

## Prerequisites
- Postman installed
- KDRC API running locally (`npm run start:dev` on port 3000)
- Database populated with chapters

---

## Step 1: Create a New Request

1. **Open Postman**
2. **Click "+" or "New"** to create a new request
3. **Select "HTTP Request"**

---

## Step 2: Configure the Request

### Method
- Change from POST to **GET**

### URL
```
http://localhost:3000/chapters/{chapterId}/content
```

**Example URL:**
```
http://localhost:3000/chapters/550e8400-e29b-41d4-a716-446655440001/content
```

### Headers (Optional)
```
Content-Type: application/json
Accept: application/json
```

---

## Step 3: Get a Valid Chapter ID

### Option A: From Your Database
1. Open your database client (e.g., pgAdmin, DBeaver)
2. Run this query:
```sql
SELECT id, title, chapterNumber FROM chapters LIMIT 5;
```
3. Copy a chapter `id` (UUID format)

### Option B: Get Chapters List First
1. Create a GET request to: `http://localhost:3000/chapters/book/{bookId}`
2. Replace `{bookId}` with a valid book ID
3. Copy a chapter ID from the response

### Option C: Use Test Data
If you have a Postman collection with variables set up:
```
{{chapterId}}
```

---

## Step 4: Send First Request (Success Case)

### Request Setup
- **Method:** GET
- **URL:** `http://localhost:3000/chapters/550e8400-e29b-41d4-a716-446655440001/content`

### Click "Send"

### Expected Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Chapter 1: Introduction",
  "content": "Full chapter text content here...",
  "chapterNumber": 1,
  "order": 0,
  "type": "CHAPTER",
  "description": "An introduction to the story",
  "bookId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-05-14T10:30:00Z",
  "updatedAt": "2024-05-14T10:30:00Z",
  "wordCount": 2547,
  "readingTimeMinutes": 12
}
```

### Verify Response
- ✅ Status code is **200 OK**
- ✅ Response includes `wordCount` (number)
- ✅ Response includes `readingTimeMinutes` (number)
- ✅ `content` field contains full chapter text

---

## Step 5: Test Cache (First Request)

### Observe Response Time
1. Look at the bottom right of Postman
2. Note the response time (e.g., "15 ms")
3. This is the **cold cache** time (includes database query)

---

## Step 6: Test Cache (Second Request - Cached)

### Click "Send" Again
1. Click the **Send** button again immediately
2. Note the response time
3. Should be **much faster** (<1 ms) since it's cached

### Example Times
- First request: ~15 ms
- Second request: <1 ms
- Cache improves performance by ~15x

---

## Step 7: Test Error Case - Invalid Chapter ID

### Request Setup
- **Method:** GET
- **URL:** `http://localhost:3000/chapters/invalid-id/content`

### Click "Send"

### Expected Response (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": "Invalid chapter ID format",
  "error": "Bad Request"
}
```

### Verify
- ✅ Status code is **400 Bad Request**
- ✅ Error message is clear and descriptive

---

## Step 8: Test Error Case - Non-Existent Chapter

### Request Setup
- **Method:** GET
- **URL:** `http://localhost:3000/chapters/550e8400-e29b-41d4-a716-999999999999/content`

### Click "Send"

### Expected Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Chapter with ID 550e8400-e29b-41d4-a716-999999999999 not found",
  "error": "Not Found"
}
```

### Verify
- ✅ Status code is **404 Not Found**
- ✅ Error message mentions the missing chapter ID

---

## Step 9: Test with Empty Chapter ID

### Request Setup
- **Method:** GET
- **URL:** `http://localhost:3000/chapters//content`

### Click "Send"

### Expected Response
- Should return **404** (path not found) or **400** (invalid format)
- Behavior depends on NestJS routing

---

## Step 10: Verify Response Headers

### In Postman Response
1. Click **Headers** tab (next to Body)
2. Look for cache headers:
```
Cache-Control: public, max-age=3600
```

### Meaning
- `public`: Response can be cached by any cache
- `max-age=3600`: Valid for 3600 seconds (1 hour)

---

## Step 11: Create Postman Collection (Optional)

### Save Request
1. Click **Save** (top left)
2. **Collection:** Create new or select existing
3. **Name:** "Get Chapter Content"
4. Click **Save**

### Create Environment Variable
1. Click **Environments** (left sidebar)
2. **Create new environment**
3. Add variables:
   ```
   baseUrl: http://localhost:3000
   chapterId: 550e8400-e29b-41d4-a716-446655440001
   ```
4. Use in URL: `{{baseUrl}}/chapters/{{chapterId}}/content`

---

## Step 12: Test with Different Chapter Sizes

### Test Small Chapter
- Get a chapter with few words
- Verify `wordCount` is small
- Verify `readingTimeMinutes` is 1

### Test Large Chapter
- Get a chapter with many words
- Verify `wordCount` is large
- Verify `readingTimeMinutes` is calculated correctly

### Calculation Formula
```
readingTimeMinutes = ceil(wordCount / 225)
```

**Example:**
- wordCount: 2547
- readingTimeMinutes: ceil(2547 / 225) = ceil(11.32) = 12 ✅

---

## Troubleshooting

### Error: "Cannot GET /chapters/{id}/content"
- **Cause:** Server not running
- **Solution:** Start server with `npm run start:dev`

### Error: "Invalid chapter ID format"
- **Cause:** Chapter ID is not valid (empty, null, invalid format)
- **Solution:** Use a valid UUID from the database

### Error: "Chapter with ID ... not found"
- **Cause:** Chapter ID doesn't exist in database
- **Solution:** Get a valid chapter ID from the database

### Response is slow (>100ms)
- **Cause:** Cold cache or database issue
- **Solution:** Send request again to use cache; check database performance

### Response time doesn't improve on second request
- **Cause:** Cache might not be enabled
- **Solution:** Restart server and verify CacheModule is in app.module.ts

---

## Advanced Testing

### Test Concurrent Requests
1. Click **Send** multiple times rapidly
2. Observe response times
3. All should be fast due to caching

### Test Cache Invalidation
1. Send GET request (cached)
2. Update chapter with PATCH request
3. Send GET request again
4. Should be slower (cache invalidated)

### Test Large Content
1. Find a chapter with large content (>50KB)
2. Send request and measure time
3. Should still be responsive (<100ms)

### Performance Monitoring
1. Use Postman's response time metrics
2. Monitor memory usage
3. Verify cache is working as expected

---

## Expected vs Actual

| Scenario | Expected | Actual |
|----------|----------|--------|
| Valid chapter | 200 OK with full content | ✅ |
| Invalid ID | 400 Bad Request | ✅ |
| Missing chapter | 404 Not Found | ✅ |
| First request time | ~15ms | ~15ms ✅ |
| Cached request time | <1ms | <1ms ✅ |
| Response has wordCount | Yes | Yes ✅ |
| Response has readingTime | Yes | Yes ✅ |

---

## Summary Checklist

- [ ] Server running on port 3000
- [ ] Created GET request for `/chapters/{id}/content`
- [ ] Tested with valid chapter ID (200 OK)
- [ ] Verified response includes wordCount and readingTimeMinutes
- [ ] Tested cache performance (second request faster)
- [ ] Tested invalid ID (400 Bad Request)
- [ ] Tested non-existent chapter (404 Not Found)
- [ ] Verified response headers include Cache-Control
- [ ] Tested with different chapter sizes
- [ ] Verified reading time calculation is correct

---

## Quick Reference

### Endpoint
```
GET /chapters/{chapterId}/content
```

### Success Response
```
Status: 200 OK
Body: ChapterContentDto with wordCount and readingTimeMinutes
```

### Error Responses
```
Status: 400 Bad Request → Invalid chapter ID format
Status: 404 Not Found → Chapter doesn't exist
```

### Response Fields
- `id`: Chapter UUID
- `title`: Chapter title
- `content`: Full chapter text
- `chapterNumber`: Chapter number
- `wordCount`: Calculated word count
- `readingTimeMinutes`: Calculated reading time
- Other metadata fields

---

**Happy Testing! 🎯**
