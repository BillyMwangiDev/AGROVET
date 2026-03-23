import { execSync } from "child_process";
import path from "path";

/**
 * Ensure the E2E admin user exists in the dev SQLite DB before tests run.
 * Runs via Django management shell — does NOT require the HTTP server.
 */
async function globalSetup() {
  const backendDir = path.resolve(__dirname, "..", "backend");

  const script = [
    "from django.contrib.auth import get_user_model",
    "User = get_user_model()",
    "u, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@nicmah.co.ke', 'role': 'admin', 'is_staff': True, 'is_superuser': True})",
    "u.set_password('admin1234')",
    "u.role = 'admin'",
    "u.is_staff = True",
    "u.is_superuser = True",
    "u.is_active = True",
    "u.save()",
    "print('E2E admin user ready:', u.username)",
  ].join("; ");

  try {
    execSync(`python manage.py shell -c "${script}"`, {
      cwd: backendDir,
      env: {
        ...process.env,
        DJANGO_SETTINGS_MODULE: "agrovet.settings.development",
      },
      stdio: "inherit",
    });
  } catch (err) {
    console.warn("Warning: could not ensure E2E admin user:", err);
  }
}

export default globalSetup;
