"""
SearXNG-Based Company Discovery
FREE self-hosted search alternative - NO API costs or limits!

Advantages:
- Completely FREE (self-hosted)
- No API limits or rate limiting
- No API keys needed
- Privacy-focused
- Aggregates results from multiple search engines
- No usage tracking or costs

Requirements:
- SearXNG instance running (see SEARXNG_SETUP.md)
- SEARXNG_URL in .env pointing to your instance

Pricing: $0 (self-hosted)
"""

import requests
import pandas as pd
import re
import os
from typing import Set, List
from dotenv import load_dotenv
import time

load_dotenv()

# Platform configurations
PLATFORMS = {
    "ashby": {
        "domains": ["jobs.ashbyhq.com"],
        "pattern": r"(https://jobs\.ashbyhq\.com/[^/?#]+)",
        "csv_column": "ashby_url",
        "output_file": "ashby/companies.csv",
    },
    "greenhouse": {
        "domains": ["job-boards.greenhouse.io", "boards.greenhouse.io"],
        "pattern": r"(https://(?:job-boards|boards)\.greenhouse\.io/[^/?#]+)",
        "csv_column": "greenhouse_url",
        "output_file": "greenhouse/greenhouse_companies.csv",
    },
    "lever": {
        "domains": ["jobs.lever.co"],
        "pattern": r"(https://jobs\.lever\.co/[^/?#]+)",
        "csv_column": "lever_url",
        "output_file": "lever/lever_companies.csv",
    },
    "workable": {
        "domains": ["apply.workable.com", "jobs.workable.com"],
        "pattern": [
            r"(https://apply\.workable\.com/[^/?#]+)",
            r"(https://jobs\.workable\.com/company/[^/?#]+/[^/?#]+)",
        ],
        "csv_column": "workable_url",
        "output_file": "workable/workable_companies.csv",
    },
}

# Search query strategies
SEARCH_STRATEGIES = [
    # Basic site search
    lambda domain: f"site:{domain}",

    # Job-related searches
    lambda domain: f"site:{domain} careers",
    lambda domain: f"site:{domain} jobs",
    lambda domain: f"site:{domain} hiring",
    lambda domain: f"site:{domain} \"we're hiring\"",
    lambda domain: f"site:{domain} apply now",

    # Role-based searches (helps find niche companies)
    lambda domain: f"site:{domain} software engineer",
    lambda domain: f"site:{domain} product manager",
    lambda domain: f"site:{domain} data scientist",
    lambda domain: f"site:{domain} designer",
    lambda domain: f"site:{domain} sales",
    lambda domain: f"site:{domain} marketing",
    lambda domain: f"site:{domain} \"engineering\"",
    lambda domain: f"site:{domain} \"product\"",
    lambda domain: f"site:{domain} \"data\"",
    lambda domain: f"site:{domain} \"design\"",
    lambda domain: f"site:{domain} \"sales\"",
    lambda domain: f"site:{domain} \"marketing\"",

    # Remote/location searches
    lambda domain: f"site:{domain} remote",
    lambda domain: f"site:{domain} \"San Francisco\"",
    lambda domain: f"site:{domain} \"New York\"",
    lambda domain: f"site:{domain} \"London\"",
    lambda domain: f"site:{domain} \"Paris\"",
    lambda domain: f"site:{domain} \"Berlin\"",
    lambda domain: f"site:{domain} \"Amsterdam\"",
    lambda domain: f"site:{domain} \"Stockholm\"",
    lambda domain: f"site:{domain} \"Warsaw\"",
    lambda domain: f"site:{domain} \"Brussels\"",
    lambda domain: f"site:{domain} \"Zurich\"",
    lambda domain: f"site:{domain} \"Delhi\"",
    lambda domain: f"site:{domain} \"Mumbai\"",
    lambda domain: f"site:{domain} \"Bangalore\"",
    lambda domain: f"site:{domain} \"Chennai\"",
    lambda domain: f"site:{domain} \"Hyderabad\"",
    lambda domain: f"site:{domain} \"Pune\"",
    lambda domain: f"site:{domain} \"Kolkata\"",
    lambda domain: f"site:{domain} \"Jaipur\"",
    lambda domain: f"site:{domain} \"Singapore\"",
    lambda domain: f"site:{domain} \"Dubai\"",
    lambda domain: f"site:{domain} \"Tokyo\"",
    lambda domain: f"site:{domain} \"Seoul\"",
    lambda domain: f"site:{domain} \"Hong Kong\"",
    lambda domain: f"site:{domain} \"Toronto\"",
    lambda domain: f"site:{domain} \"Montreal\"",
    lambda domain: f"site:{domain} \"Vancouver\"",
    lambda domain: f"site:{domain} \"Sydney\"",

    lambda domain: f"site:{domain} \"Europe\"",
    lambda domain: f"site:{domain} \"Asia\"",
    lambda domain: f"site:{domain} \"Middle East\"",
    lambda domain: f"site:{domain} \"North America\"",
    lambda domain: f"site:{domain} \"South America\"",

    # Company type searches
    lambda domain: f"site:{domain} startup",
    lambda domain: f"site:{domain} YC OR \"Y Combinator\"",
    lambda domain: f"site:{domain} series A OR series B",
    lambda domain: f"site:{domain} \"tech startup\"",
    lambda domain: f"site:{domain} \"tech company\"",
]


def read_existing_urls(csv_file: str, column_name: str) -> Set[str]:
    """Read existing URLs from CSV file"""
    existing_urls = set()
    if os.path.exists(csv_file):
        try:
            df = pd.read_csv(csv_file)
            if column_name in df.columns:
                existing_urls = set(df[column_name].dropna().tolist())
                print(f"📖 Found {len(existing_urls)} existing URLs in {csv_file}")
            elif "url" in df.columns:
                existing_urls = set(df["url"].dropna().tolist())
                print(
                    f"📖 Found {len(existing_urls)} existing URLs in {csv_file} (legacy format)"
                )
        except Exception as e:
            print(f"⚠️  Error reading {csv_file}: {e}")
    return existing_urls


def extract_urls_from_results(
    results: List[dict], pattern: str | List[str], domains: List[str]
) -> Set[str]:
    """Extract company URLs from SearXNG search results"""
    urls = set()

    if not results:
        return urls

    for result in results:
        url = result.get("url", "")

        if not url:
            continue

        # Check if URL contains target domain
        if not any(domain in url for domain in domains):
            continue

        # Handle single pattern or list of patterns
        patterns = [pattern] if isinstance(pattern, str) else pattern

        for pat in patterns:
            match = re.match(pat, url)
            if match:
                urls.add(match.group(1))
                break

    return urls


def search_searxng(
    searxng_url: str,
    query: str,
    page: int = 1,
    engines: str = "bing,brave,startpage,google",
) -> List[dict]:
    """
    Perform search using SearXNG instance

    Args:
        searxng_url: Base URL of SearXNG instance (e.g., http://localhost:8080)
        query: Search query
        page: Page number (default: 1)
        engines: Comma-separated list of search engines to use

    Returns:
        List of search results
    """
    endpoint = f"{searxng_url.rstrip('/')}/search"

    params = {
        "q": query,
        "format": "json",
        "pageno": page,
        "engines": engines,
        "language": "en",
        "safesearch": 0,  # 0=off, 1=moderate, 2=strict
    }

    try:
        response = requests.get(endpoint, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()
        return data.get("results", [])

    except requests.exceptions.RequestException as e:
        print(f"  ⚠️  Error querying SearXNG: {e}")
        return []
    except Exception as e:
        print(f"  ⚠️  Unexpected error: {e}")
        return []


def discover_platform(
    platform_name: str,
    max_queries: int = 20,
    pages_per_query: int = 3,
    engines: str = "bing,brave,startpage,google",
):
    """
    Discover companies using SearXNG

    Args:
        platform_name: Platform to discover
        max_queries: Maximum search queries to use (default: unlimited)
        pages_per_query: Pages per query (default: 3)
        engines: Search engines to use (default: google,duckduckgo,bing)
    """

    if platform_name not in PLATFORMS:
        print(f"❌ Unknown platform: {platform_name}")
        print(f"Available platforms: {', '.join(PLATFORMS.keys())}")
        return

    config = PLATFORMS[platform_name]

    print("=" * 80)
    print(f"🔍 SearXNG Discovery: {platform_name.upper()}")
    print(f"📊 Max queries: {max_queries}")
    print(f"📊 Pages per query: {pages_per_query}")
    print(f"🔧 Engines: {engines}")
    print("=" * 80)

    # Check for SearXNG URL
    searxng_url = os.getenv("SEARXNG_URL")
    if not searxng_url:
        print("\n❌ SEARXNG_URL not found in environment")
        print("\nSetup instructions:")
        print("1. Set up SearXNG (see SEARXNG_SETUP.md)")
        print("2. Add to .env file:")
        print("   SEARXNG_URL=http://localhost:8080")
        print("\nOr use a public instance (if available):")
        print("   SEARXNG_URL=https://searx.be")
        print("\n💰 Cost: $0 (self-hosted, no limits!)")
        return

    # Test SearXNG connection
    print(f"\n🔗 Testing connection to {searxng_url}...")
    test_results = search_searxng(searxng_url, "test", page=1, engines=engines)
    if not test_results:
        print("❌ Failed to connect to SearXNG or no results returned")
        print("   Make sure:")
        print("   - SearXNG is running")
        print("   - JSON format is enabled in settings.yml")
        print("   - URL is correct in .env")
        return
    print(f"✅ Connected! Got {len(test_results)} test results")

    # Read existing URLs
    existing_urls = read_existing_urls(config["output_file"], config["csv_column"])

    all_urls = set()
    queries_used = 0
    total_results_fetched = 0

    # Use search strategies
    strategies_to_use = SEARCH_STRATEGIES if max_queries == -1 else SEARCH_STRATEGIES[:max_queries]

    for strategy_idx, strategy_func in enumerate(strategies_to_use, 1):
        if max_queries != -1 and queries_used >= max_queries:
            print(f"\n⚠️  Reached query limit ({max_queries if max_queries != -1 else 'unlimited'})")
            break

        query = strategy_func(config["domains"][0])
        print(f"\n[Query {queries_used + 1}/{max_queries if max_queries != -1 else 'unlimited'}] {query}")

        query_urls = set()

        for page in range(1, pages_per_query + 1):
            try:
                # SearXNG search
                results = search_searxng(searxng_url, query, page=page, engines=engines)

                total_results_fetched += len(results)

                if not results:
                    print(f"  Page {page}: No results")
                    break

                # Extract URLs
                page_urls = extract_urls_from_results(
                    results, config["pattern"], config["domains"]
                )

                new_in_page = page_urls - all_urls - query_urls
                query_urls.update(page_urls)

                print(
                    f"  Page {page}: {len(results)} results, {len(page_urls)} relevant URLs (+{len(new_in_page)} new)"
                )

                # Small delay to be respectful
                time.sleep(0.5)

            except Exception as e:
                print(f"  ⚠️  Error on page {page}: {e}")
                break

        queries_used += 1
        new_from_query = query_urls - all_urls
        all_urls.update(query_urls)

        print(
            f"  Query total: +{len(new_from_query)} new URLs (cumulative: {len(all_urls)})"
        )

    # Cost calculation (always $0 for self-hosted)
    print(f"\n📊 Discovery Summary:")
    print(f"  🔍 Queries used: {queries_used}")
    print(f"  📄 Total results fetched: {total_results_fetched}")
    print(f"  💰 Cost: $0 (self-hosted, unlimited!)")
    print(f"  🔍 Companies found: {len(all_urls)}")
    print(f"  🆕 New companies: {len(all_urls - existing_urls)}")

    # Save results
    combined_urls = existing_urls.union(all_urls)
    new_urls = all_urls - existing_urls

    if new_urls:
        print(f"\n🎉 Sample of new URLs (first 10):")
        for url in sorted(new_urls)[:10]:
            print(f"  ✨ {url}")
        if len(new_urls) > 10:
            print(f"  ... and {len(new_urls) - 10} more")

    df = pd.DataFrame({config["csv_column"]: sorted(combined_urls)})
    df.to_csv(config["output_file"], index=False)

    print(f"\n✅ Saved {len(df)} companies to {config['output_file']}")


def discover_all_platforms(
    max_queries_per_platform: int = -1,
    pages_per_query: int = 3,
    engines: str = "bing,brave,startpage,google",
):
    """Discover all platforms using SearXNG"""

    print("=" * 80)
    print("🔍 SearXNG Discovery - All Platforms")
    print(f"📊 Queries per platform: {max_queries_per_platform}")
    print(f"📊 Pages per query: {pages_per_query}")
    print(f"🔧 Engines: {engines}")
    print(f"💰 Cost: $0 (self-hosted, unlimited!)")
    print("=" * 80)

    for platform_name in PLATFORMS.keys():
        print("\n" + "=" * 80)
        discover_platform(
            platform_name,
            max_queries=max_queries_per_platform,
            pages_per_query=pages_per_query,
            engines=engines,
        )
        print("=" * 80)
        time.sleep(2)

    print("\n" + "=" * 80)
    print("✅ All platforms discovered!")
    print("💡 No API costs - run as often as you want!")
    print("=" * 80)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="SearXNG-based company discovery (FREE, self-hosted)"
    )
    parser.add_argument(
        "--platform",
        choices=list(PLATFORMS.keys()) + ["all"],
        default="all",
        help="Platform to discover (default: all)",
    )
    parser.add_argument(
        "--max-queries",
        type=int,
        default=-1,
        help="Maximum queries to use (default: unlimited!)",
    )
    parser.add_argument(
        "--pages", type=int, default=10, help="Pages per query (default: 10)"
    )
    parser.add_argument(
        "--engines",
        type=str,
        default="bing,brave,startpage,google",
        help="Search engines to use (default: bing,brave,startpage,google)",
    )

    args = parser.parse_args()

    if args.platform == "all":
        discover_all_platforms(
            max_queries_per_platform=args.max_queries,
            pages_per_query=args.pages,
            engines=args.engines,
        )
    else:
        discover_platform(
            args.platform,
            max_queries=args.max_queries,
            pages_per_query=args.pages,
            engines=args.engines,
        )
