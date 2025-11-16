from serpapi import GoogleSearch
import pandas as pd
import re
import os

QUERY = "site:apply.workable.com OR site:jobs.workable.com"
PAGES = 100  # Increase to 100 pages for more results

def read_existing_urls(csv_file):
    """Read existing URLs from CSV file to avoid duplicates"""
    existing_urls = set()
    if os.path.exists(csv_file):
        try:
            df = pd.read_csv(csv_file)
            if "workable_url" in df.columns:
                existing_urls = set(df["workable_url"].dropna().tolist())
                print(f"📖 Found {len(existing_urls)} existing URLs in {csv_file}")
        except Exception as e:
            print(f"⚠️  Error reading {csv_file}: {e}")
    return existing_urls


def fetch_urls():
    all_urls = set()
    for i in range(PAGES):
        params = {
            "engine": "google_light",
            "q": QUERY,
            "start": i * 10,
            "api_key": os.getenv("SERPAPI_API_KEY"),
        }
        search = GoogleSearch(params)
        results = search.get_dict()

        for res in results.get("organic_results", []):
            link = res.get("link")
            print(link)
            if link and ("apply.workable.com" in link or "jobs.workable.com" in link):
                # Extract company identifier from URL
                # Format: https://apply.workable.com/company-slug/ or https://jobs.workable.com/company/id/jobs-at-name

                # Handle apply.workable.com format
                m1 = re.match(r"(https://apply\.workable\.com/[^/?#]+)", link)
                if m1:
                    all_urls.add(m1.group(1))

                # Handle jobs.workable.com format
                m2 = re.match(r"(https://jobs\.workable\.com/company/[^/?#]+/[^/?#]+)", link)
                if m2:
                    all_urls.add(m2.group(1))

    return all_urls


def save_to_csv(urls, existing_urls, output_file):
    """Save URLs to CSV, handling duplicates with existing data"""
    # Combine new and existing URLs
    all_urls = existing_urls.union(urls)
    new_urls = urls - existing_urls

    print(f"🆕 New URLs found: {len(new_urls)}")
    print(f"📊 Total unique URLs: {len(all_urls)}")

    if new_urls:
        print("New URLs:")
        for url in sorted(new_urls):
            print(f"  - {url}")

    df = pd.DataFrame({"workable_url": sorted(all_urls)})
    df.to_csv(output_file, index=False)
    print(f"✅ Saved {len(df)} companies to {output_file}")


if __name__ == "__main__":
    output_file = "workable_companies_serpapi.csv"
    existing_urls = read_existing_urls(output_file)
    urls = fetch_urls()
    save_to_csv(urls, existing_urls, output_file)
