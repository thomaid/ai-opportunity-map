# AI Opportunity Map

An interactive tool for identifying, scoring and prioritising AI use cases against organisational readiness. Built for consulting engagements in regulated industries (financial services, insurance, etc.).

## What it does

Plots AI use cases on a two-axis chart — **Business Impact** (y) vs **Technical Readiness** (x) — using weighted scores across configurable factor sets. Supports:

- Colour-coding by investment theme, business domain, regulatory risk or current state
- Enabler-based filtering (highlight use cases dependent on a selected investment)
- Delta-based enabler completion modelling (adjust completion levels to see score impacts)
- Live weight adjustment for impact and readiness factors
- Dependency arrows showing which use cases enable others
- Light / dark mode
- JSON data import and publish-to-client workflow

## Repository structure

```
visualisation/          React artifact (.jsx) and standalone HTML file
  checkpoints/          Versioned snapshots (v3–v5)

extractor/              Python script to convert the Excel workbook to JSON
  extract_to_json.py

data/                   Sample dataset and Excel workbook
  sample_data_retail_insurance.json
  ai_opportunity_map_data_v2.xlsx

docs/                   Data model specification and user guide
  ai_opportunity_map_data_model_v0.2.docx
  ai_opportunity_map_guide.docx
```

## Workflow

1. **Data entry** — populate `data/ai_opportunity_map_data_v2.xlsx` with use cases, scores and enablers
2. **Extract** — run `python3 extractor/extract_to_json.py data/your_workbook.xlsx` to produce JSON
3. **Load** — open `visualisation/ai_opportunity_map.html` in a browser, click **↑ Load data** and select the JSON
4. **Explore** — adjust weights, enabler levels and filters in the workshop
5. **Publish** — click **⬡ Publish** to generate a pre-loaded client HTML file

## Requirements

- **Visualisation tool**: any modern browser (Chrome, Edge, Safari, Firefox). Internet connection required on first open for CDN scripts.
- **Extractor**: Python 3.8+, `openpyxl` (`pip install openpyxl`)
- **Data workbook**: Microsoft Excel or compatible

## Data model

See `docs/ai_opportunity_map_data_model_v0.2.docx` for the full specification including field definitions, scoring methodology and the enabler uplift calculation.

---

*Yew Tree Data Consulting — Internal tooling*
