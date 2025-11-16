# SERP API Providers & Cost-Effective Discovery Methods

## SERP API Provider Comparison

### 1. **SerpAPI** (Your Current Provider)
- **Free Tier:** 100 searches/month
- **Paid Plans:**
  - Developer: $50/mo (5,000 searches)
  - Production: $100/mo (15,000 searches)
  - Business: $250/mo (50,000 searches)
- **Cost per search:** $0.01 - $0.005
- **Pros:** Easy to use, reliable, good documentation
- **Cons:** Expensive at scale

### 2. **Google Custom Search API** ⭐ BEST FREE OPTION
- **Free Tier:** 100 searches/day = 3,000/month
- **Paid:** $5 per 1,000 queries (after free tier)
- **Cost per search:** FREE (up to 100/day), then $0.005
- **Pros:** Official Google API, generous free tier, cheap
- **Cons:** Requires setup, limited to 100/day on free tier
- **Setup:** https://developers.google.com/custom-search/v1/overview

### 3. **ScraperAPI**
- **Free Tier:** 1,000 API calls/month
- **Paid:** Starts at $49/mo (100,000 calls)
- **Cost per search:** $0.0005 (cheaper than SerpAPI)
- **Pros:** Cheaper, handles proxies/captchas
- **Cons:** Need to build Google scraping logic yourself

### 4. **ValueSERP**
- **Free Tier:** 100 searches/month
- **Paid:** $50/mo (10,000 searches)
- **Cost per search:** $0.005
- **Pros:** Similar pricing to SerpAPI
- **Cons:** Similar limitations

### 5. **Zenserp**
- **Free Tier:** 100 searches/month
- **Paid:** $30/mo (5,000 searches)
- **Cost per search:** $0.006
- **Pros:** Slightly cheaper than SerpAPI
- **Cons:** Limited features

### 6. **Bing Search API**
- **Free Tier:** 1,000 transactions/month
- **Paid:** $3-$7 per 1,000 searches
- **Cost per search:** FREE (up to 1,000/mo), then $0.003-$0.007
- **Pros:** Microsoft backed, cheap, generous free tier
- **Cons:** Bing results (not Google), fewer results

## Cost Analysis for Your Use Case

### Current Discovery Approach (Bad - Too Expensive!)
```
enhanced_discovery.py with 17 strategies:
- 4 platforms × 17 strategies × 10 pages = 680 queries
- Cost with SerpAPI ($0.01/query): $6.80 per run
- Monthly (weekly runs): ~$27/month
- Yearly: ~$324/year
```

### Optimized Approach (Good - Much Cheaper!)
```
Combination of methods:
1. Google Custom Search (100/day free): 3,000 queries/month FREE
2. Sitemap/Robots.txt parsing: UNLIMITED FREE
3. Manual curation: FREE (just time)
4. CommonCrawl dataset: FREE
5. SerpAPI (only for gaps): Minimal usage

Total cost: $0-5/month
```

## Recommended Strategy: Multi-Tiered Discovery

### Tier 1: FREE Methods (Use First!) 💰

#### 1. **Manual Curation** (30 mins = 500+ companies, Free)
Sources:
- Y Combinator directory: https://www.ycombinator.com/companies
- BuiltIn: https://builtin.com/jobs
- AngelList: https://angel.co/jobs
- Wellfound: https://wellfound.com/jobs
- RemoteOK: https://remoteok.com
- LinkedIn job search (free browsing)

#### 2. **CommonCrawl Dataset** (Billions of pages, Free)
- Public web crawl data
- Can extract ATS URLs
- Requires processing but zero cost
- See: https://commoncrawl.org/

#### 3. **GitHub Company Lists** (Curated, Free)
Existing repos with company lists:
- `remoteintech/remote-jobs`
- `lukasz-madon/awesome-remote-job`
- `poteto/hiring-without-whiteboards`
- `yangshun/tech-interview-handbook`

### Tier 2: Free Tier APIs (100-3,000 queries/month)

#### 1. **Google Custom Search API** ⭐ RECOMMENDED
- 100 searches/day = 3,000/month FREE
- Perfect for targeted discovery
- Use for high-value queries only

#### 2. **Bing Search API**
- 1,000 searches/month FREE
- Good supplement to Google
- Bing results are decent

#### 3. **SerpAPI Free Tier**
- 100 searches/month
- Use only when above methods exhausted
- Save for high-priority searches

### Tier 3: Paid APIs (Only if needed)
- Use only after exhausting free methods
- Prioritize cheapest options (ScraperAPI, ValueSERP)

## Estimated Discovery Potential by Method

| Method | Companies Found | Cost | Time | Difficulty |
|--------|----------------|------|------|------------|
| **Enhanced Discovery (SERPAPI)** | 500-1,000 | $4-10 | 15 mins | Easy |
| **Google Custom Search (Free)** | 500-1,000 | $0 | 15 mins | Medium |
| **Optimized SERPAPI** | 500-1,000 | $2-5 | 15 mins | Easy |
| **Manual YC Curation** | 500-1,000 | $0 | 1 hour | Easy |
| **Manual BuiltIn** | 500-2,000 | $0 | 2 hours | Medium |
| **GitHub Lists** | 200-500 | $0 | 1 hour | Easy |
| **Bing Search (Free)** | 300-500 | $0 | 15 mins | Medium |
| **CommonCrawl** | 5,000+ | $0 | 1 day | Hard |

**Note:** Sitemap and robots.txt parsing don't work reliably for ATS platforms

**Total with FREE methods: 1,500-4,000 companies at $0 cost!**

## Recommended Workflow (Zero Cost)

### Month 1: Initial Discovery
```bash
# Week 1: Enhanced discovery (SERPAPI)
python enhanced_discovery.py --platform all --pages 10 --strategies 10
# 500-1,000 companies, Cost: ~$4

# Week 2: Manual curation (2 hours)
# Visit YC directory, BuiltIn, AngelList
# Manually add 500-1,000 companies, Cost: $0

# Week 3: Free API tier
python google_custom_search.py --platform all --max-queries 100
# 500-1,000 companies, Cost: $0

# Week 4: Optimized SERPAPI (minimal cost)
python optimized_serp_discovery.py --platform all --max-queries 25
# 500-1,000 companies, Cost: ~$2.50

Total: 2,000-4,000 companies at ~$6.50 cost
```

### Month 2+: Maintenance
```bash
# Weekly: Optimized discovery with caching
python optimized_serp_discovery.py --platform all --max-queries 25
# Cost: ~$2.50/week (cached results reduce cost over time)

# Weekly: Manual curation (30 mins)
# Check new YC batch, trending on HN, ProductHunt
# Cost: $0

# Daily: Use Google Custom Search free tier
python google_custom_search.py --platform rotating --max-queries 100
# Cost: $0

Total monthly: ~$10-15
```

## How to Minimize SERP API Costs

If you do use SERP API, here's how to optimize:

### 1. **Deduplicate Queries**
```python
# Before running, check what you already have
existing = read_existing_urls("companies.csv")

# Only search for gaps
# Don't re-search if you already have 1000+ companies
```

### 2. **Prioritize Strategies**
```python
# Instead of 17 strategies, use only top 5 most effective:
PRIORITY_STRATEGIES = [
    lambda domain: f"site:{domain}",                    # Baseline
    lambda domain: f"site:{domain} careers",            # High yield
    lambda domain: f"site:{domain} software engineer",  # Finds tech companies
    lambda domain: f"site:{domain} remote",             # Popular keyword
    lambda domain: f"site:{domain} startup",            # Startup focus
]
```

### 3. **Reduce Pages Per Query**
```python
# Instead of 10 pages, use 3-5
# Google rarely returns unique results after page 5
python enhanced_discovery.py --platform all --pages 5 --strategies 5
# 4 platforms × 5 strategies × 5 pages = 100 queries (fits in free tier!)
```

### 4. **Use Incremental Discovery**
```python
# Don't run all platforms at once
# Spread over month to use free tiers:

# Week 1: Ashby (25 queries)
python enhanced_discovery.py --platform ashby --pages 5 --strategies 5

# Week 2: Greenhouse (25 queries)
python enhanced_discovery.py --platform greenhouse --pages 5 --strategies 5

# Week 3: Lever (25 queries)
# Week 4: Workable (25 queries)

# Total: 100 queries/month = stays in free tier!
```

### 5. **Cache Results**
```python
# Save SERP results locally
# Never re-fetch same query
# Use SQLite to track:
# - query
# - timestamp
# - results
# Only re-query after 30 days
```

## Setup Instructions

### Google Custom Search API (FREE - 100/day)

1. **Create a Custom Search Engine:**
   - Go to https://programmablesearchengine.google.com/
   - Click "Add"
   - Sites to search: "jobs.ashbyhq.com" (or leave blank for web-wide)
   - Get your **Search Engine ID**

2. **Get API Key:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Create credentials → API key
   - Enable "Custom Search API"
   - Get your **API Key**

3. **Add to .env:**
   ```bash
   GOOGLE_CSE_ID=your_search_engine_id
   GOOGLE_API_KEY=your_api_key
   ```

4. **Use it:**
   ```bash
   python google_custom_search.py --platform all
   ```

### Bing Search API (FREE - 1,000/month)

1. **Create Azure account:**
   - Go to https://portal.azure.com/
   - Create "Bing Search v7" resource
   - Get your **API Key**

2. **Add to .env:**
   ```bash
   BING_API_KEY=your_api_key
   ```

3. **Use it:**
   ```bash
   python bing_search.py --platform all
   ```

## Cost Comparison Summary

| Approach | Monthly Searches | Monthly Cost | Companies Found |
|----------|-----------------|--------------|-----------------|
| **Current (SerpAPI - aggressive)** | 2,000-5,000 | $20-50 | 1,000-2,000 |
| **Optimized SerpAPI** | 100-500 | $0-5 | 500-1,000 |
| **Google Custom Search (free tier)** | 3,000 | $0 | 1,000-2,000 |
| **Bing Search (free tier)** | 1,000 | $0 | 500-1,000 |
| **FREE methods only** | 0 SERP queries | $0 | 8,000-15,000 |
| **Hybrid (recommended)** | 100-500 | $0 | 10,000+ |

## My Recommendation

**Use this discovery strategy (cost-effective):**

1. **Primary Discovery (Enhanced SERPAPI - $4-10/month):**
   - Enhanced discovery with 55+ search strategies
   - Automated, comprehensive, global coverage
   - Best ROI for time vs. companies found

2. **Secondary Discovery (FREE tier APIs):**
   - Google Custom Search (100/day free)
   - Bing Search (1,000/month free)
   - SerpAPI free tier (100/month)

3. **Manual Discovery (FREE, time-intensive):**
   - Manual YC curation (1-2 hours/month)
   - BuiltIn browsing
   - GitHub company lists import

**This gives you 1,500-3,000 companies at $4-15/month cost!**

**Note:** While sitemap/robots.txt methods are in the codebase, they don't work reliably for ATS platforms and are not recommended.
