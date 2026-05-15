# Chapters API Documentation

## Overview
The Chapters API provides endpoints to manage book chapters. It includes functionality to retrieve chapters by book ID with proper sorting and validation.

---

## Base URL
```
/chapters
```

---

## Endpoints

### 1. Get Chapters by Book ID
Fetch all chapters belonging to a selected book, sorted by order and chapter number.

**Endpoint:** `GET /chapters/book/:bookId`

**Parameters:**
- `bookId` (path parameter, required): UUID of the book

**Query Parameters:** None

**Authentication:** Not required (public endpoint)

**Response Status Codes:**
- `200 OK` - Successfully retrieved chapters
- `400 Bad Request` - Invalid book ID format
- `404 Not Found` - Book with the specified ID not found

**Success Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Chapter 1: Introduction",
    "chapterNumber": 1,
    "order": 0,
    "type": "CHAPTER",
    "description": "An introduction to the story",
    "createdAt": "2024-05-14T10:30:00Z",
    "updatedAt": "2024-05-14T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Chapter 2: Development",
    "chapterNumber": 2,
    "order": 1,
    "type": "CHAPTER",
    "description": "The main story development",
    "createdAt": "2024-05-14T10:31:00Z",
    "updatedAt": "2024-05-14T10:31:00Z"
  }
]
```

**Empty Response (200 OK - Book with no chapters):**
```json
[]
```

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Invalid book ID format",
  "error": "Bad Request"
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Book with ID 550e8400-e29b-41d4-a716-446655440999 not found",
  "error": "Not Found"
}
```

**Example cURL Request:**
```bash
curl -X GET "http://localhost:3000/chapters/book/550e8400-e29b-41d4-a716-446655440000"
```

**Example JavaScript Fetch:**
```javascript
const bookId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/chapters/book/${bookId}`);
const chapters = await response.json();
```

---

### 2. Get Single Chapter Content
Retrieve the full content for a single chapter with metadata (word count, reading time).

**Endpoint:** `GET /chapters/:id/content`

**Parameters:**
- `id` (path parameter, required): UUID of the chapter

**Query Parameters:** None

**Authentication:** Not required (public endpoint)

**Response Status Codes:**
- `200 OK` - Successfully retrieved chapter content
- `400 Bad Request` - Invalid chapter ID format
- `404 Not Found` - Chapter with the specified ID not found

**Response Headers:**
- `Cache-Control: public, max-age=3600` - Cached for 1 hour

**Success Response (200 OK):**
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

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique chapter identifier |
| title | string | Chapter title |
| content | string | Full chapter text content |
| chapterNumber | number | Chapter number in sequence |
| order | number | Display order |
| type | string | Chapter type (PROLOGUE, CHAPTER, BONUS, EPILOGUE) |
| description | string | Optional chapter description |
| bookId | string (UUID) | ID of parent book |
| createdAt | ISO 8601 | Creation timestamp |
| updatedAt | ISO 8601 | Last update timestamp |
| wordCount | number | Total words in chapter |
| readingTimeMinutes | number | Estimated reading time (225 wpm) |

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Invalid chapter ID format",
  "error": "Bad Request"
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Chapter with ID 550e8400-e29b-41d4-a716-446655440999 not found",
  "error": "Not Found"
}
```

**Example cURL Request:**
```bash
curl -X GET "http://localhost:3000/chapters/550e8400-e29b-41d4-a716-446655440001/content"
```

**Example JavaScript Fetch:**
```javascript
const chapterId = '550e8400-e29b-41d4-a716-446655440001';
const response = await fetch(`/chapters/${chapterId}/content`);
const chapter = await response.json();

console.log(`Chapter: ${chapter.title}`);
console.log(`Word count: ${chapter.wordCount}`);
console.log(`Estimated reading time: ${chapter.readingTimeMinutes} minutes`);
```

**Performance Notes:**
- Response is cached for 1 hour by default
- First request: ~15ms (with database query)
- Subsequent requests: <1ms (from cache)
- Large chapters (50KB+) handled efficiently

---

### 3. Create Chapter
Create a new chapter for a book.

**Endpoint:** `POST /chapters`

**Authentication:** Required (JWT Bearer Token)

**Request Body:**
```json
{
  "title": "Chapter 1: Introduction",
  "content": "Chapter content here...",
  "chapterNumber": 1,
  "bookId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "CHAPTER",
  "order": 0,
  "description": "An introduction to the story"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| title | string | Yes | minLength: 1 | Chapter title |
| content | string | Yes | minLength: 1 | Chapter content/text |
| chapterNumber | number | Yes | min: 1 | Sequential chapter number |
| bookId | string | Yes | UUID format | ID of the parent book |
| type | enum | No | ChapterType enum | Type: PROLOGUE, CHAPTER, BONUS, EPILOGUE |
| order | number | No | | Display order (auto-sorted) |
| description | string | No | | Optional chapter description |

**ChapterType Enum Values:**
- `PROLOGUE` - Prologue chapter
- `CHAPTER` - Regular chapter (default)
- `BONUS` - Bonus/extra chapter
- `EPILOGUE` - Epilogue chapter

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Chapter 1: Introduction",
  "chapterNumber": 1,
  "order": 0,
  "type": "CHAPTER",
  "description": "An introduction to the story",
  "createdAt": "2024-05-14T10:30:00Z",
  "updatedAt": "2024-05-14T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed or chapter number already exists for the book
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Book doesn't exist

---

### 4. Update Chapter
Update an existing chapter.

**Endpoint:** `PATCH /chapters/:id`

**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `id` (path parameter, required): UUID of the chapter

**Request Body:** (All fields optional)
```json
{
  "title": "Chapter 1: Introduction (Revised)",
  "content": "Updated content...",
  "chapterNumber": 1,
  "type": "CHAPTER",
  "order": 0,
  "description": "Updated description"
}
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Chapter 1: Introduction (Revised)",
  "chapterNumber": 1,
  "order": 0,
  "type": "CHAPTER",
  "description": "Updated description",
  "createdAt": "2024-05-14T10:30:00Z",
  "updatedAt": "2024-05-14T10:35:00Z"
}
```

---

### 5. Delete Chapter
Delete an existing chapter.

**Endpoint:** `DELETE /chapters/:id`

**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `id` (path parameter, required): UUID of the chapter

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Chapter deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Chapter with ID 550e8400-e29b-41d4-a716-446655440999 not found",
  "error": "Not Found"
}
```

---

## Features & Validation

### Book ID Validation ✅
- Book ID must be a valid UUID
- Book must exist in the database
- Invalid or empty book IDs return 400 Bad Request

### Chapter Sorting ✅
- Chapters are automatically sorted by:
  1. `order` (ascending)
  2. `chapterNumber` (ascending)
  3. `createdAt` (ascending)
- Ensures consistent and predictable chapter ordering

### Handling Books with No Chapters ✅
- Returns empty array `[]` with 200 OK status
- No error is thrown for books without chapters
- Allows iterative chapter creation

### Duplicate Prevention ✅
- Chapter numbers must be unique within a book
- Attempting to create/update with duplicate chapter number returns 400 Bad Request

### Performance Optimization ✅
- Database index on `(bookId, chapterNumber)` for fast lookups
- Efficient sorting with database-level ORDER BY
- Single query to fetch all chapters for a book

---

## Usage Examples

### React/Vue Component Example
```typescript
// Get chapters for a book
async function loadChapters(bookId: string) {
  try {
    const response = await fetch(`/chapters/book/${bookId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const chapters = await response.json();
    console.log('Chapters loaded:', chapters);
    return chapters;
  } catch (error) {
    console.error('Failed to load chapters:', error);
    return [];
  }
}

// Create a new chapter
async function createChapter(bookId: string, chapterData: any) {
  const response = await fetch('/chapters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...chapterData,
      bookId
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create chapter');
  }
  return response.json();
}
```

### cURL Examples
```bash
# Get chapters
curl "http://localhost:3000/chapters/book/550e8400-e29b-41d4-a716-446655440000"

# Create chapter
curl -X POST "http://localhost:3000/chapters" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Chapter 1",
    "content": "Content here",
    "chapterNumber": 1,
    "bookId": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Update chapter
curl -X PATCH "http://localhost:3000/chapters/550e8400-e29b-41d4-a716-446655440001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title": "Updated Title"}'

# Delete chapter
curl -X DELETE "http://localhost:3000/chapters/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Codes

| Status Code | Error | Description |
|------------|-------|-------------|
| 200 | OK | Success |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid JWT token |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## Notes
- All timestamps are in ISO 8601 format (UTC)
- Chapter IDs are UUIDs (v4)
- Book IDs must be valid UUIDs
- Chapters are cascaded deleted when a book is deleted
- Content field supports full text (markdown recommended)
