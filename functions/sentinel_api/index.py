"""Zoho Catalyst Advanced I/O Entry Point Compatibility Wrapper.

Ensures compatibility regardless of whether Zoho Catalyst invokes index.py,
main.py, WSGI callable (app), or handler(context, basicio).
"""

import os
import sys

# Ensure function directory is in sys.path and set working directory to module root
_TARGET_DIR = os.path.dirname(os.path.abspath(__file__))
if _TARGET_DIR not in sys.path:
    sys.path.insert(0, _TARGET_DIR)
try:
    os.chdir(_TARGET_DIR)
except Exception:
    pass

from main import app, handler


def main(context=None, basicio=None, *args, **kwargs):
    """Catalyst Basic/Advanced I/O handler fallback."""
    return handler(context, basicio, *args, **kwargs)


__all__ = ["app", "handler", "main"]
