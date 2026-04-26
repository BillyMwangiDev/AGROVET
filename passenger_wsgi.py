import sys
import os
from pathlib import Path

# Add backend/ to the Python path so Django packages are importable
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "agrovet.settings.production"

from django.core.wsgi import get_wsgi_application  # noqa: E402
application = get_wsgi_application()
