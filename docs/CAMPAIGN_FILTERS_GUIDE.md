# 🔍 Campaign Filters Guide

## 📋 Overview

The campaign APIs now support advanced filtering and search capabilities to help users find and manage their campaigns more effectively.

## 🆕 New Features

### 1. Campaign Title Field
- Added `title` field to Campaign model
- Optional field for better campaign organization
- Case-insensitive search support

### 2. Enhanced Filtering
- Date range filtering (startDate, endDate)
- Title-based filtering
- Status filtering (existing)
- General search query

### 3. Advanced Search API
- New `/api/campaigns/search` endpoint
- Multiple filter combinations
- Custom sorting options

## 🔧 API Endpoints

### 1. Get My Campaigns (Enhanced)
**GET** `/api/campaigns`

**Query Parameters:**
```javascript
{
  status: "completed",           // Filter by status
  title: "فروش",                // Filter by title
  startDate: "2024-01-01",      // From date
  endDate: "2024-01-31",        // To date
  page: 1,                      // Page number
  limit: 10                     // Items per page
}
```

**Example Usage:**
```javascript
// Get completed campaigns from January 2024
const response = await fetch('/api/campaigns?status=completed&startDate=2024-01-01&endDate=2024-01-31', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Search Campaigns (New)
**GET** `/api/campaigns/search`

**Query Parameters:**
```javascript
{
  query: "فروش ویژه",           // General search term
  status: "completed",          // Filter by status
  title: "کمپین",              // Filter by title
  startDate: "2024-01-01",     // From date
  endDate: "2024-01-31",       // To date
  sortBy: "createdAt",         // Sort field
  sortOrder: "desc",           // Sort order
  page: 1,                     // Page number
  limit: 10                    // Items per page
}
```

**Example Usage:**
```javascript
// Search for campaigns containing "فروش" in title or message
const response = await fetch('/api/campaigns/search?query=فروش&sortBy=createdAt&sortOrder=desc', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Create Campaign (Enhanced)
**POST** `/api/campaigns`

**Request Body:**
```javascript
{
  title: "کمپین فروش ویژه",     // Optional title
  message: "سلام! پیشنهاد ویژه برای شما..."
}
```

## 🎯 Frontend Implementation Examples

### 1. Basic Campaign List with Filters
```javascript
class CampaignList {
  constructor() {
    this.filters = {
      status: '',
      title: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    };
  }

  async loadCampaigns() {
    const params = new URLSearchParams();
    
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await fetch(`/api/campaigns?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    this.renderCampaigns(data.campaigns);
    this.renderPagination(data.pagination);
  }

  setFilter(key, value) {
    this.filters[key] = value;
    this.filters.page = 1; // Reset to first page
    this.loadCampaigns();
  }
}
```

### 2. Advanced Search Component
```javascript
class CampaignSearch {
  constructor() {
    this.searchParams = {
      query: '',
      status: '',
      title: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    };
  }

  async search() {
    const params = new URLSearchParams();
    
    Object.entries(this.searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await fetch(`/api/campaigns/search?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    this.renderResults(data);
  }

  renderResults(data) {
    // Render search results
    console.log('Found campaigns:', data.campaigns);
    console.log('Applied filters:', data.filters);
    console.log('Pagination:', data.pagination);
  }
}
```

### 3. Date Range Picker Integration
```javascript
class DateRangeFilter {
  constructor() {
    this.startDate = '';
    this.endDate = '';
  }

  setDateRange(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;
    
    // Update campaign list
    campaignList.setFilter('startDate', startDate);
    campaignList.setFilter('endDate', endDate);
  }

  clearDateRange() {
    this.startDate = '';
    this.endDate = '';
    
    campaignList.setFilter('startDate', '');
    campaignList.setFilter('endDate', '');
  }
}
```

### 4. Title Search with Debouncing
```javascript
class TitleSearch {
  constructor() {
    this.searchInput = document.getElementById('title-search');
    this.debounceTimer = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      
      this.debounceTimer = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 300); // 300ms debounce
    });
  }

  performSearch(query) {
    campaignList.setFilter('title', query);
  }
}
```

## 📊 Response Format

### Standard Response Structure
```json
{
  "campaigns": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "کمپین فروش ویژه",
      "status": "completed",
      "progress": {
        "total": 150,
        "sent": 148,
        "failed": 2
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "startedAt": "2024-01-01T12:00:00.000Z",
      "completedAt": "2024-01-01T12:30:00.000Z",
      "message": "سلام! پیشنهاد ویژه برای شما..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "filters": {
    "query": "فروش",
    "status": "completed",
    "title": null,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z",
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

## 🎨 UI/UX Recommendations

### 1. Filter Panel
```html
<div class="campaign-filters">
  <div class="filter-group">
    <label>جستجو در عنوان:</label>
    <input type="text" id="title-search" placeholder="عنوان کمپین...">
  </div>
  
  <div class="filter-group">
    <label>وضعیت:</label>
    <select id="status-filter">
      <option value="">همه</option>
      <option value="draft">پیش‌نویس</option>
      <option value="ready">آماده</option>
      <option value="running">در حال اجرا</option>
      <option value="completed">تکمیل شده</option>
      <option value="paused">متوقف شده</option>
      <option value="failed">ناموفق</option>
    </select>
  </div>
  
  <div class="filter-group">
    <label>تاریخ از:</label>
    <input type="date" id="start-date">
  </div>
  
  <div class="filter-group">
    <label>تاریخ تا:</label>
    <input type="date" id="end-date">
  </div>
  
  <button onclick="clearFilters()">پاک کردن فیلترها</button>
</div>
```

### 2. Search Bar
```html
<div class="search-bar">
  <input type="text" id="general-search" placeholder="جستجو در عنوان و متن کمپین...">
  <button onclick="performSearch()">جستجو</button>
</div>
```

### 3. Sort Options
```html
<div class="sort-options">
  <label>مرتب‌سازی بر اساس:</label>
  <select id="sort-by">
    <option value="createdAt">تاریخ ایجاد</option>
    <option value="startedAt">تاریخ شروع</option>
    <option value="completedAt">تاریخ تکمیل</option>
    <option value="title">عنوان</option>
  </select>
  
  <select id="sort-order">
    <option value="desc">نزولی</option>
    <option value="asc">صعودی</option>
  </select>
</div>
```

## 🧪 Testing Examples

### 1. Test Date Range Filter
```bash
curl -X GET "http://localhost:3000/api/campaigns?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Title Search
```bash
curl -X GET "http://localhost:3000/api/campaigns?title=فروش" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Advanced Search
```bash
curl -X GET "http://localhost:3000/api/campaigns/search?query=ویژه&status=completed&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test Create Campaign with Title
```bash
curl -X POST "http://localhost:3000/api/campaigns" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "کمپین تست",
    "message": "این یک کمپین تست است"
  }'
```

## 📈 Performance Considerations

1. **Database Indexes**: Added indexes for better query performance
2. **Pagination**: Always use pagination for large datasets
3. **Debouncing**: Implement debouncing for search inputs
4. **Caching**: Consider caching frequently accessed data
5. **Limit Results**: Set reasonable limits for search results

## 🔄 Migration Notes

- **Backward Compatible**: Existing API calls will continue to work
- **Optional Fields**: Title field is optional, existing campaigns won't break
- **Database**: No migration required, new fields are optional
- **Frontend**: Gradually implement new features without breaking existing functionality
