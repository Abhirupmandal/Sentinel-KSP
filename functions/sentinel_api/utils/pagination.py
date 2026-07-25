"""Pagination utility for Sentinel-KSP.

Provides standardized pagination helpers for bounded query responses.
"""

from typing import Any, Dict, List


def paginate(
    items: List[Any],
    page: int = 1,
    page_size: int = 25,
    max_page_size: int = 100,
) -> Dict[str, Any]:
    """Apply pagination to a list of items and return a paginated envelope.

    Args:
        items: Full list of items to paginate.
        page: Current page number (1-indexed).
        page_size: Number of items per page.
        max_page_size: Maximum allowed page size.

    Returns:
        Dictionary containing paginated items and metadata.
    """
    page = max(1, page)
    page_size = max(1, min(page_size, max_page_size))

    total_items = len(items)
    total_pages = max(1, (total_items + page_size - 1) // page_size)

    start = (page - 1) * page_size
    end = start + page_size
    page_items = items[start:end]

    return {
        "items": page_items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }
