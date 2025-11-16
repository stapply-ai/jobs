"""
Optimized SERP Discovery
Minimizes paid SERP API usage by:
1. Only using top 5 most effective search strategies
2. Limiting pages to 5 per query (diminishing returns after that)
3. Spreading queries over time to use free tier quotas
4. Caching results to avoid duplicate queries
5. Checking existing data before searching
"""

from serpapi import GoogleSearch
import pandas as pd
import re
import os
import time
import json
from datetime import datetime, timedelta
from typing import Set, List, Dict
import sqlite3


# Platform configurations
PLATFORMS = {
    "ashby": {
        "domain": "jobs.ashbyhq.com",
        "pattern": r"(https://jobs\.ashbyhq\.com/[^/?#]+)",
        "csv_column": "ashby_url",
        "output_file": "ashby/companies.csv"
    },
    "greenhouse": {
        "domain": "job-boards.greenhouse.io",
        "pattern": r"(https://(?:job-boards|boards)\.greenhouse\.io/[^/?#]+)",
        "csv_column": "greenhouse_url",
        "output_file": "greenhouse/greenhouse_companies.csv"
    },
    "lever": {
        "domain": "jobs.lever.co",
        "pattern": r"(https://jobs\.lever\.co/[^/?#]+)",
        "csv_column": "lever_url",
        "output_file": "lever/lever_companies.csv"
    },
    "workable": {
        "domain": "apply.workable.com",
        "pattern": [
            r"(https://apply\.workable\.com/[^/?#]+)",
            r"(https://jobs\.workable\.com/company/[^/?#]+/[^/?#]+)"
        ],
        "csv_column": "workable_url",
        "output_file": "workable/workable_companies.csv"
    }
}

# Only use top 5 most effective strategies (instead of 17)
# These give the best results per query
PRIORITY_STRATEGIES = [
    lambda domain: f"site:{domain}",                      # Baseline - finds everything
    lambda domain: f"site:{domain} careers",              # High conversion
    lambda domain: f"site:{domain} software engineer",    # Tech companies
    lambda domain: f"site:{domain} remote",               # Popular keyword
    lambda domain: f"site:{domain} jobs",                 # Direct search
]


class QueryCache:
    """Cache SERP results to avoid duplicate queries"""

    def __init__(self, db_path: str = "serp_cache.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize SQLite cache database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS query_cache (
                query TEXT PRIMARY KEY,
                results TEXT,
                timestamp TEXT,
                result_count INTEGER
            )
        ''')

        conn.commit()
        conn.close()

    def get(self, query: str, max_age_days: int = 30) -> List[str] | None:
        """Get cached results if they exist and are fresh"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            'SELECT results, timestamp FROM query_cache WHERE query = ?',
            (query,)
        )

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        results_json, timestamp_str = row

        # Check if cache is fresh
        timestamp = datetime.fromisoformat(timestamp_str)
        age = datetime.now() - timestamp

        if age > timedelta(days=max_age_days):
            return None  # Cache expired

        # Parse and return results
        return json.loads(results_json)

    def set(self, query: str, results: List[str]):
        """Cache query results"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT OR REPLACE INTO query_cache (query, results, timestamp, result_count)
            VALUES (?, ?, ?, ?)
        ''', (
            query,
            json.dumps(results),
            datetime.now().isoformat(),
            len(results)
        ))

        conn.commit()
        conn.close()

    def stats(self) -> Dict:
        """Get cache statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*), SUM(result_count) FROM query_cache')
        total_queries, total_results = cursor.fetchone()

        cursor.execute('''
            SELECT COUNT(*) FROM query_cache
            WHERE timestamp > datetime('now', '-30 days')
        ''')
        fresh_queries = cursor.fetchone()[0]

        conn.close()

        return {
            "total_queries_cached": total_queries or 0,
            "total_results_cached": total_results or 0,
            "fresh_queries": fresh_queries or 0,
            "cache_file": self.db_path
        }


def read_existing_urls(csv_file: str, column_name: str) -> Set[str]:
    """Read existing URLs from CSV file"""
    existing_urls = set()
    if os.path.exists(csv_file):
        try:
            df = pd.read_csv(csv_file)
            if column_name in df.columns:
                existing_urls = set(df[column_name].dropna().tolist())
            elif "url" in df.columns:
                existing_urls = set(df["url"].dropna().tolist())
        except Exception as e:
            print(f"⚠️  Error reading {csv_file}: {e}")
    return existing_urls


def extract_urls_from_results(results: dict, pattern: str | List[str], domain: str) -> Set[str]:
    """Extract company URLs from search results"""
    urls = set()

    for res in results.get("organic_results", []):
        link = res.get("link")
        if not link or domain not in link:
            continue

        # Handle single pattern or list of patterns
        patterns = [pattern] if isinstance(pattern, str) else pattern

        for pat in patterns:
            match = re.match(pat, link)
            if match:
                urls.add(match.group(1))
                break

    return urls


def optimized_discover(
    platform_name: str,
    max_queries: int = 25,
    use_cache: bool = True,
    cache_max_age_days: int = 30
):
    """
    Optimized SERP discovery that minimizes API usage

    Args:
        platform_name: Platform to discover
        max_queries: Maximum SERP queries to use (default: 25)
        use_cache: Use cached results if available (default: True)
        cache_max_age_days: Max age of cached results in days (default: 30)
    """

    if platform_name not in PLATFORMS:
        print(f"❌ Unknown platform: {platform_name}")
        return

    config = PLATFORMS[platform_name]

    print("=" * 80)
    print(f"🎯 Optimized SERP Discovery: {platform_name.upper()}")
    print(f"📊 Max queries: {max_queries}")
    print(f"🔧 Strategies: {len(PRIORITY_STRATEGIES)} (top performers only)")
    print(f"💾 Cache: {'Enabled' if use_cache else 'Disabled'}")
    print("=" * 80)

    # Initialize cache
    cache = QueryCache() if use_cache else None

    if cache:
        stats = cache.stats()
        print(f"\n📦 Cache stats:")
        print(f"  Cached queries: {stats['total_queries_cached']}")
        print(f"  Fresh queries (<30 days): {stats['fresh_queries']}")
        print(f"  Total cached results: {stats['total_results_cached']}")

    # Read existing URLs
    existing_urls = read_existing_urls(config["output_file"], config["csv_column"])
    print(f"\n📖 Existing URLs: {len(existing_urls)}")

    # Check if we already have good coverage
    if len(existing_urls) > 1000:
        print(f"\n💡 You already have {len(existing_urls)} companies!")
        print("   Consider using free methods (sitemap, manual) instead of SERP API")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("❌ Aborted")
            return

    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        print("\n❌ SERPAPI_API_KEY not found in environment")
        return

    all_urls = set()
    queries_used = 0
    queries_from_cache = 0

    # Use only top strategies
    for strategy_idx, strategy_func in enumerate(PRIORITY_STRATEGIES, 1):
        if queries_used >= max_queries:
            print(f"\n⚠️  Reached query limit ({max_queries})")
            break

        query_base = strategy_func(config["domain"])
        print(f"\n[Strategy {strategy_idx}/{len(PRIORITY_STRATEGIES)}] {query_base}")

        strategy_urls = set()

        # Limit to 5 pages per query (diminishing returns after that)
        for page in range(5):
            if queries_used >= max_queries:
                break

            query = f"{query_base} (page {page + 1})"

            # Check cache first
            cached_results = None
            if cache:
                cached_results = cache.get(query, max_age_days=cache_max_age_days)

            if cached_results:
                # Use cached results
                print(f"  Page {page + 1}: 💾 Using cached results")
                for url in cached_results:
                    # Re-apply pattern matching
                    patterns = [config["pattern"]] if isinstance(config["pattern"], str) else config["pattern"]
                    for pat in patterns:
                        if re.match(pat, url):
                            strategy_urls.add(url)
                            break

                queries_from_cache += 1

            else:
                # Make actual SERP API call
                params = {
                    "engine": "google_light",
                    "q": query_base,
                    "start": page * 10,
                    "api_key": api_key,
                }

                try:
                    search = GoogleSearch(params)
                    results = search.get_dict()

                    # Extract URLs
                    page_urls = extract_urls_from_results(results, config["pattern"], config["domain"])

                    # Cache results
                    if cache and page_urls:
                        cache.set(query, list(page_urls))

                    strategy_urls.update(page_urls)

                    queries_used += 1

                    new_on_page = page_urls - all_urls
                    print(f"  Page {page + 1}: 🔍 API call (+{len(new_on_page)} new)")

                    # Delay to be respectful
                    time.sleep(1)

                except Exception as e:
                    print(f"  ⚠️  Error: {e}")
                    break

        new_from_strategy = strategy_urls - all_urls
        all_urls.update(strategy_urls)

        print(f"  Strategy total: +{len(new_from_strategy)} new (cumulative: {len(all_urls)})")

    # Calculate costs
    cost_per_query = 0.01  # SerpAPI cost
    api_queries = queries_used - queries_from_cache
    cost = api_queries * cost_per_query

    print(f"\n📊 Discovery Summary:")
    print(f"  🔍 Total queries: {queries_used}")
    print(f"  💾 From cache: {queries_from_cache}")
    print(f"  🌐 API calls: {api_queries}")
    print(f"  💰 Cost: ${cost:.2f}")
    print(f"  🔍 Companies found: {len(all_urls)}")
    print(f"  🆕 New companies: {len(all_urls - existing_urls)}")

    # Save results
    combined_urls = existing_urls.union(all_urls)
    df = pd.DataFrame({config["csv_column"]: sorted(combined_urls)})
    df.to_csv(config["output_file"], index=False)

    print(f"\n✅ Saved {len(df)} companies to {config['output_file']}")

    if len(all_urls - existing_urls) > 0:
        print(f"\n🎉 Sample of new URLs (first 10):")
        for url in sorted(all_urls - existing_urls)[:10]:
            print(f"  ✨ {url}")


def discover_all_optimized(max_queries_per_platform: int = 25):
    """
    Discover all platforms with optimized SERP usage
    Total: 4 platforms × 25 queries = 100 queries (fits in free tier if you have it)
    """

    print("=" * 80)
    print("🎯 Optimized SERP Discovery - All Platforms")
    print(f"📊 Budget: {max_queries_per_platform} queries per platform")
    print(f"📊 Total: {len(PLATFORMS) * max_queries_per_platform} queries")
    print("=" * 80)

    total_cost = 0

    for platform_name in PLATFORMS.keys():
        print("\n" + "=" * 80)
        optimized_discover(platform_name, max_queries=max_queries_per_platform)
        print("=" * 80)
        time.sleep(2)

    print("\n" + "=" * 80)
    print("✅ All platforms discovered!")
    print(f"💡 Tip: Run sitemap_discovery.py (FREE) to find even more companies")
    print("=" * 80)


def show_cache_stats():
    """Show statistics about the query cache"""
    cache = QueryCache()
    stats = cache.stats()

    print("=" * 80)
    print("📦 SERP Query Cache Statistics")
    print("=" * 80)
    print(f"\nCache file: {stats['cache_file']}")
    print(f"Total queries cached: {stats['total_queries_cached']}")
    print(f"Fresh queries (<30 days): {stats['fresh_queries']}")
    print(f"Total results cached: {stats['total_results_cached']}")
    print(f"\n💡 Cached queries save you money by avoiding duplicate API calls")
    print("=" * 80)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Optimized SERP discovery (minimizes API costs)"
    )
    parser.add_argument(
        "--platform",
        choices=list(PLATFORMS.keys()) + ["all"],
        default="all",
        help="Platform to discover (default: all)"
    )
    parser.add_argument(
        "--max-queries",
        type=int,
        default=25,
        help="Max queries per platform (default: 25)"
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Disable query caching"
    )
    parser.add_argument(
        "--cache-stats",
        action="store_true",
        help="Show cache statistics and exit"
    )

    args = parser.parse_args()

    if args.cache_stats:
        show_cache_stats()
    elif args.platform == "all":
        discover_all_optimized(max_queries_per_platform=args.max_queries)
    else:
        optimized_discover(
            args.platform,
            max_queries=args.max_queries,
            use_cache=not args.no_cache
        )
