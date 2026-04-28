"""
AI Opportunity Map — shared extraction logic
=============================================
Contains all layout constants, helpers and the JSON assembly logic
shared between the xlsx and Google Sheets extractors.
"""

import re
import sys

# ── Layout constants ──────────────────────────────────────────────────────────
# All row/col references use 1-based indexing to match spreadsheet conventions.

# Config tab
CFG_ENGAGEMENT_NAME_CELL = (4, 4)     # row, col — value in col D
CFG_METADATA_IF_COUNT    = (13, 4)    # D13 — number of impact factors
CFG_METADATA_RF_COUNT    = (14, 4)    # D14 — number of readiness factors
CFG_METADATA_EN_COUNT    = (15, 4)    # D15 — number of enablers
CFG_METADATA_UC_COUNT    = (16, 4)    # D16 — number of use cases
CFG_IF_DATA_ROW_START    = 22         # First impact factor data row
CFG_RF_SECTION_SEARCH_FROM = 30       # Scan from here for RF table start

# Enablers tab
EN_RF_ID_ROW      = 6   # Row containing RF IDs (machine-readable headers)
EN_DATA_ROW_START = 8   # First enabler data row
EN_COL_ID         = 2   # B — Enabler ID
EN_COL_NAME       = 3   # C — Name
EN_COL_CATEGORY   = 4   # D — Category
EN_COL_EFFORT     = 5   # E — Effort scale
EN_COL_LEVEL      = 6   # F — Completion level
EN_RF_COL_START   = 9   # I — First dynamic RF uplift column

# Use Cases tab
UC_DATA_ROW_START = 7
UC_COL_ID         = 2   # B
UC_COL_NAME       = 3   # C
UC_COL_DOMAIN     = 4   # D
UC_COL_THEME      = 5   # E
UC_COL_STATE      = 6   # F
UC_COL_RISK       = 7   # G
# col 8 (H) = Notes — not exported
UC_COL_ENABLES    = 9   # I
UC_COL_ENABLERS   = 10  # J

# Score tabs
SC_FACTOR_ID_ROW   = 5  # Row containing factor IDs (machine-readable)
SC_WEIGHT_ROW      = 7  # Row containing weights
SC_DATA_ROW_START  = 8  # First use-case data row
SC_COL_UC_ID       = 2  # B
SC_COL_SCORE_START = 5  # E — first dynamic factor column


# ── Type coercion helpers ─────────────────────────────────────────────────────

def to_str(v):
    """Return stripped string or empty string."""
    return str(v).strip() if v is not None else ""

def to_float(v, default=1.0):
    """Coerce to float; return default if blank or unconvertible."""
    if v is None or str(v).strip() == "":
        return default
    try:
        return float(str(v).replace(",", ""))
    except (ValueError, TypeError):
        return default

def to_int(v, default=0):
    """Coerce to int; return default if blank or unconvertible."""
    if v is None or str(v).strip() == "":
        return default
    try:
        return int(float(str(v)))
    except (ValueError, TypeError):
        return default

def parse_pipe(value):
    """Split a pipe-delimited string into a list, ignoring blanks."""
    if not value:
        return []
    return [s.strip() for s in str(value).split("|") if s.strip()]


# ── Core extraction functions ─────────────────────────────────────────────────
# These operate on a SheetAccessor object (see below) that abstracts
# the difference between openpyxl worksheets and gspread worksheets.

def find_rf_data_start(accessor, sheet_name, from_row):
    """
    Scan down from from_row in the Config sheet to find the first row
    whose column-C value matches RF[0-9]+.
    """
    for row in range(from_row, from_row + 40):
        v = accessor.cell(sheet_name, row, 3)
        if v and re.match(r"RF\d+", str(v)):
            return row
    raise ValueError(
        f"Could not find Readiness Factor data in Config starting from row {from_row}"
    )


def read_factors(accessor, sheet_name, data_row_start, n):
    """Read up to n factor rows from Config. Returns list of dicts."""
    factors = []
    for i in range(n + 5):   # small buffer in case metadata count is stale
        row = data_row_start + i
        fid   = accessor.cell(sheet_name, row, 3)
        fname = accessor.cell(sheet_name, row, 4)
        wt    = accessor.cell(sheet_name, row, 5)
        desc  = accessor.cell(sheet_name, row, 6)
        if not fid or not to_str(fid):
            break
        if not re.match(r"[IR]F\d+", to_str(fid)):
            break   # hit a non-factor row (e.g. TOTAL)
        factors.append({
            "id":          to_str(fid),
            "name":        to_str(fname),
            "weight":      to_float(wt, default=1.0),
            "description": to_str(desc),
        })
    return factors


def read_enablers(accessor, rf_ids):
    """Read all enabler rows from the Enablers sheet."""
    # Discover RF column positions from the ID header row
    rf_col_map = {}
    for col in range(EN_RF_COL_START, EN_RF_COL_START + len(rf_ids) + 10):
        v = accessor.cell("Enablers", EN_RF_ID_ROW, col)
        if v and re.match(r"RF\d+", to_str(v)):
            rf_col_map[to_str(v)] = col
        elif rf_col_map:
            break

    missing = set(rf_ids) - set(rf_col_map)
    if missing:
        raise ValueError(f"Enablers tab missing RF uplift columns for: {missing}")

    enablers = []
    for i in range(200):
        row = EN_DATA_ROW_START + i
        en_id = accessor.cell("Enablers", row, EN_COL_ID)
        if not en_id or not to_str(en_id):
            break
        en_id = to_str(en_id)
        if not re.match(r"EN\d+", en_id):
            break

        factor_uplifts = []
        for rf_id in rf_ids:
            col = rf_col_map.get(rf_id)
            if col is None:
                continue
            v = accessor.cell("Enablers", row, col)
            uplift = to_int(v, default=0)
            if uplift > 0:
                factor_uplifts.append({"factor_id": rf_id, "max_uplift": uplift})

        enablers.append({
            "id":               en_id,
            "name":             to_str(accessor.cell("Enablers", row, EN_COL_NAME)),
            "category":         to_str(accessor.cell("Enablers", row, EN_COL_CATEGORY)),
            "effort_scale":     to_str(accessor.cell("Enablers", row, EN_COL_EFFORT)),
            "completion_level": to_int(accessor.cell("Enablers", row, EN_COL_LEVEL)),
            "factor_uplifts":   factor_uplifts,
        })
    return enablers


def read_use_cases(accessor):
    """Read all use case rows from the Use Cases sheet (no scores)."""
    use_cases = []
    for i in range(500):
        row = UC_DATA_ROW_START + i
        uc_id = accessor.cell("Use Cases", row, UC_COL_ID)
        if not uc_id or not to_str(uc_id):
            break
        uc_id = to_str(uc_id)
        if not re.match(r"UC\d+", uc_id):
            break
        use_cases.append({
            "id":                             uc_id,
            "name":                           to_str(accessor.cell("Use Cases", row, UC_COL_NAME)),
            "business_domain":                to_str(accessor.cell("Use Cases", row, UC_COL_DOMAIN)),
            "investment_theme":               to_str(accessor.cell("Use Cases", row, UC_COL_THEME)),
            "current_state":                  to_str(accessor.cell("Use Cases", row, UC_COL_STATE)),
            "regulatory_risk_classification": to_str(accessor.cell("Use Cases", row, UC_COL_RISK)),
            "enables":                        parse_pipe(accessor.cell("Use Cases", row, UC_COL_ENABLES)),
            "implementation_enablers":        parse_pipe(accessor.cell("Use Cases", row, UC_COL_ENABLERS)),
        })
    return use_cases


def read_score_tab(accessor, sheet_name, n_factors, uc_ids):
    """
    Read a score tab (Impact Scores or Readiness Scores).
    Returns: (factor_ids, weights_dict, scores_dict)
    """
    # Discover factor IDs from the header row
    factor_ids = []
    for col in range(SC_COL_SCORE_START, SC_COL_SCORE_START + n_factors + 10):
        v = accessor.cell(sheet_name, SC_FACTOR_ID_ROW, col)
        if v and re.match(r"[IR]F\d+", to_str(v)):
            factor_ids.append(to_str(v))
        elif factor_ids:
            break

    if len(factor_ids) < n_factors:
        raise ValueError(
            f"{sheet_name}: expected {n_factors} factor ID headers in row "
            f"{SC_FACTOR_ID_ROW}, found {len(factor_ids)}: {factor_ids}"
        )
    factor_ids = factor_ids[:n_factors]

    # Weights row
    weights = {}
    for i, fid in enumerate(factor_ids):
        col = SC_COL_SCORE_START + i
        weights[fid] = to_float(accessor.cell(sheet_name, SC_WEIGHT_ROW, col), default=1.0)

    # Score data rows
    uc_id_set = set(uc_ids)
    scores = {}
    for row in range(SC_DATA_ROW_START, SC_DATA_ROW_START + len(uc_ids) + 50):
        uc_id = accessor.cell(sheet_name, row, SC_COL_UC_ID)
        if not uc_id:
            continue
        uc_id = to_str(uc_id)
        if uc_id not in uc_id_set:
            continue
        scores[uc_id] = {
            fid: to_int(accessor.cell(sheet_name, row, SC_COL_SCORE_START + i), default=3)
            for i, fid in enumerate(factor_ids)
        }

    return factor_ids, weights, scores


# ── Top-level assembly ────────────────────────────────────────────────────────

def assemble(accessor, source_label):
    """
    Read all sheets via accessor and return the complete JSON-ready dict.
    accessor must implement: .cell(sheet_name, row, col) -> value
    """
    # 1. Metadata counts from Config
    eng_name = to_str(accessor.cell("Config", *CFG_ENGAGEMENT_NAME_CELL))
    n_if = to_int(accessor.cell("Config", *CFG_METADATA_IF_COUNT))
    n_rf = to_int(accessor.cell("Config", *CFG_METADATA_RF_COUNT))
    n_en = to_int(accessor.cell("Config", *CFG_METADATA_EN_COUNT))
    n_uc = to_int(accessor.cell("Config", *CFG_METADATA_UC_COUNT))

    if not all([n_if, n_rf, n_en, n_uc]):
        raise ValueError(
            f"Metadata counts incomplete — IF={n_if}, RF={n_rf}, EN={n_en}, UC={n_uc}. "
            "Check the Metadata section in the Config tab."
        )

    # 2. Factor definitions
    impact_factors = read_factors(accessor, "Config", CFG_IF_DATA_ROW_START, n_if)
    if len(impact_factors) != n_if:
        print(f"  NOTE: Metadata says {n_if} impact factors; "
              f"found {len(impact_factors)}. Using actual count.", file=sys.stderr)
        n_if = len(impact_factors)

    rf_start = find_rf_data_start(accessor, "Config", CFG_RF_SECTION_SEARCH_FROM)
    readiness_factors = read_factors(accessor, "Config", rf_start, n_rf)
    if len(readiness_factors) != n_rf:
        print(f"  NOTE: Metadata says {n_rf} readiness factors; "
              f"found {len(readiness_factors)}. Using actual count.", file=sys.stderr)
        n_rf = len(readiness_factors)

    if_ids = [f["id"] for f in impact_factors]
    rf_ids = [f["id"] for f in readiness_factors]

    # 3. Enablers
    enablers = read_enablers(accessor, rf_ids)
    if len(enablers) != n_en:
        print(f"  NOTE: Metadata says {n_en} enablers; "
              f"found {len(enablers)}. Metadata may be stale.", file=sys.stderr)
    en_id_set = {e["id"] for e in enablers}

    # 4. Use cases (descriptive fields only)
    use_cases_raw = read_use_cases(accessor)
    if len(use_cases_raw) != n_uc:
        print(f"  NOTE: Metadata says {n_uc} use cases; "
              f"found {len(use_cases_raw)}. Using actual count.", file=sys.stderr)
    uc_ids = [u["id"] for u in use_cases_raw]
    uc_id_set = set(uc_ids)

    # 5. Scores
    _, if_weights, impact_scores    = read_score_tab(accessor, "Impact Scores",    n_if, uc_ids)
    _, rf_weights, readiness_scores = read_score_tab(accessor, "Readiness Scores", n_rf, uc_ids)

    # Apply score-tab weights back to factor definitions
    for f in impact_factors:
        if f["id"] in if_weights:
            f["weight"] = if_weights[f["id"]]
    for f in readiness_factors:
        if f["id"] in rf_weights:
            f["weight"] = rf_weights[f["id"]]

    # 6. Assemble use cases with scores + validation warnings
    use_cases = []
    for uc in use_cases_raw:
        uid = uc["id"]
        bad_enables  = [x for x in uc["enables"] if x not in uc_id_set]
        bad_enablers = [x for x in uc["implementation_enablers"] if x not in en_id_set]
        if bad_enables:
            print(f"  WARNING {uid}: enables references unknown UC IDs: {bad_enables}",
                  file=sys.stderr)
        if bad_enablers:
            print(f"  WARNING {uid}: implementation_enablers references unknown EN IDs: {bad_enablers}",
                  file=sys.stderr)
        use_cases.append({
            **uc,
            "impact_scores":    impact_scores.get(uid,    {fid: 3 for fid in if_ids}),
            "readiness_scores": readiness_scores.get(uid, {fid: 3 for fid in rf_ids}),
        })

    return {
        "meta": {
            "version":            "1.0",
            "source":             source_label,
            "client":             eng_name,
            "data_model_version": "0.2",
        },
        "framework_config": {
            "impact_factors":    impact_factors,
            "readiness_factors": readiness_factors,
        },
        "implementation_enablers": enablers,
        "use_cases":               use_cases,
    }
