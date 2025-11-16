"""
Google Custom Search API Discovery
FREE: 100 searches/day = 3,000/month
No cost alternative to SerpAPI
"""

import os
import requests
import pandas as pd
import re
from typing import Set, List
import time
from datetime import datetime

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

# Search strategies (fewer than enhanced_discovery to save quota)
SEARCH_STRATEGIES = [
    lambda domain: f"site:{domain}",
    lambda domain: f"site:{domain} careers",
    lambda domain: f"site:{domain} jobs",
    lambda domain: f"site:{domain} software engineer",
    lambda domain: f"site:{domain} remote",
]


class GoogleCustomSearch:
    """Google Custom Search API client (100 free queries/day)"""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.cse_id = os.getenv("GOOGLE_CSE_ID")

        if not self.api_key or not self.cse_id:
            raise ValueError(
                "Missing Google Custom Search credentials!\n"
                "Set GOOGLE_API_KEY and GOOGLE_CSE_ID in .env\n"
                "See SERP_ALTERNATIVES.md for setup instructions"
            )

        self.base_url = "https://www.googleapis.com/customsearch/v1"
        self.queries_used = 0
        self.daily_limit = 100

    def search(self, query: str, start: int = 1) -> dict:
        """
        Execute a search query

        Args:
            query: Search query
            start: Start index (1-based)

        Returns:
            Search results dict
        """
        if self.queries_used >= self.daily_limit:
            raise Exception(f"Daily limit reached ({self.daily_limit} queries)")

        params = {
            "key": self.api_key,
            "cx": self.cse_id,
            "q": query,
            "start": start,
            "num": 10,  # Results per page (max 10)
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            self.queries_used += 1
            print(f"[Query {self.queries_used}/{self.daily_limit}] {query} (start={start})")

            return response.json()

        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                print("⚠️  Rate limit exceeded! Wait 24 hours for quota reset.")
                raise Exception("Daily quota exceeded")
            else:
                print(f"⚠️  HTTP Error: {e}")
                return {}

        except Exception as e:
            print(f"⚠️  Error: {e}")
            return {}

    def extract_urls(self, results: dict, pattern: str | List[str], domain: str) -> Set[str]:
        """Extract company URLs from search results"""
        urls = set()

        items = results.get("items", [])

        for item in items:
            link = item.get("link", "")

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
                print(f"📖 Found {len(existing_urls)} existing URLs in {csv_file} (legacy format)")
        except Exception as e:
            print(f"⚠️  Error reading {csv_file}: {e}")
    return existing_urls


def save_to_csv(urls: Set[str], existing_urls: Set[str], output_file: str, column_name: str):
    """Save URLs to CSV"""
    all_urls = existing_urls.union(urls)
    new_urls = urls - existing_urls

    print(f"\n📈 Results:")
    print(f"  🆕 New URLs found: {len(new_urls)}")
    print(f"  📊 Total unique URLs: {len(all_urls)}")

    if existing_urls:
        print(f"  📈 Growth: +{len(new_urls)} ({len(new_urls)/len(existing_urls)*100:.1f}% increase)")

    if new_urls:
        print(f"\n🎉 New URLs (showing first 10):")
        for url in sorted(new_urls)[:10]:
            print(f"  ✨ {url}")
        if len(new_urls) > 10:
            print(f"  ... and {len(new_urls) - 10} more")

    df = pd.DataFrame({column_name: sorted(all_urls)})
    df.to_csv(output_file, index=False)
    print(f"\n✅ Saved {len(df)} companies to {output_file}")


def discover_platform(
    platform_name: str,
    max_queries: int = 100,
    pages_per_strategy: int = 5
):
    """
    Discover companies using Google Custom Search API

    Args:
        platform_name: Platform to discover
        max_queries: Maximum queries to use (default: 100 = daily free limit)
        pages_per_strategy: Pages per search strategy
    """

    if platform_name not in PLATFORMS:
        print(f"❌ Unknown platform: {platform_name}")
        print(f"Available platforms: {', '.join(PLATFORMS.keys())}")
        return

    config = PLATFORMS[platform_name]

    print("=" * 80)
    print(f"🔍 Google Custom Search Discovery: {platform_name.upper()}")
    print(f"📊 Max queries: {max_queries} (FREE tier: 100/day)")
    print("=" * 80)

    # Read existing URLs
    existing_urls = read_existing_urls(config["output_file"], config["csv_column"])

    # Initialize Google Custom Search
    client = GoogleCustomSearch()
    all_urls = set()

    # Track queries used
    queries_used = 0

    # Use search strategies
    for strategy_idx, strategy_func in enumerate(SEARCH_STRATEGIES, 1):
        if queries_used >= max_queries:
            print(f"\n⚠️  Reached query limit ({max_queries})")
            break

        query = strategy_func(config["domain"])
        print(f"\n[Strategy {strategy_idx}/{len(SEARCH_STRATEGIES)}] {query}")

        strategy_urls = set()

        for page in range(pages_per_strategy):
            if queries_used >= max_queries:
                break

            # Google Custom Search uses 1-based indexing
            # start = 1, 11, 21, 31, ... (max 100)
            start = page * 10 + 1

            if start > 100:
                print(f"  ⚠️  Google limits to 100 results per query")
                break

            try:
                results = client.search(query, start=start)

                if not results or "items" not in results:
                    print(f"  Page {page + 1}: No results")
                    break

                page_urls = client.extract_urls(
                    results,
                    config["pattern"],
                    config["domain"]
                )

                new_in_page = page_urls - all_urls - strategy_urls
                strategy_urls.update(page_urls)

                print(f"  Page {page + 1}: +{len(new_in_page)} new ({len(page_urls)} total on page)")

                queries_used += 1

                # Small delay to be respectful
                time.sleep(0.5)

            except Exception as e:
                print(f"  ⚠️  Error on page {page + 1}: {e}")
                break

        new_from_strategy = strategy_urls - all_urls
        all_urls.update(strategy_urls)

        print(f"  Strategy total: +{len(new_from_strategy)} new URLs (cumulative: {len(all_urls)})")

    print(f"\n📊 Total queries used: {client.queries_used}/{max_queries}")
    print(f"💰 Cost: $0 (free tier)")

    # Save results
    save_to_csv(all_urls, existing_urls, config["output_file"], config["csv_column"])


def discover_all_platforms(max_queries_per_platform: int = 25):
    """
    Discover all platforms using Google Custom Search
    Distributes 100 free queries across 4 platforms (25 each)
    """

    print("=" * 80)
    print("🚀 Google Custom Search Discovery - All Platforms")
    print(f"📊 Total daily free quota: 100 queries")
    print(f"📊 Per platform: {max_queries_per_platform} queries")
    print("=" * 80)

    for platform_name in PLATFORMS.keys():
        print("\n" + "=" * 80)
        discover_platform(
            platform_name,
            max_queries=max_queries_per_platform,
            pages_per_strategy=5
        )
        print("=" * 80)
        time.sleep(2)

    print("\n" + "=" * 80)
    print("✅ All platforms discovered!")
    print("💡 Free quota refreshes every 24 hours")
    print("💡 Run daily to maximize free tier usage")
    print("=" * 80)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Google Custom Search API discovery (100 free queries/day)"
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
        default=100,
        help="Maximum queries to use (default: 100 = daily free limit)"
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=5,
        help="Pages per search strategy (default: 5)"
    )

    args = parser.parse_args()

    # Check for credentials
    if not os.getenv("GOOGLE_API_KEY") or not os.getenv("GOOGLE_CSE_ID"):
        print("=" * 80)
        print("❌ Missing Google Custom Search credentials!")
        print("=" * 80)
        print("\nSetup instructions:")
        print("1. Visit: https://programmablesearchengine.google.com/")
        print("2. Create a Custom Search Engine")
        print("3. Get your Search Engine ID")
        print("4. Visit: https://console.cloud.google.com/apis/credentials")
        print("5. Create an API key")
        print("6. Enable 'Custom Search API'")
        print("7. Add to .env file:")
        print("   GOOGLE_API_KEY=your_api_key")
        print("   GOOGLE_CSE_ID=your_search_engine_id")
        print("\nSee SERP_ALTERNATIVES.md for detailed setup guide")
        print("=" * 80)
        exit(1)

    if args.platform == "all":
        # Distribute queries across all platforms
        queries_per_platform = args.max_queries // len(PLATFORMS)
        discover_all_platforms(max_queries_per_platform=queries_per_platform)
    else:
        discover_platform(
            args.platform,
            max_queries=args.max_queries,
            pages_per_strategy=args.pages
        )
