import json
import sys
from pathlib import Path

from pydantic import ValidationError

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from export_utils import generate_job_id, write_jobs_csv  # noqa: E402
from models.rippling import RipplingJob  # noqa: E402


def _format_location(job: RipplingJob) -> str:
    """Format location string from job data."""
    # Prefer work_locations (list of strings)
    if job.work_locations:
        return ", ".join(loc for loc in job.work_locations if loc)

    # Fallback to locations (list of Location objects or dicts)
    if job.locations:
        location_parts = []
        for loc in job.locations:
            if isinstance(loc, dict):
                # Handle dict format
                name = loc.get("name")
                if name:
                    location_parts.append(name)
                else:
                    # Build from components
                    parts = []
                    if loc.get("city"):
                        parts.append(loc["city"])
                    if loc.get("state"):
                        parts.append(loc["state"])
                    if loc.get("country"):
                        parts.append(loc["country"])
                    if parts:
                        location_parts.append(", ".join(parts))
            else:
                # Handle Location object (from pydantic model)
                name = getattr(loc, "name", None)
                if name:
                    location_parts.append(name)
                else:
                    # Build from Location object attributes
                    parts = []
                    if getattr(loc, "city", None):
                        parts.append(loc.city)
                    if getattr(loc, "state", None):
                        parts.append(loc.state)
                    if getattr(loc, "country", None):
                        parts.append(loc.country)
                    if parts:
                        location_parts.append(", ".join(parts))

        if location_parts:
            return "; ".join(location_parts)

    return ""


def main():
    companies_dir = Path(__file__).resolve().parent / "companies"
    jobs_csv_path = Path(__file__).resolve().parent / "jobs.csv"
    companies_csv_path = Path(__file__).resolve().parent / "rippling_companies.csv"

    # Build mapping from slug to company name
    slug_to_name = {}
    if companies_csv_path.exists():
        import csv
        from urllib.parse import urlparse, unquote

        with open(companies_csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                url = row["url"]
                # Extract slug from URL
                parsed = urlparse(url)
                path_parts = [p for p in parsed.path.split("/") if p]
                if path_parts and path_parts[-1] == "jobs":
                    slug = path_parts[-2] if len(path_parts) > 1 else path_parts[0]
                else:
                    slug = path_parts[0] if path_parts else "unknown"
                # URL-decode the slug for matching
                decoded_slug = unquote(slug)
                # Store both encoded and decoded versions (and lowercase versions) for lookup
                slug_to_name[slug] = row["name"]
                slug_to_name[slug.lower()] = row["name"]
                slug_to_name[decoded_slug] = row["name"]
                slug_to_name[decoded_slug.lower()] = row["name"]

    job_rows = []

    if not companies_dir.exists() or not companies_dir.is_dir():
        print(f"Companies directory does not exist: {companies_dir}")
    else:
        for json_file in sorted(companies_dir.glob("*.json")):
            company_slug = json_file.stem
            # Normalize slug to lowercase for lookup (URLs are case-insensitive)
            company_slug_lower = company_slug.lower()
            # Try to get company name from JSON first, then from job_board, then from CSV mapping
            company_name = company_slug  # fallback
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError:
                continue

            # Extract jobs from the data structure
            job_list = data.get("jobs", [])
            if not isinstance(job_list, list):
                continue

            # Use company_name from JSON first, then from job_board, then from CSV mapping
            if isinstance(data, dict) and "name" in data:
                # Ensure name is not URL-encoded (shouldn't happen, but safety check)
                from urllib.parse import unquote

                company_name = data["name"]
                # If name looks URL-encoded, prefer CSV name instead
                if "%" in company_name:
                    decoded_slug = unquote(company_slug_lower)
                    if company_slug_lower in slug_to_name:
                        company_name = slug_to_name[company_slug_lower]
                    elif decoded_slug in slug_to_name:
                        company_name = slug_to_name[decoded_slug]
            elif isinstance(data, dict) and "job_board" in data:
                job_board = data.get("job_board", {})
                if isinstance(job_board, dict) and job_board.get("title"):
                    company_name = job_board["title"]
            else:
                # Try to find in slug mapping (try both encoded and decoded versions, case-insensitive)
                from urllib.parse import unquote

                decoded_slug = unquote(company_slug_lower)
                if company_slug_lower in slug_to_name:
                    company_name = slug_to_name[company_slug_lower]
                elif decoded_slug in slug_to_name:
                    company_name = slug_to_name[decoded_slug]

            for job_data in job_list:
                try:
                    job = RipplingJob(**job_data)
                except ValidationError:
                    continue

                url = job.url or ""
                ats_id = job.uuid or job.id or ""
                title = job.name or job.title or ""

                # Use company_name from job if available
                company = job.company_name or company_name

                location_str = _format_location(job)

                job_rows.append(
                    {
                        "url": url,
                        "title": title,
                        "location": location_str,
                        "company": company,
                        "ats_id": ats_id,
                        "id": generate_job_id("rippling", url, ats_id),
                    }
                )

    print(f"Processed {len(job_rows)} total jobs")
    diff_path = write_jobs_csv(jobs_csv_path, job_rows)
    if diff_path:
        print(f"Created diff file: {diff_path.name}")


if __name__ == "__main__":
    main()
