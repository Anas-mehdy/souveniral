"""
Kilifal.com Shopify Scraper
Fetches all products via JSON API, downloads images at full quality,
and exports structured data to products.json
"""

import asyncio
import json
import os
import re
import sys
import time

# Force UTF-8 output on Windows consoles
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from pathlib import Path
from urllib.parse import urlparse

import aiofiles
import aiohttp

BASE_URL = "https://kilifal.com"
IMAGES_DIR = Path("images")
OUTPUT_FILE = Path("products.json")
CONCURRENT_DOWNLOADS = 10
REQUEST_DELAY = 0.3  # seconds between API pages to be polite


def sanitize_filename(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    name = re.sub(r"\s+", "_", name.strip())
    return name[:200]


_BRAND_COLLECTION_MAP = {
    "iPhone": ["iphone-telefon-kiliflari", "seffaf-iphone-kilif", "seffaf-tasarimli-telefon-kiliflari"],
    "Samsung": ["samsung-telefon-kiliflari"],
    "Xiaomi": ["xiaomi-telefon-kiliflari"],
    "Huawei": ["huawei-telefon-kiliflari"],
    "Honor": ["honor-telefon-kiliflari"],
    "Oppo": ["oppo-telefon-kiliflari"],
    "Realme": ["realme-telefon-kiliflari"],
    "Vivo": ["vivo-telefon-kiliflari"],
    "Tecno": ["tecno-telefon-kiliflari"],
    "Infinix": ["infinix-telefon-kiliflari"],
    "Casper": ["casper-telefon-kiliflari"],
    "Omix": ["omix-telefon-kiliflari"],
    "Reeder": ["reeder-telefon-kiliflari"],
    "General Mobile": ["general-mobile-telefon-kiliflari"],
}


def extract_compatible_brands(collection_handles: list[str], collection_titles: list[str], tags: list[str]) -> list[str]:
    """Return all device brands this product is compatible with."""
    handles_set = set(collection_handles)
    brands = []
    for brand, handles in _BRAND_COLLECTION_MAP.items():
        if handles_set.intersection(handles):
            brands.append(brand)
    if not brands:
        combined = " ".join(collection_titles + tags).lower()
        for brand in _BRAND_COLLECTION_MAP:
            if brand.lower() in combined:
                brands.append(brand)
    return brands or ["Genel"]


def extract_model_from_variant(variant_title: str) -> str:
    """Extract phone model from a variant title if present."""
    if variant_title and variant_title.lower() not in ("default title", ""):
        return variant_title
    return ""


def strip_cdn_size(url: str) -> str:
    """Remove Shopify size suffix (_1024x1024, _grande, etc.) to get original."""
    return re.sub(r"_\d+x\d*(?=\.[a-zA-Z]+(\?|$))", "", url)


async def fetch_json(session: aiohttp.ClientSession, url: str) -> dict | list | None:
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            if resp.status == 200:
                return await resp.json(content_type=None)
            return None
    except Exception as e:
        print(f"  [ERR] GET {url} → {e}")
        return None


async def download_image(
    session: aiohttp.ClientSession,
    url: str,
    dest: Path,
    sem: asyncio.Semaphore,
) -> bool:
    if dest.exists():
        return True
    async with sem:
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                if resp.status == 200:
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    async with aiofiles.open(dest, "wb") as f:
                        await f.write(await resp.read())
                    return True
        except Exception as e:
            print(f"  [IMG ERR] {url} → {e}")
    return False


async def fetch_all_collections(session: aiohttp.ClientSession) -> list[dict]:
    data = await fetch_json(session, f"{BASE_URL}/collections.json?limit=250")
    if not data:
        return []
    collections = data.get("collections", [])
    print(f"[+] Found {len(collections)} collections")
    return collections


async def fetch_products_for_collection(
    session: aiohttp.ClientSession,
    handle: str,
) -> list[dict]:
    """Paginate through all products in a collection using cursor-based paging."""
    products = []
    page = 1
    while True:
        url = f"{BASE_URL}/collections/{handle}/products.json?limit=250&page={page}"
        data = await fetch_json(session, url)
        if not data:
            break
        batch = data.get("products", [])
        if not batch:
            break
        products.extend(batch)
        if len(batch) < 250:
            break
        page += 1
        await asyncio.sleep(REQUEST_DELAY)
    return products


async def fetch_all_products(session: aiohttp.ClientSession) -> tuple[dict, dict]:
    """
    Returns:
        products_by_id: {product_id: product_dict}
        product_collections: {product_id: [(handle, title), ...]}
    """
    collections = await fetch_all_collections(session)

    products_by_id: dict[int, dict] = {}
    product_collections: dict[int, list[tuple[str, str]]] = {}

    for col in collections:
        handle = col["handle"]
        title = col["title"]
        print(f"  >> Fetching collection: {title}")
        prods = await fetch_products_for_collection(session, handle)
        print(f"     {len(prods)} products")
        for p in prods:
            pid = p["id"]
            if pid not in products_by_id:
                products_by_id[pid] = p
                product_collections[pid] = []
            product_collections[pid].append((handle, title))
        await asyncio.sleep(REQUEST_DELAY)

    print(f"\n[+] Total unique products: {len(products_by_id)}")
    return products_by_id, product_collections


def build_product_record(
    product: dict,
    collection_pairs: list[tuple[str, str]],
    image_paths: dict[str, str],
) -> dict:
    """Transform raw Shopify product into the target schema."""
    pid = product["id"]
    title = product["title"]
    handle = product["handle"]
    tags = product.get("tags", [])
    vendor = product.get("vendor", "")

    col_handles = [h for h, _ in collection_pairs]
    col_titles = [t for _, t in collection_pairs]
    compatible_brands = extract_compatible_brands(col_handles, col_titles, tags)
    section = compatible_brands[0] if len(compatible_brands) == 1 else "Multi"

    # Build variants list
    variants_out = []
    for v in product.get("variants", []):
        model = extract_model_from_variant(v.get("title", ""))
        variants_out.append(
            {
                "variant_id": v["id"],
                "model": model,
                "price": v.get("price", ""),
                "compare_at_price": v.get("compare_at_price") or "",
                "sku": v.get("sku") or "",
                "available": v.get("available", True),
            }
        )

    # Main price (first variant)
    price = variants_out[0]["price"] if variants_out else ""
    compare_at_price = variants_out[0]["compare_at_price"] if variants_out else ""

    # Images
    images_out = []
    for img in product.get("images", []):
        src = strip_cdn_size(img["src"])
        local_path = image_paths.get(img["src"], "")
        images_out.append(
            {
                "url": src,
                "local_path": local_path,
                "alt": img.get("alt") or "",
            }
        )

    return {
        "id": pid,
        "title": title,
        "handle": handle,
        "vendor": vendor,
        "section": section,
        "compatible_brands": compatible_brands,
        "collections": col_titles,
        "tags": tags,
        "price": price,
        "compare_at_price": compare_at_price,
        "variants": variants_out,
        "images": images_out,
        "url": f"{BASE_URL}/products/{handle}",
    }


async def download_all_images(
    session: aiohttp.ClientSession,
    products_by_id: dict,
) -> dict[str, str]:
    """Download all product images. Returns {original_url: local_relative_path}."""
    sem = asyncio.Semaphore(CONCURRENT_DOWNLOADS)
    tasks = []
    url_to_path: dict[str, str] = {}

    for product in products_by_id.values():
        handle = product["handle"]
        safe_handle = sanitize_filename(handle)
        product_dir = IMAGES_DIR / safe_handle

        for idx, img in enumerate(product.get("images", []), start=1):
            raw_url = img["src"]
            full_url = strip_cdn_size(raw_url)
            ext = Path(urlparse(full_url).path).suffix.split("?")[0] or ".jpg"
            filename = f"{idx:02d}{ext}"
            dest = product_dir / filename
            rel_path = str(dest).replace("\\", "/")
            url_to_path[raw_url] = rel_path
            tasks.append(download_image(session, full_url, dest, sem))

    print(f"\n[+] Downloading {len(tasks)} images with {CONCURRENT_DOWNLOADS} concurrent workers...")
    results = await asyncio.gather(*tasks)
    success = sum(results)
    print(f"[+] Downloaded {success}/{len(tasks)} images")
    return url_to_path


async def main():
    IMAGES_DIR.mkdir(exist_ok=True)

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json",
    }

    async with aiohttp.ClientSession(headers=headers) as session:
        # 1. Fetch all products across all collections
        products_by_id, product_collections = await fetch_all_products(session)

        # 2. Download all images
        image_paths = await download_all_images(session, products_by_id)

        # 3. Build structured records
        records = []
        for pid, product in products_by_id.items():
            col_pairs = product_collections.get(pid, [])
            record = build_product_record(product, col_pairs, image_paths)
            records.append(record)

        # Sort by section then title for readability
        records.sort(key=lambda r: (r["section"], r["title"]))

    # 4. Export JSON
    async with aiofiles.open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        await f.write(json.dumps({"total": len(records), "products": records}, ensure_ascii=False, indent=2))

    print(f"\n[OK] Exported {len(records)} products -> {OUTPUT_FILE}")
    print(f"[OK] Images saved in -> {IMAGES_DIR}/")


if __name__ == "__main__":
    start = time.time()
    asyncio.run(main())
    elapsed = time.time() - start
    print(f"\nDone in {elapsed:.1f}s")
