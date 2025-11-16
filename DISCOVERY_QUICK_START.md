# Company Discovery Quick Start Guide

## TL;DR - What to Run Right Now

### Option 1: Enhanced Discovery (Recommended) 🌟
```bash
# Uses 55+ search strategies to find the most companies
python enhanced_discovery.py --platform all --pages 10 --strategies 10
# Cost: ~$4 (SERPAPI_API_KEY required), Time: 15 minutes
# Finds: 500-1,000 companies
```

### Option 2: FREE API Tier (No cost!)
```bash
# Google Custom Search (100/day = 3,000/month FREE)
# Setup: See SERP_ALTERNATIVES.md for Google API setup (5 minutes)
python google_custom_search.py --platform all --max-queries 100
# Cost: $0, Time: 10 minutes
# Finds: 500-1,000 companies
```

### Option 3: Optimized Discovery (Minimal cost)
```bash
# Uses query caching and top 5 strategies
python optimized_serp_discovery.py --platform all --max-queries 25
# Cost: ~$2.50 (25 queries × 4 platforms × $0.01)
# Time: 15 minutes
# Finds: 500-1,000 companies
```

### Option 4: Manual Curation (FREE, time-intensive)
```bash
# Visit company directories and check careers pages
# Y Combinator: https://www.ycombinator.com/companies
# BuiltIn: https://builtin.com/jobs
# Cost: $0, Time: 30-60 minutes
# Finds: 500-1,000 companies
```

---

## Detailed Comparison

| Method | Cost | Time | Companies | Setup | Recurring |
|--------|------|------|-----------|-------|-----------|
| **Enhanced Discovery** | $4-10 | 15 min | 500-1,000 | SERPAPI key | Weekly |
| **Google Custom Search** | $0 | 15 min | 500-1,000 | Google API | Daily (100/day limit) |
| **Optimized SerpAPI** | $2-5 | 15 min | 500-1,000 | SERPAPI key | As needed |
| **Manual YC Curation** | $0 | 1 hour | 500-1,000 | None | Monthly |
| **Bing Search API** | $0 | 15 min | 300-500 | Bing API | Monthly (1K limit) |

---

## Which Script Should I Use?

### Use `enhanced_discovery.py` when:
- ✅ You want the MOST companies with automated search
- ✅ You have SERPAPI_API_KEY set up
- ✅ You want 55+ different search strategies
- ✅ Budget is not a major concern ($4-10 per run)
- ✅ You want comprehensive global coverage

**Best for:** Maximum automated discovery, global company coverage

### Use `google_custom_search.py` when:
- ✅ You want FREE API-based discovery
- ✅ You don't mind setting up Google API (5 min setup)
- ✅ You can wait 1 week to use full free quota (100/day)
- ✅ You want better search quality than sitemaps

**Best for:** Ongoing weekly discovery, supplementing sitemap results

### Use `optimized_serp_discovery.py` when:
- ✅ You already have SerpAPI account
- ✅ You want to minimize SerpAPI costs
- ✅ You need fast results
- ✅ You want query caching to save money

**Best for:** Paid discovery with cost optimization

### Don't use `sitemap_discovery.py`:
- ❌ Sitemap-based discovery doesn't work reliably for ATS platforms
- ❌ Most ATS platforms don't expose comprehensive sitemaps
- ❌ Use enhanced_discovery.py or google_custom_search.py instead

**Note:** While included in the codebase, sitemap discovery is not recommended

### Use `alternative_discovery.py` when:
- ✅ You want guidance on manual methods
- ✅ You want to try robots.txt discovery
- ✅ You're exploring alternative data sources

**Best for:** Learning about non-SERP discovery methods

---

## Recommended Workflow

### Week 1: Initial Discovery
```bash
# Day 1: Enhanced discovery (SERPAPI)
python enhanced_discovery.py --platform all --pages 10 --strategies 10
# Expected: +500-1,000 companies, Cost: ~$4

# Day 2-3: Manual curation (1 hour)
# Visit Y Combinator, BuiltIn, AngelList
# Expected: +500-1,000 companies, Cost: $0

# Total Week 1: 1,000-2,000 companies at ~$4
```

### Week 2: API-based Discovery (FREE)
```bash
# Set up Google Custom Search API (one-time, 5 mins)
# See SERP_ALTERNATIVES.md for setup

# Run daily (takes 1 minute per day)
python google_custom_search.py --platform ashby --max-queries 100

# Rotate platforms daily:
# Monday: Ashby
# Tuesday: Greenhouse
# Wednesday: Lever
# Thursday: Workable
# Friday-Sunday: Break or repeat

# Total Week 2: +700-1,000 companies at $0
```

### Week 3: Supplemental Discovery
```bash
# Re-run sitemap (companies add new jobs weekly)
python sitemap_discovery.py --platform all

# If needed, use optimized SERP
python optimized_serp_discovery.py --platform greenhouse --max-queries 25
# Cost: ~$2.50

# Total Week 3: +500-1,000 companies at $0-2.50
```

### Week 4+: Maintenance (FREE)
```bash
# Weekly: Re-run sitemap discovery
python sitemap_discovery.py --platform all

# Monthly: Manual curation (30 mins)
# Check new YC batch, trending companies

# As needed: Use free Google Custom Search quota
```

**Total in First Month: 3,700-8,000 companies at $0-5 cost**

---

## Setup Instructions

### 1. Enhanced Discovery (SERPAPI setup)
```bash
# Add to .env file
echo "SERPAPI_API_KEY=your_key_here" >> .env

# Run discovery
python enhanced_discovery.py --platform all --pages 10 --strategies 10
```

Get your SERPAPI key from: https://serpapi.com/ (100 free queries/month, then $50/mo for 5,000)

### 2. Google Custom Search API (5 min setup, FREE)

**Step 1: Create Custom Search Engine**
1. Go to: https://programmablesearchengine.google.com/
2. Click "Add"
3. Name: "ATS Company Discovery"
4. Search: "Entire web"
5. Click "Create"
6. Copy your **Search Engine ID** (looks like: `a1b2c3d4e5f6g7h8i`)

**Step 2: Get API Key**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy your **API Key**
4. Click "Restrict Key"
5. Under "API restrictions", select "Custom Search API"
6. Save

**Step 3: Add to .env**
```bash
echo "GOOGLE_API_KEY=your_api_key_here" >> .env
echo "GOOGLE_CSE_ID=your_search_engine_id" >> .env
```

**Step 4: Test**
```bash
python google_custom_search.py --platform ashby --max-queries 10
```

**Free Tier:** 100 searches/day = 3,000/month

### 3. Bing Search API (5 min setup, FREE)

**Step 1: Create Azure Account**
1. Go to: https://portal.azure.com/
2. Sign up (free account, no credit card for free tier)
3. Search for "Bing Search v7"
4. Click "Create"
5. Choose "Free" pricing tier (1,000 searches/month)
6. Copy your **API Key**

**Step 2: Add to .env**
```bash
echo "BING_API_KEY=your_api_key_here" >> .env
```

**Free Tier:** 1,000 searches/month

### 4. SerpAPI (Optional, $50/month)

Only if you need paid discovery:
1. Go to: https://serpapi.com/
2. Sign up
3. Get your API key
4. Add to .env:
```bash
echo "SERPAPI_API_KEY=your_api_key" >> .env
```

**Free Tier:** 100 searches/month
**Paid:** $50/month for 5,000 searches

---

## Cost Optimization Tips

### Tip 1: Always Start with FREE Methods
Never use paid APIs until you've exhausted free options:
1. Sitemap discovery (FREE, unlimited)
2. Manual curation (FREE, unlimited)
3. Google Custom Search (FREE, 100/day)
4. Bing Search (FREE, 1,000/month)
5. SerpAPI free tier (FREE, 100/month)

**Total FREE quota: 4,100+ queries/month**

### Tip 2: Use Query Caching
The optimized SERP script caches results:
```bash
python optimized_serp_discovery.py --platform ashby --max-queries 25
# First run: Uses 25 API calls
# Second run: Uses 0 API calls (cached!)

# Check cache stats
python optimized_serp_discovery.py --cache-stats
```

### Tip 3: Spread Discovery Over Time
Don't run all queries at once. Spread over weeks to use free tiers:

**Week 1:**
```bash
python google_custom_search.py --platform ashby --max-queries 100
```

**Week 2:**
```bash
python google_custom_search.py --platform greenhouse --max-queries 100
```

**Week 3:**
```bash
python google_custom_search.py --platform lever --max-queries 100
```

**Week 4:**
```bash
python google_custom_search.py --platform workable --max-queries 100
```

**Total: 400 queries over 4 weeks = $0 cost**

### Tip 4: Prioritize High-Value Platforms
If you have limited budget, focus on platforms with most companies:

1. **Greenhouse** (~5,000 companies) - Highest priority
2. **Lever** (~3,000 companies) - High priority
3. **Ashby** (~2,000 companies) - Medium priority
4. **Workable** (~1,000 companies) - Lower priority

### Tip 5: Manual Curation is Free
30-60 minutes of manual work can find 500-1,000 companies:

**Best Sources:**
- Y Combinator: https://www.ycombinator.com/companies
  - 4,000+ startups, many use modern ATS
- BuiltIn: https://builtin.com/jobs
  - 50,000+ tech jobs with ATS links
- AngelList: https://angel.co/jobs
  - Startup jobs with ATS links
- Wellfound: https://wellfound.com/jobs
  - Tech startup jobs

**Method:**
1. Visit company's careers page
2. Right-click → "View Page Source"
3. Search for:
   - `ashbyhq.com`
   - `greenhouse.io`
   - `lever.co`
   - `workable.com`
4. Add company to CSV if found

---

## Expected Results

### Sitemap Discovery (FREE)
| Platform | Current | Expected | Growth |
|----------|---------|----------|--------|
| Ashby | 474 | 1,200-2,000 | +153-322% |
| Greenhouse | 296 | 800-1,500 | +170-407% |
| Lever | 444 | 1,000-1,800 | +125-305% |
| Workable | 218 | 400-800 | +83-267% |
| **Total** | **1,432** | **3,400-6,100** | **+137-326%** |

### Google Custom Search (FREE, 100 queries)
| Platform | Expected New Companies | Cost |
|----------|----------------------|------|
| Ashby | 200-400 | $0 |
| Greenhouse | 300-500 | $0 |
| Lever | 200-400 | $0 |
| Workable | 100-200 | $0 |
| **Total** | **800-1,500** | **$0** |

### Manual Curation (FREE, 1 hour)
| Source | Companies | Time |
|--------|-----------|------|
| Y Combinator | 200-400 | 30 min |
| BuiltIn | 200-400 | 20 min |
| AngelList | 100-200 | 10 min |
| **Total** | **500-1,000** | **1 hour** |

---

## Summary: Best Strategy

**For maximum results at zero cost:**

```bash
# Week 1: Automated discovery (10 minutes)
python sitemap_discovery.py --platform all
# Result: +2,000-5,000 companies

# Week 2: Manual curation (1 hour)
# Visit YC, BuiltIn, AngelList
# Result: +500-1,000 companies

# Week 3-6: Daily Google Custom Search (5 min/day)
# Run daily with 100 query limit, rotate platforms
python google_custom_search.py --platform [rotating] --max-queries 100
# Result: +1,500-2,500 companies over 4 weeks

# Total after 6 weeks: 4,000-8,500 companies at $0 cost
```

**This is 4-6x more companies than you currently have, at zero cost!**

---

## Troubleshooting

### "No companies found in sitemap"
- Some platforms don't have public sitemaps
- Try robots.txt discovery: `python sitemap_discovery.py --platform robots`
- Fall back to API methods

### "Daily quota exceeded" (Google Custom Search)
- Quota resets every 24 hours
- Wait until tomorrow or use different method
- Or upgrade to paid tier ($5 per 1,000 queries after free tier)

### "SERPAPI_API_KEY not found"
- You don't need SerpAPI for free methods!
- Use `sitemap_discovery.py` or `google_custom_search.py` instead
- Only use SerpAPI if you have budget

### "Rate limit error"
- Add delays between requests
- Use query caching (optimized_serp_discovery.py)
- Spread discovery over multiple days

---

## Quick Reference

| Need | Use This | Cost | Time |
|------|----------|------|------|
| Quick start, zero setup | `sitemap_discovery.py --platform all` | $0 | 10 min |
| Best free results | Sitemap + Manual curation | $0 | 1 hour |
| API-based free | `google_custom_search.py` | $0 | 15 min |
| Minimize paid costs | `optimized_serp_discovery.py` | $2-5 | 15 min |
| Maximum coverage (expensive) | `enhanced_discovery.py` | $10-20 | 30 min |

**Recommendation: Start with sitemap_discovery.py (FREE, unlimited, finds 2,000-5,000 companies!)**
