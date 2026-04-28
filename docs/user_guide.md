# AI Opportunity Map — User Guide

**Version 1.0**

This guide explains how to use the AI Opportunity Map — an interactive tool for identifying, scoring and prioritising AI use cases in the context of an organisation's current readiness and strategic priorities.

The tool is delivered as a single HTML file that runs directly in any modern web browser. No installation is required.

---

## 1. Overview

The AI Opportunity Map plots AI use cases on a two-axis chart: **Business Impact** on the vertical axis and **Technical Readiness** on the horizontal axis. The position of each use case reflects weighted scores calculated from a set of configurable impact and readiness factors.

The tool supports two primary use cases:

- **Workshop facilitation** — exploring how different investment choices or priority weightings affect which use cases should be tackled first
- **Stakeholder communication** — providing a shared visual language for discussing the AI opportunity landscape and agreeing on sequencing

> **Opening the tool:** Double-click the `.html` file to open it in your browser. An internet connection is required on first open (to load React and Babel from CDN). After that, the file runs offline. Chrome or Edge are recommended.

---

## 2. The Chart

Each circle on the chart represents one AI use case. The number inside the circle is a shorthand identifier (e.g. "3" = UC03). Hover over any circle to see a tooltip with the full use case name, scores and key attributes. Click a circle to select it and open its full detail in the Detail panel on the right.

### 2.1 Axis scales

Both axes are scaled dynamically to the range of the actual data, with a small padding margin. This means the axis labels will vary depending on the dataset — they do not always run from 1 to 5. The purpose is to spread the data points across the full chart area and make differences between use cases easier to read.

### 2.2 Colour coding

Use cases are colour-coded according to the currently selected attribute. The active attribute is shown in the colour key at the bottom of the chart. Four options are available, selectable via the **Colour by** pill buttons in the header:

| Attribute | What it shows |
|---|---|
| Investment theme | Groups use cases by primary value category: Efficiency, Intelligence, Engagement, or Foundations. |
| Business domain | Groups by the part of the organisation the use case primarily serves. |
| Regulatory risk | Colour-codes by inherent regulatory risk: green = Low, orange = Medium, red = High. |
| Current state | Shows where each use case currently stands: Hypothetical, Identified, Piloted, Partial, or Live. |

### 2.3 The colour key

The colour key at the bottom of the chart is interactive. Clicking a key entry highlights only use cases with that attribute value, dimming all others. Clicking again deselects. Multiple values can be selected simultaneously. A **Clear** button appears when any filter is active.

### 2.4 Dependency arrows

The **⤳ Show connections** button in the header toggles a set of curved dotted arrows showing which use cases enable others — i.e. doing one use case first makes another possible or easier. Arrows are off by default to keep the chart uncluttered.

- Arrows only appear between use cases that are currently visible (not dimmed by a filter)
- The arrowhead points toward the use case that is enabled
- Arrows curve using a Bézier path to minimise visual clutter

---

## 3. Right-Hand Panels

The right-hand side of the tool has four tabs. Click a tab header to switch between them.

### 3.1 Enablers tab

Lists all Implementation Enablers — the foundational investments (data, technology, governance, skills) that one or more use cases depend on. Each enabler shows its effort scale, category, and the number of dependent use cases.

**Highlighting dependent use cases**

Tick the checkbox next to an enabler to highlight the use cases that depend on it. All other use cases are dimmed on the chart. Multiple enablers can be ticked simultaneously.

**Adjusting completion levels**

Each enabler has a five-segment completion bar. The five levels are:

| Level | Multiplier | Meaning |
|---|---|---|
| Not started | ×0.0 | The investment has not begun. |
| Initial | ×0.25 | Proof of concept or very limited implementation in place. |
| Partial | ×0.50 | Meaningful coverage but significant gaps remain. |
| Substantial | ×0.75 | Broadly in place with only minor gaps. |
| Comprehensive | ×1.0 | Fully implemented and actively maintained. |

The stored completion level for each enabler represents the **current baseline** — it is already reflected in the readiness scores of dependent use cases. Adjusting a completion level in the tool applies a delta relative to that baseline: moving up improves affected readiness scores; moving down reduces them. If no adjustment is made, no score change is shown.

When an enabler has been adjusted, its card border turns amber and a small indicator shows the change (e.g. ▲ +1). Segments above the baseline are green; segments below are red.

### 3.2 Weights tab

Allows the relative weighting of impact and readiness factors to be adjusted. Each factor has a slider ranging from 0 to 40.

Weights are relative — there is no requirement for them to sum to a fixed total. Increasing one factor's weight implicitly reduces the relative influence of others, since scores are normalised by the sum of all weights. Sliders can be moved independently. Score changes take effect immediately and use case positions on the chart update in real time.

### 3.3 Use Cases tab

A scrollable list of all use cases, colour-coded to match the current chart colour mode. Each entry shows the use case name and its current impact and readiness scores.

Three sort options are available at the top:

- **By attribute** — groups use cases by the currently selected colour-mode attribute
- **Impact ↓** — sorts by business impact score, highest first
- **Readiness ↓** — sorts by technical readiness score, highest first

Clicking a use case in the list selects it and switches to the Detail tab. The list respects the current highlight and filter state — dimmed use cases appear faded.

### 3.4 Detail tab

Shows the full detail for the currently selected use case. Click any node on the chart or any row in the Use Cases tab to populate this panel.

**Attribute summary** — the use case identifier, full name, and four key labelled attributes: Business domain, Investment theme, Current state, and Regulatory risk.

**Composite scores** — two tiles showing the Business Impact score and Technical Readiness score as calculated from the current weights and enabler adjustments.

**Impact score bars** — a bar chart of the individual impact factor scores (1–5) feeding into the composite Business Impact score.

**Readiness score bars** — a bar chart of the individual readiness factor scores. Each bar shows:
- **Blue** — the base score as originally entered in the dataset
- **Green extension** — uplift from enabler completion levels above baseline
- **Red extension** — reduction from enabler completion levels below baseline

If no enabler adjustments have been made, all bars appear as solid blue with no extensions.

**Implementation enablers** — the enablers this use case depends on, with their current completion level.

**Enables / Enabled by** — dependency relationships to other use cases. Both sections are clickable — clicking a related use case navigates directly to its detail view.

---

## 4. Header Controls

| Control | What it does |
|---|---|
| **Colour by** (pill buttons) | Selects which attribute colours the use case nodes and key. Options: Investment theme, Business domain, Regulatory risk, Current state. |
| **⤳ Show / Hide connections** | Toggles dependency arrows on and off. Off by default. |
| **↑ Load data** | Opens a file picker to load a JSON dataset produced by the extractor. Replaces the current dataset (with a confirmation prompt if session changes are present). |
| **↓ SVG** | Downloads the current chart as a vector SVG file, reflecting the current colour mode, filters and arrow visibility. |
| **⬡ Publish** | Generates a pre-loaded client HTML file with the current dataset and any session adjustments baked in. Greyed out until a real dataset has been loaded (see Section 5). |
| **↺ Reset** | Discards all session changes and returns to the baseline state. Only visible when session changes are present. |
| **☀ / ☾** | Switches between light and dark display themes. |

---

## 5. Loading Data and Publishing

### 5.1 Loading a dataset

Click **↑ Load data** to open a file picker and select a JSON file produced by the extractor scripts (see the `extractor/` folder). The tool will replace the current dataset with the loaded one. If session changes are present, a confirmation prompt appears first.

Once loaded, the client name from the dataset appears in the header as a green indicator (e.g. ● Acme Insurance).

### 5.2 Publishing to a client file

The **⬡ Publish** button generates a standalone HTML file pre-loaded with the current dataset — suitable for sending to a client who can open it directly in a browser with no setup required.

The published file:
- Contains the client's data (not the sample data)
- Has all current session adjustments (weight changes, enabler completion levels) permanently baked in
- Retains all interactive features (filtering, weight adjustment, connection arrows)
- Opens directly in any modern browser — no import step needed

**Consultant workflow:**
1. Run the extractor on the client spreadsheet → produces JSON
2. Open the template HTML → load the JSON via **↑ Load data**
3. Review and adjust in the tool as needed
4. Click **⬡ Publish** → download the pre-loaded client file
5. Send the HTML file to the client

---

## 6. The Sample Dataset

The tool opens with a sample dataset representing a fictional retail insurance firm. It contains 30 AI use cases spanning six business domains, assessed against seven impact factors and seven readiness factors, with eight implementation enablers.

**Business domains:** Personal Lines Underwriting, Claims, Customer & Distribution, Finance & Actuarial, Compliance & Risk, Operations & IT

**Investment themes:** Efficiency (automation and cost reduction), Intelligence (decision support and analytics), Engagement (customer and employee experience), Foundations (enabling infrastructure and capability)

**Score interpretation:** All factor scores are on a 1–5 scale. Because scores tend to cluster in the middle of the range, the chart axes scale dynamically to the actual data range — this is intentional and expected.

> **Note on readiness scores:** The readiness scores for each use case already reflect the current real-world state of each enabler at the time the dataset was created. The enabler completion levels in the Enablers tab represent that same baseline. Adjusting a completion level models a future scenario — what would the readiness scores look like if that enabler were more (or less) advanced?

---

## 7. Tips for Workshop Use

- **Start with the default view** to give participants a sense of the overall landscape before applying any filters.
- **Cycle through colour modes** — switching from Investment theme to Regulatory risk often surfaces useful patterns in the same dataset.
- **Use the Enablers tab to answer "what if"** — which foundational investment would move the most high-impact use cases into a more deliverable position? Tick multiple enablers to show the combined effect.
- **Turn on dependency arrows after the initial orientation** — they add useful context once participants are familiar with the landscape, but can be visually busy as an opening view.
- **Use the Weights tab to surface disagreements** — asking "what would the chart look like if we weighted revenue growth more heavily than risk reduction?" often provokes productive discussion.
- **Download an SVG at the end of the session** to capture the agreed view for inclusion in reports or presentations.
