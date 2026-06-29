# Synthetic EXIF Test Fixtures

These images are intentionally generated test artifacts for TDD of DripDex EXIF parsing and privacy behavior.

- `gps-original-fake-home-zone.jpg` contains fake GPS coordinates near Austin, Texas.
- `gps-original-no-location.jpg` contains camera/date EXIF without GPS.
- `gps-original-partial-location.jpg` contains incomplete GPS EXIF for fallback/error-path tests.

Do not replace these with real user photos or real source-image GPS. Public fixture images under `docs/fixtures/` are EXIF-stripped.
