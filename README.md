# AI Opportunity Map

An interactive tool for identifying, scoring and prioritising AI use cases against an organisation's current readiness and strategic priorities. Built for consulting engagements in regulated industries (financial services, insurance, and similar).

---

## What it does

The tool plots AI use cases on a two-axis chart — **Business Impact** (y-axis) vs **Technical Readiness** (x-axis) — using weighted scores across configurable sets of impact and readiness factors. It is designed to support two primary activities:

- **Workshop facilitation** — helping clients explore how different investment choices, priority weightings, or foundational enablers would shift their use case landscape
- **Client communication** — producing a shareable, interactive HTML file that clients can open directly in a browser, pre-loaded with their assessment results

The tool does not require any server infrastructure. It runs entirely in the browser as a single HTML file.

---

## Key features

- **Scatter plot visualisation** with dynamic axis scaling fitted to the actual data range
- **Colour coding** by investment theme, business domain, regulatory risk, or current state
- **Clickable colour key** for filtering by attribute value
- **Enabler panel** — tick enablers to highlight dependent use cases; adjust completion levels to model the score impact of foundational investments
- **Weight sliders** — adjust the relative importance of impact and readiness factors in real time
- **Dependency arrows** — toggleable curved arrows showing which use cases enable others
- **Detail panel** — full use case breakdown including factor score bars, enabler uplifts, and clickable enables/enabled-by relationships
- **JSON data import** — load any client dataset produced by the extractor scripts
- **Publish workflow** — generate a pre-loaded client HTML file with session adjustments baked in
- **SVG export** — download the current chart state as a vector file for presentations
- **Light / dark mode**

---

## Repository structure

```
visualisation/
  ai_opportunity_map.html       Standalone HTML tool (open this in a browser)
  ai_opportunity_map.jsx        React source artifact
  checkpoints/                  Versioned snapshots (v3, v4, v5)

extractor/
  core.py                       Shared extraction logic
  extract_from_excel.py         Convert from Excel (.xlsx) workbook
  extract_from_sheets.py        Convert from Google Sheets
  SETUP.md                      Setup instructions for the Google Sheets extractor

data/
  ai_opportunity_map_data_v2.xlsx   Excel workbook template (source of truth for data entry)
  sample_data_retail_insurance.json Sample dataset (retail insurance firm, 30 use cases)

docs/
  data_model.md                 Data model specification (field definitions, scoring methodology)
  user_guide.md                 User guide for the visualisation tool
  ai_opportunity_tool_data_model_v0.2.docx  Original Word version of the data model spec
  ai_opportunity_map_guide.docx             Original Word version of the user guide
```

---

## How to use it

### Opening the tool

Open `visualisation/ai_opportunity_map.html` in any modern browser (Chrome or Edge recommended). An internet connection is required on first open for CDN scripts (React, Babel); after that it runs offline.

The tool opens pre-loaded with a sample retail insurance dataset. Use **↑ Load data** in the header to replace it with a real client dataset.

### Preparing client data

Client data lives in an Excel workbook (`data/ai_opportunity_map_data_v2.xlsx`) or Google Sheet. The workbook has six tabs:

| Tab              | Purpose                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| README           | Setup guidance and conventions                                                |
| Config           | Engagement metadata, factor definitions, and dropdown lookup tables           |
| Enablers         | One row per implementation enabler, with per-factor uplift values             |
| Use Cases        | One row per use case with descriptive fields and pipe-delimited relationships |
| Impact Scores    | 1–5 scores per use case per impact factor                                     |
| Readiness Scores | 1–5 scores per use case per readiness factor                                  |

Once populated, run the extractor to produce a JSON file for loading into the tool.

### Running the extractor

**From Excel:**

```bash
pip install openpyxl
python3 extractor/extract_from_excel.py data/your_workbook.xlsx
```

**From Google Sheets:**

```bash
pip install gspread google-auth-oauthlib
python3 extractor/extract_from_sheets.py https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

See `extractor/SETUP.md` for the one-time OAuth credential setup required for the Google Sheets extractor.

Both extractors produce identical JSON output. The file is ready to load into the tool immediately.

### Workshop workflow

1. Populate the Excel workbook (or Google Sheet) with the client's use cases and scores
2. Run the extractor → JSON file
3. Open `ai_opportunity_map.html` → **↑ Load data** → select the JSON
4. Run the workshop: explore colour modes, enabler impacts, weight adjustments
5. **↓ SVG** to capture the agreed chart view
6. **⬡ Publish** to generate a pre-loaded client HTML file

### Publishing to the client

The **⬡ Publish** button generates a standalone HTML file with the client's data (and any session adjustments) permanently embedded. The client can open this file directly in a browser — no setup, no import step. All interactive features remain available.

---

## Data model

The full data model specification — including field definitions, the scoring methodology, the enabler uplift calculation, and the JSON schema — is documented in [`docs/data_model.md`](docs/data_model.md).

Key design principles:

- **Spreadsheet is source of truth; visualisation is the presentation layer** — scores are entered in the workbook and extracted to JSON; the tool does not write back to the spreadsheet
- **Config-driven schema** — the number and identity of impact factors, readiness factors, and enablers are read from the Config tab; no hardcoded column counts in the extractor
- **Delta-based enabler uplift** — stored completion levels represent the current baseline, already reflected in the readiness scores; UI adjustments are relative changes from that baseline
- **Relative weights** — factor weights normalise automatically; there is no requirement for them to sum to a fixed total

---

## Requirements

| Component               | Requirements                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Visualisation tool      | Any modern browser (Chrome, Edge, Safari, Firefox). Internet connection on first open for CDN scripts. |
| Excel extractor         | Python 3.8+, `openpyxl`                                                                                |
| Google Sheets extractor | Python 3.8+, `gspread`, `google-auth-oauthlib`, OAuth credentials (see `extractor/SETUP.md`)           |
| Data workbook           | Microsoft Excel or compatible                                                                          |

---

*Yew Tree Data Consulting — Internal tooling*
