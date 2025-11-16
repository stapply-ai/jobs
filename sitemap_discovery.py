"""
Sitemap-Based Company Discovery
COMPLETELY FREE - No API limits, no costs
Parses XML sitemaps to extract company URLs
"""

import aiohttp
import asyncio
import re
import pandas as pd
from typing import Set, List
from xml.etree import ElementTree as ET
import os
from urllib.parse import urlparse


# Platform configurations
PLATFORMS = {
    "ashby": {
        "domains": ["jobs.ashbyhq.com"],
        "sitemap_urls": [
            "https://jobs.ashbyhq.com/sitemap.xml",
            "https://jobs.ashbyhq.com/sitemap_index.xml",
        ],
        "pattern": r"(https://jobs\.ashbyhq\.com/[^/?#]+)",
        "csv_column": "ashby_url",
        "output_file": "ashby/companies.csv"
    },
    "greenhouse": {
        "domains": ["boards.greenhouse.io", "job-boards.greenhouse.io"],
        "sitemap_urls": [
            "https://boards.greenhouse.io/sitemap.xml",
            "https://boards.greenhouse.io/sitemap_index.xml",
            "https://job-boards.greenhouse.io/sitemap.xml",
        ],
        "pattern": r"(https://(?:boards|job-boards)\.greenhouse\.io/[^/?#]+)",
        "csv_column": "greenhouse_url",
        "output_file": "greenhouse/greenhouse_companies.csv"
    },
    "lever": {
        "domains": ["jobs.lever.co"],
        "sitemap_urls": [
            "https://jobs.lever.co/sitemap.xml",
            "https://jobs.lever.co/sitemap_index.xml",
        ],
        "pattern": r"(https://jobs\.lever\.co/[^/?#]+)",
        "csv_column": "lever_url",
        "output_file": "lever/lever_companies.csv"
    },
    "workable": {
        "domains": ["apply.workable.com", "jobs.workable.com"],
        "sitemap_urls": [
            "https://apply.workable.com/sitemap.xml",
            "https://apply.workable.com/sitemap_index.xml",
            "https://jobs.workable.com/sitemap.xml",
        ],
        "pattern": [
            r"(https://apply\.workable\.com/[^/?#]+)",
            r"(https://jobs\.workable\.com/company/[^/?#]+/[^/?#]+)"
        ],
        "csv_column": "workable_url",
        "output_file": "workable/workable_companies.csv"
    }
}


async def fetch_url(session: aiohttp.ClientSession, url: str) -> str:
    """Fetch URL content"""
    try:
        async with session.get(url, timeout=30, ssl=True) as response:
            if response.status == 200:
                return await response.text()
            else:
                print(f"  ⚠️  {url} returned status {response.status}")
                return ""
    except asyncio.TimeoutError:
        print(f"  ⚠️  Timeout fetching {url}")
        return ""
    except Exception as e:
        print(f"  ⚠️  Error fetching {url}: {e}")
        return ""


def extract_urls_from_xml(xml_content: str, pattern: str | List[str]) -> Set[str]:
    """Extract URLs from XML content"""
    urls = set()

    if not xml_content:
        return urls

    try:
        # Parse XML
        root = ET.fromstring(xml_content)

        # Handle namespaces
        namespaces = {
            'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9',
            'xhtml': 'http://www.w3.org/1999/xhtml'
        }

        # Try to find all <loc> tags (with and without namespace)
        loc_tags = []
        loc_tags.extend(root.findall('.//sitemap:loc', namespaces))
        loc_tags.extend(root.findall('.//loc'))

        # Extract URLs from <loc> tags
        for loc in loc_tags:
            url = loc.text
            if url:
                # Handle single pattern or list of patterns
                patterns = [pattern] if isinstance(pattern, str) else pattern

                for pat in patterns:
                    match = re.match(pat, url)
                    if match:
                        urls.add(match.group(1))
                        break

        # Also try regex extraction (fallback)
        url_matches = re.findall(r'<loc>(https?://[^<]+)</loc>', xml_content)
        for url in url_matches:
            patterns = [pattern] if isinstance(pattern, str) else pattern
            for pat in patterns:
                match = re.match(pat, url)
                if match:
                    urls.add(match.group(1))
                    break

    except ET.ParseError as e:
        print(f"  ⚠️  XML parse error: {e}")

    return urls


def extract_sitemap_urls(xml_content: str) -> List[str]:
    """Extract sitemap URLs from sitemap index"""
    sitemap_urls = []

    if not xml_content:
        return sitemap_urls

    try:
        root = ET.fromstring(xml_content)

        namespaces = {
            'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9'
        }

        # Find <sitemap><loc> tags
        sitemap_tags = root.findall('.//sitemap:sitemap/sitemap:loc', namespaces)
        sitemap_tags.extend(root.findall('.//sitemap/loc'))

        for loc in sitemap_tags:
            if loc.text:
                sitemap_urls.append(loc.text)

        # Regex fallback
        if not sitemap_urls:
            pattern = r'<sitemap>.*?<loc>(https?://[^<]+)</loc>.*?</sitemap>'
            matches = re.findall(pattern, xml_content, re.DOTALL)
            sitemap_urls.extend(matches)

    except ET.ParseError:
        pass

    return sitemap_urls


async def discover_from_sitemap(
    session: aiohttp.ClientSession,
    sitemap_url: str,
    pattern: str | List[str],
    recursive: bool = True
) -> Set[str]:
    """
    Discover company URLs from a sitemap

    Args:
        session: aiohttp session
        sitemap_url: URL of the sitemap
        pattern: Regex pattern(s) to match company URLs
        recursive: If True, follow sitemap index links

    Returns:
        Set of company URLs
    """
    print(f"  📄 Fetching {sitemap_url}")

    xml_content = await fetch_url(session, sitemap_url)

    if not xml_content:
        return set()

    # Try to extract company URLs directly
    urls = extract_urls_from_xml(xml_content, pattern)

    if urls:
        print(f"  ✅ Found {len(urls)} company URLs in {sitemap_url}")
        return urls

    # If no company URLs, check if this is a sitemap index
    if recursive:
        sitemap_urls = extract_sitemap_urls(xml_content)

        if sitemap_urls:
            print(f"  📑 Found {len(sitemap_urls)} sub-sitemaps")

            all_urls = set()

            # Fetch sub-sitemaps (limit to prevent infinite recursion)
            for sub_sitemap in sitemap_urls[:50]:  # Max 50 sub-sitemaps
                sub_urls = await discover_from_sitemap(
                    session,
                    sub_sitemap,
                    pattern,
                    recursive=False  # Don't recurse further
                )
                all_urls.update(sub_urls)

            return all_urls

    return urls


async def discover_platform(platform_name: str):
    """Discover companies for a platform using sitemap parsing"""

    if platform_name not in PLATFORMS:
        print(f"❌ Unknown platform: {platform_name}")
        return

    config = PLATFORMS[platform_name]

    print("=" * 80)
    print(f"🗺️  Sitemap Discovery: {platform_name.upper()}")
    print(f"💰 Cost: $0 (FREE, no limits!)")
    print("=" * 80)

    # Read existing URLs
    existing_urls = set()
    if os.path.exists(config["output_file"]):
        try:
            df = pd.read_csv(config["output_file"])
            if config["csv_column"] in df.columns:
                existing_urls = set(df[config["csv_column"]].dropna().tolist())
            elif "url" in df.columns:
                existing_urls = set(df["url"].dropna().tolist())
            print(f"📖 Existing URLs: {len(existing_urls)}")
        except Exception as e:
            print(f"⚠️  Error reading {config['output_file']}: {e}")

    all_urls = set()

    async with aiohttp.ClientSession() as session:
        # Try each sitemap URL
        for sitemap_url in config["sitemap_urls"]:
            urls = await discover_from_sitemap(
                session,
                sitemap_url,
                config["pattern"],
                recursive=True
            )
            all_urls.update(urls)

    # Calculate new URLs
    new_urls = all_urls - existing_urls

    print(f"\n📈 Results:")
    print(f"  🔍 Found: {len(all_urls)} total URLs")
    print(f"  🆕 New: {len(new_urls)} URLs")
    print(f"  📊 Total unique: {len(existing_urls.union(all_urls))} URLs")

    if existing_urls:
        growth = (len(new_urls) / len(existing_urls) * 100) if existing_urls else 0
        print(f"  📈 Growth: +{growth:.1f}%")

    if new_urls:
        print(f"\n🎉 Sample of new URLs (first 20):")
        for url in sorted(new_urls)[:20]:
            print(f"  ✨ {url}")
        if len(new_urls) > 20:
            print(f"  ... and {len(new_urls) - 20} more")

    # Save to CSV
    combined_urls = existing_urls.union(all_urls)
    df = pd.DataFrame({config["csv_column"]: sorted(combined_urls)})
    df.to_csv(config["output_file"], index=False)
    print(f"\n✅ Saved {len(df)} companies to {config['output_file']}")


async def discover_all_platforms():
    """Discover all platforms using sitemap parsing"""

    print("=" * 80)
    print("🗺️  Sitemap Discovery - All Platforms")
    print("💰 Cost: $0 (FREE, unlimited!)")
    print("=" * 80)

    for platform_name in PLATFORMS.keys():
        print("\n")
        await discover_platform(platform_name)

    print("\n" + "=" * 80)
    print("✅ All platforms discovered!")
    print("💡 Re-run weekly to find newly listed companies")
    print("=" * 80)


async def discover_robots_txt(domain: str) -> Set[str]:
    """
    Discover company URLs from robots.txt
    Some ATS platforms list company paths here
    """
    print(f"🤖 Checking robots.txt for {domain}")

    robots_url = f"https://{domain}/robots.txt"
    urls = set()

    async with aiohttp.ClientSession() as session:
        content = await fetch_url(session, robots_url)

        if not content:
            return urls

        # Extract paths from Disallow/Allow directives
        # Pattern: Disallow: /company-slug
        paths = re.findall(r'(?:Disallow|Allow):\s*/([^\s/]+)', content)

        # Filter out common non-company paths
        exclude = {
            'admin', 'api', 'assets', 'static', 'css', 'js', 'img', 'images',
            'fonts', 'media', 'public', 'private', 'login', 'logout', 'auth',
            'embed', 'widget', 'rss', 'feed', 'sitemap', 'robots', 'favicon'
        }

        for path in paths:
            if path.lower() not in exclude and len(path) > 2:
                url = f"https://{domain}/{path}"
                urls.add(url)

        if urls:
            print(f"  ✅ Found {len(urls)} potential company URLs in robots.txt")
        else:
            print(f"  ℹ️  No company URLs found in robots.txt")

    return urls


async def discover_greenhouse_robots():
    """Special method for Greenhouse robots.txt"""
    urls = await discover_robots_txt("boards.greenhouse.io")

    if not urls:
        return

    # Save to CSV
    output_file = "greenhouse/greenhouse_companies_robots.csv"
    df = pd.DataFrame({"greenhouse_url": sorted(urls)})
    df.to_csv(output_file, index=False)
    print(f"✅ Saved {len(df)} companies to {output_file}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Sitemap-based company discovery (FREE, unlimited)"
    )
    parser.add_argument(
        "--platform",
        choices=list(PLATFORMS.keys()) + ["all", "robots"],
        default="all",
        help="Platform to discover (default: all)"
    )

    args = parser.parse_args()

    if args.platform == "all":
        asyncio.run(discover_all_platforms())
    elif args.platform == "robots":
        asyncio.run(discover_greenhouse_robots())
    else:
        asyncio.run(discover_platform(args.platform))
