# 🏷️ Automatic Campaign Title System

## 📋 Overview

The campaign system now automatically generates meaningful titles based on Persian (Jalali) dates instead of requiring users to manually enter titles.

## 🎯 Title Format

### Automatic Title Format
- **Format**: `YYYYMMDD` (8 digits)
- **Example**: `14040303` (3 خرداد 1404)
- **Meaning**: Campaign created on 3rd of Khordad, year 1404

### Human Readable Format
- **Format**: `کمپین [روز] [ماه] [سال]`
- **Example**: `کمپین ۳ خرداد ۱۴۰۴`
- **Purpose**: User-friendly display in UI

## 🔧 Implementation Details

### 1. Persian Date Utility (`src/utils/persianDate.js`)

```javascript
// Generate automatic title
const autoTitle = generateCampaignTitle(); // "14040303"

// Generate human readable title
const humanTitle = generateHumanReadableTitle(); // "کمپین ۳ خرداد ۱۴۰۴"

// Parse existing title
const parsedDate = parseCampaignTitle("14040303");
// Returns: { year: 1404, month: 3, day: 3, monthName: "خرداد" }
```

### 2. API Response Format

All campaign-related APIs now return both formats:

```json
{
  "campaign": {
    "id": "507f1f77bcf86cd799439011",
    "title": "14040303",
    "humanReadableTitle": "کمپین ۳ خرداد ۱۴۰۴",
    "status": "draft",
    "message": "سلام! پیشنهاد ویژه برای شما..."
  }
}
```

## 📅 Date Conversion Examples

| Gregorian Date | Persian Date | Auto Title | Human Title |
|----------------|--------------|------------|-------------|
| 2024-05-23 | 3 خرداد 1404 | 14040303 | کمپین ۳ خرداد ۱۴۰۴ |
| 2024-01-01 | 11 دی 1402 | 14021111 | کمپین ۱۱ دی ۱۴۰۲ |
| 2024-12-31 | 10 دی 1403 | 14031010 | کمپین ۱۰ دی ۱۴۰۳ |

## 🎨 Frontend Implementation

### 1. Display Campaign Titles

```javascript
// Display in campaign list
function renderCampaign(campaign) {
  return `
    <div class="campaign-item">
      <h3>${campaign.humanReadableTitle}</h3>
      <p>ID: ${campaign.title}</p>
      <p>Status: ${campaign.status}</p>
    </div>
  `;
}
```

### 2. Search by Date

```javascript
// Search campaigns by Persian date
function searchByDate(persianDate) {
  const title = generateCampaignTitle(persianDate);
  return fetch(`/api/campaigns?title=${title}`);
}

// Search campaigns created today
function searchToday() {
  const today = new Date();
  const title = generateCampaignTitle(today);
  return fetch(`/api/campaigns?title=${title}`);
}
```

### 3. Date Range Filtering

```javascript
// Filter campaigns by date range
function filterByDateRange(startDate, endDate) {
  const params = new URLSearchParams();
  
  if (startDate) {
    params.append('startDate', startDate.toISOString());
  }
  
  if (endDate) {
    params.append('endDate', endDate.toISOString());
  }
  
  return fetch(`/api/campaigns?${params}`);
}
```

## 🔍 Search and Filter Examples

### 1. Search by Specific Date
```bash
# Find campaigns created on 3 خرداد 1404
curl -X GET "http://localhost:3000/api/campaigns?title=14040303" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Search by Date Range
```bash
# Find campaigns created in خرداد 1404
curl -X GET "http://localhost:3000/api/campaigns?startDate=2024-05-21&endDate=2024-06-20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Advanced Search
```bash
# Search for campaigns containing "1404" in title
curl -X GET "http://localhost:3000/api/campaigns/search?query=1404" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Database Schema

### Campaign Model Updates
```javascript
{
  title: {
    type: String,
    required: false,
    trim: true
  }
  // ... other fields
}
```

### Indexes for Performance
```javascript
// Index for title-based searches
campaignSchema.index({ user: 1, title: 1 });
campaignSchema.index({ user: 1, createdAt: -1 });
```

## 🧪 Testing Examples

### 1. Test Title Generation
```javascript
const { generateCampaignTitle, generateHumanReadableTitle } = require('./src/utils/persianDate');

// Test with current date
console.log(generateCampaignTitle()); // "14040303"
console.log(generateHumanReadableTitle()); // "کمپین ۳ خرداد ۱۴۰۴"

// Test with specific date
const testDate = new Date('2024-05-23');
console.log(generateCampaignTitle(testDate)); // "14040303"
console.log(generateHumanReadableTitle(testDate)); // "کمپین ۳ خرداد ۱۴۰۴"
```

### 2. Test API Endpoints
```bash
# Create campaign (title auto-generated)
curl -X POST "http://localhost:3000/api/campaigns" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test campaign"}'

# Response will include auto-generated title
# {
#   "campaign": {
#     "title": "14040303",
#     "humanReadableTitle": "کمپین ۳ خرداد ۱۴۰۴"
#   }
# }
```

### 3. Test Date Parsing
```javascript
const { parseCampaignTitle } = require('./src/utils/persianDate');

const parsed = parseCampaignTitle("14040303");
console.log(parsed);
// {
//   year: 1404,
//   month: 3,
//   day: 3,
//   monthName: "خرداد"
// }
```

## 🎯 Benefits

### 1. **Consistency**
- All campaigns have meaningful, consistent titles
- No duplicate or confusing titles
- Easy to identify campaign creation date

### 2. **Searchability**
- Easy to find campaigns by date
- Efficient database queries with indexed titles
- Support for date range filtering

### 3. **User Experience**
- No need to think of titles
- Automatic organization by date
- Clear visual hierarchy

### 4. **Internationalization**
- Persian date system for Iranian users
- Human-readable format for display
- Machine-readable format for processing

## 🔄 Migration Notes

### Existing Campaigns
- Existing campaigns without titles will work normally
- New campaigns will automatically get titles
- No database migration required

### Backward Compatibility
- All existing API calls continue to work
- Frontend can gradually adopt new title system
- Fallback to original title if parsing fails

## 📈 Performance Considerations

1. **Indexing**: Added database indexes for title-based queries
2. **Caching**: Consider caching frequently accessed date conversions
3. **Validation**: Input validation for date parsing
4. **Error Handling**: Graceful fallback for invalid dates

## 🎨 UI/UX Recommendations

### 1. Campaign List Display
```html
<div class="campaign-item">
  <h3 class="campaign-title">کمپین ۳ خرداد ۱۴۰۴</h3>
  <span class="campaign-id">ID: 14040303</span>
  <span class="campaign-status">تکمیل شده</span>
</div>
```

### 2. Date Filter UI
```html
<div class="date-filters">
  <input type="date" id="start-date" placeholder="از تاریخ">
  <input type="date" id="end-date" placeholder="تا تاریخ">
  <button onclick="filterByDate()">فیلتر</button>
</div>
```

### 3. Search by Date
```html
<div class="date-search">
  <input type="text" id="date-search" placeholder="جستجو بر اساس تاریخ (مثال: 14040303)">
  <button onclick="searchByDate()">جستجو</button>
</div>
```

## 🚀 Future Enhancements

1. **Custom Title Formats**: Allow users to choose title format
2. **Date Range Shortcuts**: Quick filters for "امروز", "این هفته", "این ماه"
3. **Calendar Integration**: Visual calendar for campaign selection
4. **Export with Dates**: Include Persian dates in reports
5. **Timezone Support**: Handle different timezones for international users
