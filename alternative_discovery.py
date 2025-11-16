"""
Alternative Company Discovery Methods
Finds companies without relying on SERP API by using alternative data sources
"""

import aiohttp
import asyncio
import re
from typing import Set, List
import pandas as pd
from bs4 import BeautifulSoup
import os


class AlternativeDiscovery:
    """Discover companies using alternative methods beyond SERP API"""

    def __init__(self, platform: str):
        self.platform = platform
        self.found_urls = set()

    async def discover_from_sitemap(self, domain: str) -> Set[str]:
        """
        Discover companies by parsing XML sitemaps
        Many ATS platforms have sitemaps that list all company pages
        """
        sitemap_urls = [
            f"https://{domain}/sitemap.xml",
            f"https://{domain}/sitemap_index.xml",
            f"https://{domain}/sitemap-0.xml",
        ]

        urls = set()
        async with aiohttp.ClientSession() as session:
            for sitemap_url in sitemap_urls:
                try:
                    async with session.get(sitemap_url, timeout=10) as response:
                        if response.status == 200:
                            content = await response.text()
                            # Extract URLs from sitemap
                            url_matches = re.findall(r'<loc>(https?://[^<]+)</loc>', content)
                            urls.update(url_matches)
                            print(f"✅ Found {len(url_matches)} URLs in {sitemap_url}")
                        else:
                            print(f"⚠️  Sitemap not found: {sitemap_url} (status {response.status})")
                except Exception as e:
                    print(f"⚠️  Error fetching {sitemap_url}: {e}")

        return urls

    async def discover_from_ycombinator(self) -> Set[str]:
        """
        Discover companies from Y Combinator company directory
        Many YC companies use modern ATS platforms
        """
        # Note: This is a simplified example. In practice, you'd need to:
        # 1. Scrape YC company directory
        # 2. Visit each company's careers page
        # 3. Detect which ATS they use
        # This requires more complex implementation with rate limiting

        print("📋 YC Discovery requires manual implementation")
        print("   Visit https://www.ycombinator.com/companies for company list")
        print("   Then check each company's careers page for ATS platform")
        return set()

    async def discover_from_builtin_jobs(self) -> Set[str]:
        """
        Discover companies from BuiltIn.com job boards
        BuiltIn lists many tech companies with their job board links
        """
        # Simplified example - full implementation would scrape BuiltIn
        print("📋 BuiltIn Discovery requires scraping implementation")
        print("   Visit https://builtin.com/jobs for company listings")
        return set()

    def discover_from_github_awesome_lists(self) -> Set[str]:
        """
        Find companies from curated GitHub awesome lists
        Example: awesome-tech-companies, awesome-remote-jobs, etc.
        """
        # This would require GitHub API integration
        print("📋 GitHub Awesome Lists Discovery")
        print("   Check repos like: awesome-tech-companies, awesome-remote-jobs")
        return set()

    def discover_by_crawling_index(self, base_url: str, max_pages: int = 1000) -> Set[str]:
        """
        Discover by systematically trying common company slugs
        This works for platforms that use predictable URL structures
        """
        print(f"📋 Index Crawling for {base_url}")
        print("   This method tries common company name patterns")

        # Common company name patterns to try
        common_patterns = [
            # Tech companies
            "google", "facebook", "meta", "amazon", "microsoft", "apple",
            "netflix", "airbnb", "uber", "lyft", "stripe", "square",
            # Add more based on industry
        ]

        # Note: Implementation would need to check if URLs exist (HEAD request)
        return set()

    async def discover_from_linkedin_jobs(self) -> Set[str]:
        """
        Find companies from LinkedIn job postings
        LinkedIn often includes links to external ATS platforms
        """
        print("📋 LinkedIn Discovery")
        print("   Search LinkedIn jobs and extract ATS links from 'Apply' buttons")
        return set()

    def discover_from_indeed_aggregate(self) -> Set[str]:
        """
        Find companies from Indeed or other job aggregators
        These sites often link to company ATS pages
        """
        print("📋 Indeed/Aggregator Discovery")
        print("   Parse job aggregator sites for ATS links")
        return set()


async def discover_greenhouse_via_robots_txt():
    """
    Special method for Greenhouse: parse their robots.txt
    This sometimes reveals subdomain patterns
    """
    urls = set()
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get("https://boards.greenhouse.io/robots.txt", timeout=10) as response:
                if response.status == 200:
                    content = await response.text()
                    # Parse robots.txt for company paths
                    paths = re.findall(r'Disallow: /([^/\s]+)', content)
                    for path in paths:
                        if path and path not in ['admin', 'api', 'assets']:
                            urls.add(f"https://boards.greenhouse.io/{path}")
                    print(f"✅ Found {len(urls)} companies from robots.txt")
        except Exception as e:
            print(f"⚠️  Error fetching robots.txt: {e}")

    return urls


async def discover_lever_via_api_exploration():
    """
    Lever has a public API that might expose company listings
    """
    print("📋 Lever API Exploration")
    print("   Check Lever's public API documentation for company discovery endpoints")
    return set()


def discover_from_crunchbase_export():
    """
    Use Crunchbase data (if available) to find company websites
    Then check their careers pages for ATS platform
    """
    print("📋 Crunchbase Discovery")
    print("   Export company list from Crunchbase")
    print("   Visit each company's /careers page")
    print("   Detect ATS platform from page HTML or redirects")
    return set()


def discover_by_industry_lists():
    """
    Use industry-specific company lists
    E.g., Forbes Cloud 100, Deloitte Fast 500, Inc 5000
    """
    print("📋 Industry Lists Discovery")
    print("   Sources:")
    print("   - Forbes Cloud 100")
    print("   - Deloitte Technology Fast 500")
    print("   - Inc 5000")
    print("   - CB Insights Unicorns")
    return set()


async def run_all_alternative_methods(platform: str):
    """Run all alternative discovery methods for a platform"""

    print(f"\n{'='*80}")
    print(f"🔍 Alternative Discovery Methods for {platform.upper()}")
    print(f"{'='*80}\n")

    discovery = AlternativeDiscovery(platform)

    # Platform-specific domain mapping
    domain_map = {
        "ashby": "jobs.ashbyhq.com",
        "greenhouse": "boards.greenhouse.io",
        "lever": "jobs.lever.co",
        "workable": "apply.workable.com"
    }

    domain = domain_map.get(platform)
    if not domain:
        print(f"❌ Unknown platform: {platform}")
        return

    # Method 1: Sitemap parsing
    print("\n1️⃣ Discovering from sitemaps...")
    sitemap_urls = await discovery.discover_from_sitemap(domain)
    print(f"   Found: {len(sitemap_urls)} URLs\n")

    # Method 2: Robots.txt (Greenhouse specific)
    if platform == "greenhouse":
        print("2️⃣ Discovering from robots.txt...")
        robots_urls = await discover_greenhouse_via_robots_txt()
        print(f"   Found: {len(robots_urls)} URLs\n")

    # Other methods (print guidance)
    print("3️⃣ Additional Discovery Methods:")
    await discovery.discover_from_ycombinator()
    await discovery.discover_from_builtin_jobs()
    discovery.discover_from_github_awesome_lists()
    await discovery.discover_from_linkedin_jobs()
    discovery.discover_from_indeed_aggregate()
    discover_from_crunchbase_export()
    discover_by_industry_lists()

    print(f"\n{'='*80}")
    print("💡 Implementation Tips:")
    print("   1. Sitemap parsing is the most reliable automated method")
    print("   2. Manual curation from job boards can find 100s more companies")
    print("   3. Company directory sites (YC, BuiltIn) are goldmines")
    print("   4. Consider scraping competitor job aggregators")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Alternative company discovery methods")
    parser.add_argument(
        "--platform",
        choices=["ashby", "greenhouse", "lever", "workable", "all"],
        default="all",
        help="Platform to discover (default: all)"
    )

    args = parser.parse_args()

    if args.platform == "all":
        for platform in ["ashby", "greenhouse", "lever", "workable"]:
            asyncio.run(run_all_alternative_methods(platform))
    else:
        asyncio.run(run_all_alternative_methods(args.platform))
