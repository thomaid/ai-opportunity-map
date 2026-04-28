#!/usr/bin/env python3
"""
AI Opportunity Map — Google Sheets to JSON extractor
=====================================================
Reads the structured Google Sheet and produces the JSON format
consumed by the HTML visualisation tool.

On first run, a browser window opens for Google sign-in. After you
authorise access, a token is saved to ~/.ai_opportunity_map/token.json
and subsequent runs are silent.

Usage:
    python3 extract_from_sheets.py <sheet_url_or_id> [output.json]

Examples:
    python3 extract_from_sheets.py https://docs.google.com/spreadsheets/d/SHEET_ID/edit
    python3 extract_from_sheets.py SHEET_ID
    python3 extract_from_sheets.py SHEET_ID output/client_data.json

If output path is omitted, writes to ./extracted.json in the current directory.

Requirements:
    pip install gspread google-auth-oauthlib

Setup (one-time):
    See SETUP.md in this folder for instructions on creating the OAuth
    credentials.json file required for authentication.
"""

import sys
import json
import re
from pathlib import Path

try:
    import gspread
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
except ImportError:
    print(
        "Error: required packages not installed.\n"
        "Run: pip install gspread google-auth-oauthlib",
        file=sys.stderr
    )
    sys.exit(1)

from core import assemble


# ── OAuth configuration ───────────────────────────────────────────────────────

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# Default location for credentials and cached token
CREDENTIALS_FILENAME = "credentials.json"
TOKEN_DIR  = Path.home() / ".ai_opportunity_map"
TOKEN_FILE = TOKEN_DIR / "token.json"


def find_credentials_file():
    """
    Look for credentials.json in this order:
    1. Same directory as this script
    2. Current working directory
    3. ~/.ai_opportunity_map/
    Returns a Path or raises FileNotFoundError.
    """
    candidates = [
        Path(__file__).parent / CREDENTIALS_FILENAME,
        Path.cwd() / CREDENTIALS_FILENAME,
        TOKEN_DIR / CREDENTIALS_FILENAME,
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        f"credentials.json not found. Expected in one of:\n"
        + "\n".join(f"  {p}" for p in candidates)
        + "\nSee SETUP.md for instructions on creating this file."
    )


def get_credentials():
    """
    Return valid Google OAuth credentials, refreshing or re-authenticating
    as needed. Caches the token to avoid repeated browser prompts.
    """
    creds = None

    # Load cached token if it exists
    if TOKEN_FILE.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        except Exception:
            pass  # Token corrupt or wrong scopes — re-authenticate below

    # Refresh if expired and refresh token is available
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception:
            creds = None  # Refresh failed — re-authenticate

    # Full OAuth flow if no valid credentials
    if not creds or not creds.valid:
        credentials_file = find_credentials_file()
        print(
            f"\nOpening browser for Google sign-in...\n"
            f"(Using credentials from: {credentials_file})",
            file=sys.stderr
        )
        flow = InstalledAppFlow.from_client_secrets_file(str(credentials_file), SCOPES)
        creds = flow.run_local_server(port=0, open_browser=True)

        # Save token for future runs
        TOKEN_DIR.mkdir(parents=True, exist_ok=True)
        TOKEN_FILE.write_text(creds.to_json())
        print(f"Token saved to {TOKEN_FILE}", file=sys.stderr)

    return creds


def extract_sheet_id(url_or_id: str) -> str:
    """Extract the Sheets ID from a full URL or return the string as-is."""
    # Match /d/<ID>/ pattern in a Sheets URL
    match = re.search(r"/d/([a-zA-Z0-9_-]{20,})", url_or_id)
    if match:
        return match.group(1)
    # If it looks like a bare ID (long alphanumeric string), use it directly
    if re.match(r"^[a-zA-Z0-9_-]{20,}$", url_or_id.strip()):
        return url_or_id.strip()
    raise ValueError(
        f"Could not extract a Google Sheets ID from: {url_or_id}\n"
        "Expected a full Sheets URL or a bare Sheets ID."
    )


# ── Sheet accessor ────────────────────────────────────────────────────────────

class SheetsAccessor:
    """
    Wraps a gspread Spreadsheet to provide the cell(sheet, row, col) interface
    expected by core.assemble().

    Fetches each sheet as a full value grid on first access and caches it,
    so we only make one API call per sheet regardless of how many cells we read.
    Google Sheets API returns all values as strings; numeric coercion is
    handled by the helpers in core.py.
    """

    def __init__(self, spreadsheet: gspread.Spreadsheet):
        self._spreadsheet = spreadsheet
        self._cache: dict[str, list[list]] = {}

    def _get_sheet_data(self, sheet_name: str) -> list[list]:
        """Fetch and cache all values for a sheet."""
        if sheet_name not in self._cache:
            try:
                ws = self._spreadsheet.worksheet(sheet_name)
            except gspread.WorksheetNotFound:
                raise ValueError(
                    f"Sheet '{sheet_name}' not found in the spreadsheet. "
                    f"Available sheets: {[s.title for s in self._spreadsheet.worksheets()]}"
                )
            # UNFORMATTED_VALUE gives us raw numbers as numbers rather than
            # formatted strings (e.g. "20" not "20.0" or "20%")
            self._cache[sheet_name] = ws.get_all_values(
                value_render_option="UNFORMATTED_VALUE"
            )
        return self._cache[sheet_name]

    def cell(self, sheet_name: str, row: int, col: int):
        """
        Return the value at (row, col) using 1-based indexing.
        Returns None if the row/col is out of bounds or the cell is empty.
        """
        data = self._get_sheet_data(sheet_name)
        row_idx = row - 1
        col_idx = col - 1
        if row_idx >= len(data):
            return None
        row_data = data[row_idx]
        if col_idx >= len(row_data):
            return None
        v = row_data[col_idx]
        # gspread returns "" for empty cells; normalise to None
        return v if v != "" else None


# ── CLI entry point ───────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(
            f"Usage: python3 {Path(__file__).name} <sheet_url_or_id> [output.json]",
            file=sys.stderr
        )
        sys.exit(1)

    url_or_id = sys.argv[1]
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("extracted.json")

    # Extract sheet ID
    try:
        sheet_id = extract_sheet_id(url_or_id)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Sheet ID: {sheet_id}", file=sys.stderr)

    # Authenticate
    try:
        creds = get_credentials()
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # Open spreadsheet
    print("Connecting to Google Sheets...", file=sys.stderr)
    try:
        gc = gspread.authorize(creds)
        spreadsheet = gc.open_by_key(sheet_id)
    except gspread.exceptions.APIError as e:
        print(
            f"Error: could not open spreadsheet.\n{e}\n\n"
            "Check that:\n"
            "  1. The sheet ID is correct\n"
            "  2. Your Google account has access to the sheet\n"
            "  3. The Google Sheets API is enabled in your Cloud project",
            file=sys.stderr
        )
        sys.exit(1)

    print(f"Reading: '{spreadsheet.title}'", file=sys.stderr)

    # Extract
    try:
        accessor = SheetsAccessor(spreadsheet)
        source_label = f"Google Sheets: {spreadsheet.title} ({sheet_id})"
        data = assemble(accessor, source_label=source_label)
    except Exception as e:
        print(f"Extraction failed: {e}", file=sys.stderr)
        sys.exit(1)

    # Write output
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    fc = data["framework_config"]
    print(f"Done: {out_path}", file=sys.stderr)
    print(f"  Client:             {data['meta']['client']}", file=sys.stderr)
    print(f"  Impact factors:     {len(fc['impact_factors'])}", file=sys.stderr)
    print(f"  Readiness factors:  {len(fc['readiness_factors'])}", file=sys.stderr)
    print(f"  Enablers:           {len(data['implementation_enablers'])}", file=sys.stderr)
    print(f"  Use cases:          {len(data['use_cases'])}", file=sys.stderr)


if __name__ == "__main__":
    main()
