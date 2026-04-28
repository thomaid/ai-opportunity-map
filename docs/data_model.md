# AI Opportunity Mapping Tool — Data Model Specification

| | |
|---|---|
| **Document** | AI Opportunity Mapping Tool — Data Model Specification |
| **Version** | 0.2 |
| **Status** | Draft |
| **Date** | March 2026 |

This document defines the data model underpinning the AI Opportunity Mapping Tool — an interactive visualisation designed to help organisations identify, prioritise and sequence AI use cases in the context of their current readiness and strategic priorities. It serves as the canonical reference for data structure, field definitions and scoring methodology, and should be updated as the model evolves.

---

## 1. Overview and Architecture

The data model comprises three interconnected object types:

- **Framework Configuration** — the set of impact factors and readiness factors (with associated weights) that define the scoring dimensions for a given client engagement. This is configured once per engagement and may be lightly customised from defaults.
- **Implementation Enablers** — foundational investments (technical, organisational or governance) that are prerequisites for one or more use cases. Enablers group use cases by shared dependency and are the basis for the "investment unlock" animation in the visualisation.
- **Use Cases** — the individual AI opportunities being assessed. Each use case carries descriptive metadata, dependency relationships, scores against all impact and readiness factors, and two derived composite scores.

```
FRAMEWORK CONFIG                    IMPLEMENTATION ENABLER
Impact factors + weights    ──────▶ Name / description
Readiness factors + weights         Effort scale
         │
         ▼
USE CASE
Name · Description · Business domain · Stakeholders · Investment theme
Current state · Regulatory risk · Enabling/enabled use cases
Implementation enablers · Impact scores · Readiness scores
Derived: Business impact score · Derived: Technical readiness score
```

A Framework Configuration is shared across all use cases in an engagement. Each use case references one or more Implementation Enablers (many-to-many). Use cases may also reference each other through directional "enables" relationships (one-to-many, stored unidirectionally with the reverse derived).

> **Design principle:** Weights and factor lists live at the Framework Configuration level, not at the individual use case level. Where a factor has low relevance to a specific use case, the convention is to score that factor 3 (neutral) so that it does not distort the composite score in either direction, rather than storing per-use-case weights.

---

## 2. Framework Configuration

A single Framework Configuration object exists per client engagement. It defines the scoring dimensions and their relative weights. Both the impact factor list and the readiness factor list may be customised from the defaults shown in Sections 2.1 and 2.2.

### 2.1 Impact Factors

Impact factors capture the different ways in which a use case could drive value for the business. Each factor has a name, a default weight, and a description. Weights across all impact factors must sum to 100.

| Factor name | Default weight | Description |
|---|---|---|
| Revenue growth | 20 | Direct contribution to top-line revenue — new income streams, higher conversion, increased wallet share. |
| Cost reduction / efficiency | 20 | Reduction in operating cost, headcount requirement, processing time or error rates. |
| Risk reduction | 20 | Reduction in regulatory, operational, credit, conduct or reputational risk exposure. |
| Customer experience | 15 | Improvement in client satisfaction, retention, NPS or perceived service quality. |
| Strategic differentiation | 15 | Contribution to competitive positioning, brand, market share or capability that is hard to replicate. |
| Employee experience | 10 | Improvement in staff productivity, satisfaction, or reduction in low-value workload. |

> **Customisation note:** This list represents a sensible default for financial services engagements. In discussion with the client, factors may be renamed, reweighted, added or removed. The tool recalculates all composite scores automatically when weights change.

### 2.2 Readiness Factors

Readiness factors capture the dimensions that determine how easy or difficult it would be to implement a use case today. Each factor is scored 1–5 at the use case level. Weights across all readiness factors must sum to 100.

| Factor name | Default weight | Description |
|---|---|---|
| Data availability & quality | 20 | Whether the data required to power this use case exists, is accessible, is sufficiently clean, and can be used within applicable regulatory and consent constraints. |
| Technical infrastructure | 15 | Whether the cloud, compute, storage, API connectivity and integration architecture required are in place or can be readily established. |
| Governance & compliance readiness | 20 | Whether appropriate AI policies, model risk frameworks, regulatory approvals and audit trails are in place for this type of use case. |
| Organisational & process readiness | 15 | Whether the business processes, roles, handoff points and change management capability needed to embed this use case are mature enough. |
| Skills & capability | 10 | Whether the internal skills (technical, domain, AI literacy) needed to build, operate and govern this use case are available or accessible. |
| Implementation effort | 10 | Inverse of implementation complexity — a high score means lower effort/cost/risk to implement. Low score = high effort. Acts as a practical friction factor. |
| Executive & stakeholder support | 10 | Whether there is clear sponsorship, budget commitment and stakeholder alignment for this use case. |

> **Regulatory risk note:** Governance & compliance readiness is scored at the use case level as part of the readiness factor set. In addition, each use case carries a standalone `regulatory_risk_classification` field (Low / Medium / High) used as a visual overlay in the tool. These are related but distinct: the factor score reflects current readiness; the classification reflects the inherent risk level of the use case regardless of current readiness.

### 2.3 Scoring Scale

All factor scores (both impact and readiness) use the following 1–5 scale:

| Score | Label | Indicative meaning |
|---|---|---|
| 1 | Very low | Negligible impact or very low readiness — significant gap to address. |
| 2 | Low | Below average. Some relevance or partial readiness, but material gaps remain. |
| 3 | Neutral / Moderate | Average or not materially applicable. Use 3 as the default for factors of low relevance to a specific use case. |
| 4 | High | Strong impact or solid readiness. Minor gaps only. |
| 5 | Very high | Exceptional impact or fully ready — no material barriers in this dimension. |

### 2.4 Composite Score Calculation

Two composite scores are derived for each use case, using the same weighted average formula applied to their respective factor sets.

**Base composite score formula:**

```
Composite score = Σ (factor score × factor weight) / Σ (factor weights)
```

Both composite scores are expressed on a 1–5 scale. The Business Impact Score drives the y-axis position in the visualisation; the Technical Readiness Score drives the x-axis position.

Weights are normalised automatically if they do not sum to exactly 100 (e.g. after adding or removing a factor during customisation). The tool recalculates composite scores in real time when weights or individual factor scores are adjusted.

Where one or more Implementation Enablers are partially or fully in place, the Technical Readiness Score for affected use cases is adjusted before the composite is calculated.

**Uplift formula (applied per factor, per use case):**

```
Adjusted factor score = min(5,  base score + Σ (max_uplift × completion_level)  across all enablers affecting that factor)
```

The ceiling of 5 applies absolutely — a factor score cannot exceed 5 regardless of the combined uplift from multiple enablers. Where a use case already scores 4 or 5 on a factor, the effective uplift is correspondingly reduced or eliminated.

The sum across enablers allows multiple enablers to each contribute partial uplift to the same factor (e.g. a data platform and a data governance programme might both improve the `data_availability` factor).

Base scores are always preserved in storage. The adjusted scores are computed at runtime for display and composite calculation purposes.

---

## 3. Implementation Enablers

An Implementation Enabler is a foundational investment — technical, organisational, data or governance — that is a prerequisite (or significant accelerant) for one or more use cases. A single enabler will typically support multiple use cases, forming the basis for the "investment cluster" groupings in the visualisation.

Enablers are not binary — they exist on a spectrum of completeness. A data catalogue might be in place but cover only a fraction of the organisation's data assets; a cloud migration might be partially complete. The `completion_level` field captures this, and the uplift delivered to dependent use case readiness scores scales accordingly.

Each enabler defines a per-factor uplift profile specifying the maximum readiness score improvement each affected factor could receive if the enabler reaches full completion. The actual uplift delivered at any given completion level is `max_uplift × completion_level` for each factor, subject to the score ceiling of 5 (see Section 2.4).

| Field | Type | Description / Notes |
|---|---|---|
| `id` | String (unique) | Unique identifier. Suggested format: EN-001, EN-002 etc. |
| `name` | String | Short descriptive name, e.g. "Unified client data platform" or "AI acceptable use policy". |
| `description` | String | Two to three sentence description of what this investment involves and why it matters. |
| `effort_scale` | Enum | Indicative scale of investment: S (weeks, low cost), M (one to three months, moderate cost), L (three to twelve months, significant cost), XL (over twelve months or organisation-wide programme). |
| `category` | Enum | Primary category: Data & Infrastructure \| Governance & Compliance \| Organisational & Process \| Skills & Capability. Used for grouping in the enabler panel. |
| `factor_uplifts` | Array of objects | Per-factor uplift profile. Each entry has two fields: `factor_id` (the readiness factor this uplift applies to) and `max_uplift` (integer 1–4, the maximum score points this factor can gain if this enabler reaches completion_level 4). Factors not listed receive no uplift from this enabler. |
| `completion_level` | Enum (stepped) | How thoroughly this enabler has been implemented. Five levels: 0 = Not started (×0.0) \| 1 = Initial / proof of concept (×0.25) \| 2 = Partial — meaningful coverage but significant gaps (×0.5) \| 3 = Substantial — broadly in place, minor gaps only (×0.75) \| 4 = Comprehensive — fully implemented and maintained (×1.0). The multiplier is applied to each `max_uplift` value to derive the delivered uplift. |

**Worked example: Metadata management solution**

```
factor_uplifts: [
  { factor_id: "data_availability",     max_uplift: 2 },
  { factor_id: "governance_compliance", max_uplift: 1 },
  { factor_id: "technical_infrastructure", max_uplift: 1 }
]
completion_level: 2  (Partial, multiplier 0.5)

Delivered uplifts at completion_level 2:
  data_availability:       +1.0  (2 × 0.5)
  governance_compliance:   +0.5  (1 × 0.5)
  technical_infrastructure: +0.5  (1 × 0.5)

If completion_level advances to 4 (Comprehensive, multiplier 1.0):
  data_availability: +2.0  |  governance_compliance: +1.0  |  technical_infrastructure: +1.0

In all cases, the adjusted factor score is capped at 5.
```

---

## 4. Use Cases

A Use Case is a discrete AI opportunity being assessed. The fields below fall into four groups: descriptive metadata, dependency relationships, factor scores, and derived composite scores.

### 4.1 Descriptive Metadata

| Field | Type | Description / Notes |
|---|---|---|
| `id` | String (unique) | Unique identifier. Suggested format: UC-001, UC-002 etc. |
| `name` | String | Short, plain-language name for the use case. Should be meaningful without the description. |
| `description` | String | Two to four sentence description: what the use case does, how it works at a high level, and what business problem it addresses. |
| `business_domain` | Enum / String | The part of the organisation this use case primarily serves. Configurable per engagement. |
| `key_stakeholders` | Array of Strings | Named or role-level stakeholders with a material interest in this use case (sponsors, business owners, impacted teams). Used for filtering and workshop facilitation. |
| `investment_theme` | Enum | High-level value category used to group use cases thematically. Suggested defaults: Efficiency (automation, cost reduction) \| Intelligence (decision support, analytics) \| Engagement (customer/employee experience) \| Foundations (enabling infrastructure or capability). Configurable per engagement. |
| `current_state` | Enum | Where the use case stands today: Hypothetical \| Identified \| Piloted \| Partial \| Live. |
| `regulatory_risk_classification` | Enum | Inherent regulatory risk: Low (internal, no customer impact) \| Medium (customer-touching or decision-support) \| High (directly informs a regulated decision or involves sensitive personal data). Displayed as a visual overlay in the tool. |

### 4.2 Dependency Relationships

| Field | Type | Description / Notes |
|---|---|---|
| `enables` | Array of Use Case IDs | The IDs of use cases that this use case enables. Stored unidirectionally; the reverse (`enabled_by`) is derived. A use case may enable zero or more others. |
| `implementation_enablers` | Array of Enabler IDs | The IDs of the Implementation Enablers (Section 3) that this use case depends on. A use case may depend on one or more enablers. |

> **Derived field: `enabled_by`** — the inverse of the `enables` relationship is derived automatically from the enables graph and does not need to be stored. It is available to the visualisation for display purposes.

### 4.3 Factor Scores

Each use case carries one score per impact factor and one score per readiness factor defined in the Framework Configuration. All scores are integers on the 1–5 scale defined in Section 2.3.

| Field | Type | Notes |
|---|---|---|
| `impact_scores` | Map\<factor_id, 1–5\> | One entry per impact factor. Must be populated for all factors; use 3 for factors of low relevance. |
| `readiness_scores` | Map\<factor_id, 1–5\> | One entry per readiness factor. Scores may be temporarily adjusted by the visualisation when enablers are toggled; the base score is preserved and the adjusted score is used for display. |

### 4.4 Derived Composite Scores

These two fields are calculated from the factor scores and weights; they are computed at runtime rather than stored.

| Field | Type | Notes |
|---|---|---|
| `business_impact_score` | Decimal (1.0–5.0) | Weighted average of all `impact_scores`. Drives y-axis position. Recalculates when impact factor weights are adjusted. |
| `technical_readiness_score` | Decimal (1.0–5.0) | Weighted average of all `readiness_scores` (with enabler uplifts applied). Drives x-axis position. Recalculates when readiness factor weights are adjusted or enabler completion levels change. |

---

## 5. Visualisation Zones

The composite scores position each use case on a two-axis chart. The chart uses dynamic axis scaling (fitted to the actual data range with padding) rather than fixed 1–5 axes, to spread data points across the full chart area.

The following zone definitions are retained for reference, though the current tool version does not display zone boundaries on the chart:

| Zone | Readiness score range | Interpretation |
|---|---|---|
| Explore | 1.0 – 2.4 | Strategically interesting but significant foundational investment needed before pursuit. Useful for longer-horizon planning. |
| Consider | 2.5 – 3.4 | Moderate readiness. Some investment or prerequisite use cases needed before delivery. Good candidates for the medium-term roadmap. |
| Deliver | 3.5 – 5.0 | Sufficiently ready to begin delivery. Prioritise based on impact score within this zone. |

---

## 6. Change Log

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | March 2026 | Yew Tree Data | Initial draft. Full data model defined including Framework Configuration, Implementation Enablers, Use Case fields, scoring methodology and visualisation zone definitions. |
| 0.2 | March 2026 | Yew Tree Data | Section 3 revised: replaced binary `score_uplift` / `status` fields with `completion_level` (five-point stepped scale with numeric multiplier 0.0–1.0) and `factor_uplifts` (per-factor max uplift array, integer 1–4 per factor). Section 2.4 updated: added uplift formula, score ceiling constraint (max 5), and multi-enabler summation rule. Worked example added to Section 3. |

*Future versions will document: JSON schema for data exchange; API specification for the interactive tool.*
