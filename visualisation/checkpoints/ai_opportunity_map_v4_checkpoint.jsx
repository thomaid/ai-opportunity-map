import { useState, useMemo, useCallback, useRef, useEffect } from "react";

const BASE_DATA = {
  meta: { version: "0.1", client: "Sample Retail Insurance Firm" },
  framework_config: {
    impact_factors: [
      { id: "IF01", name: "Revenue growth",              weight: 20 },
      { id: "IF02", name: "Cost reduction / efficiency", weight: 20 },
      { id: "IF03", name: "Risk reduction",              weight: 20 },
      { id: "IF04", name: "Customer experience",         weight: 15 },
      { id: "IF05", name: "Strategic differentiation",   weight: 15 },
      { id: "IF06", name: "Employee experience",         weight: 10 },
    ],
    readiness_factors: [
      { id: "RF01", name: "Data availability & quality",        weight: 20 },
      { id: "RF02", name: "Technical infrastructure",           weight: 15 },
      { id: "RF03", name: "Governance & compliance readiness",  weight: 20 },
      { id: "RF04", name: "Organisational & process readiness", weight: 15 },
      { id: "RF05", name: "Skills & capability",                weight: 10 },
      { id: "RF06", name: "Implementation effort",              weight: 10 },
      { id: "RF07", name: "Executive & stakeholder support",    weight: 10 },
    ],
  },
  implementation_enablers: [
    { id:"EN01", name:"Unified data platform & MLOps", category:"Data & Infrastructure", effort_scale:"XL", completion_level:1, factor_uplifts:[{factor_id:"RF01",max_uplift:2},{factor_id:"RF02",max_uplift:2},{factor_id:"RF06",max_uplift:1}] },
    { id:"EN02", name:"Data governance & metadata management", category:"Data & Infrastructure", effort_scale:"L", completion_level:2, factor_uplifts:[{factor_id:"RF01",max_uplift:2},{factor_id:"RF03",max_uplift:1},{factor_id:"RF04",max_uplift:1}] },
    { id:"EN03", name:"AI governance framework & model risk policy", category:"Governance & Compliance", effort_scale:"M", completion_level:1, factor_uplifts:[{factor_id:"RF03",max_uplift:3},{factor_id:"RF07",max_uplift:1}] },
    { id:"EN04", name:"Cloud infrastructure & API modernisation", category:"Data & Infrastructure", effort_scale:"XL", completion_level:2, factor_uplifts:[{factor_id:"RF02",max_uplift:3},{factor_id:"RF06",max_uplift:2}] },
    { id:"EN05", name:"AI skills & literacy programme", category:"Skills & Capability", effort_scale:"M", completion_level:1, factor_uplifts:[{factor_id:"RF05",max_uplift:3},{factor_id:"RF07",max_uplift:1},{factor_id:"RF04",max_uplift:1}] },
    { id:"EN06", name:"Unstructured data & document intelligence", category:"Data & Infrastructure", effort_scale:"L", completion_level:0, factor_uplifts:[{factor_id:"RF01",max_uplift:2},{factor_id:"RF02",max_uplift:1},{factor_id:"RF06",max_uplift:1}] },
    { id:"EN07", name:"Customer data & consent management", category:"Data & Infrastructure", effort_scale:"L", completion_level:1, factor_uplifts:[{factor_id:"RF01",max_uplift:2},{factor_id:"RF03",max_uplift:1},{factor_id:"RF06",max_uplift:1}] },
    { id:"EN08", name:"Process standardisation & workflow automation", category:"Organisational & Process", effort_scale:"L", completion_level:2, factor_uplifts:[{factor_id:"RF04",max_uplift:3},{factor_id:"RF06",max_uplift:1}] },
  ],
  use_cases: [
    { id:"UC01", name:"Automated FNOL triage", business_domain:"Claims", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Medium", enables:["UC02","UC03"], implementation_enablers:["EN01","EN04","EN08"], impact_scores:{IF01:2,IF02:5,IF03:3,IF04:4,IF05:3,IF06:4}, readiness_scores:{RF01:3,RF02:2,RF03:3,RF04:2,RF05:2,RF06:3,RF07:3} },
    { id:"UC02", name:"AI-assisted claims liability assessment", business_domain:"Claims", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN02","EN03","EN06"], impact_scores:{IF01:2,IF02:4,IF03:5,IF04:3,IF05:4,IF06:3}, readiness_scores:{RF01:2,RF02:2,RF03:1,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC03", name:"Claims fraud detection — motor", business_domain:"Claims", investment_theme:"Intelligence", current_state:"Piloted", regulatory_risk_classification:"High", enables:["UC04"], implementation_enablers:["EN01","EN02","EN03"], impact_scores:{IF01:2,IF02:4,IF03:5,IF04:2,IF05:3,IF06:3}, readiness_scores:{RF01:3,RF02:3,RF03:2,RF04:3,RF05:3,RF06:3,RF07:4} },
    { id:"UC04", name:"Claims fraud detection — home & contents", business_domain:"Claims", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN02","EN03"], impact_scores:{IF01:2,IF02:4,IF03:5,IF04:2,IF05:2,IF06:3}, readiness_scores:{RF01:2,RF02:3,RF03:2,RF04:3,RF05:2,RF06:3,RF07:3} },
    { id:"UC05", name:"Claims document extraction & summarisation", business_domain:"Claims", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Low", enables:["UC02"], implementation_enablers:["EN06","EN08"], impact_scores:{IF01:1,IF02:5,IF03:2,IF04:3,IF05:2,IF06:5}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:3,RF06:4,RF07:3} },
    { id:"UC06", name:"Predictive UW risk scoring — motor", business_domain:"Personal Lines Underwriting", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:["UC07"], implementation_enablers:["EN01","EN02","EN03"], impact_scores:{IF01:4,IF02:3,IF03:5,IF04:2,IF05:5,IF06:2}, readiness_scores:{RF01:2,RF02:2,RF03:1,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC07", name:"Predictive UW risk scoring — home", business_domain:"Personal Lines Underwriting", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN02","EN03"], impact_scores:{IF01:4,IF02:3,IF03:5,IF04:2,IF05:4,IF06:2}, readiness_scores:{RF01:2,RF02:2,RF03:1,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC08", name:"Underwriting referral assist", business_domain:"Personal Lines Underwriting", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Medium", enables:[], implementation_enablers:["EN06","EN05"], impact_scores:{IF01:2,IF02:4,IF03:3,IF04:2,IF05:3,IF06:4}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:2,RF06:3,RF07:3} },
    { id:"UC09", name:"Automated policy endorsement processing", business_domain:"Operations & IT", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Low", enables:[], implementation_enablers:["EN04","EN08"], impact_scores:{IF01:1,IF02:5,IF03:2,IF04:3,IF05:2,IF06:4}, readiness_scores:{RF01:4,RF02:2,RF03:3,RF04:2,RF05:3,RF06:3,RF07:3} },
    { id:"UC10", name:"AI-powered customer self-service", business_domain:"Customer & Distribution", investment_theme:"Engagement", current_state:"Identified", regulatory_risk_classification:"Medium", enables:[], implementation_enablers:["EN04","EN07","EN05"], impact_scores:{IF01:3,IF02:4,IF03:2,IF04:5,IF05:4,IF06:3}, readiness_scores:{RF01:3,RF02:2,RF03:2,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC11", name:"Personalised renewal pricing & retention", business_domain:"Customer & Distribution", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN02","EN03","EN07"], impact_scores:{IF01:5,IF02:3,IF03:3,IF04:4,IF05:5,IF06:2}, readiness_scores:{RF01:2,RF02:2,RF03:1,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC12", name:"Next best action for inbound contacts", business_domain:"Customer & Distribution", investment_theme:"Engagement", current_state:"Hypothetical", regulatory_risk_classification:"Medium", enables:[], implementation_enablers:["EN01","EN07","EN04"], impact_scores:{IF01:4,IF02:2,IF03:2,IF04:4,IF05:4,IF06:3}, readiness_scores:{RF01:2,RF02:2,RF03:2,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC13", name:"Complaint root cause analysis", business_domain:"Compliance & Risk", investment_theme:"Intelligence", current_state:"Identified", regulatory_risk_classification:"Medium", enables:[], implementation_enablers:["EN06","EN02"], impact_scores:{IF01:2,IF02:3,IF03:5,IF04:3,IF05:3,IF06:3}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:2,RF06:3,RF07:4} },
    { id:"UC14", name:"Regulatory change impact assessment", business_domain:"Compliance & Risk", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Low", enables:[], implementation_enablers:["EN06","EN03"], impact_scores:{IF01:1,IF02:4,IF03:4,IF04:1,IF05:3,IF06:4}, readiness_scores:{RF01:3,RF02:3,RF03:4,RF04:3,RF05:3,RF06:3,RF07:4} },
    { id:"UC15", name:"Automated conduct risk monitoring", business_domain:"Compliance & Risk", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN03","EN06"], impact_scores:{IF01:1,IF02:4,IF03:5,IF04:2,IF05:3,IF06:3}, readiness_scores:{RF01:2,RF02:2,RF03:2,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC16", name:"AI-assisted actuarial reserving", business_domain:"Finance & Actuarial", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN02","EN03"], impact_scores:{IF01:2,IF02:3,IF03:5,IF04:1,IF05:4,IF06:3}, readiness_scores:{RF01:2,RF02:2,RF03:1,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC17", name:"Finance process automation — reconciliations", business_domain:"Finance & Actuarial", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Low", enables:[], implementation_enablers:["EN04","EN08"], impact_scores:{IF01:1,IF02:5,IF03:2,IF04:1,IF05:2,IF06:4}, readiness_scores:{RF01:4,RF02:2,RF03:3,RF04:2,RF05:3,RF06:3,RF07:3} },
    { id:"UC18", name:"Broker relationship scoring & segmentation", business_domain:"Customer & Distribution", investment_theme:"Intelligence", current_state:"Identified", regulatory_risk_classification:"Low", enables:[], implementation_enablers:["EN01","EN02"], impact_scores:{IF01:4,IF02:2,IF03:2,IF04:3,IF05:3,IF06:3}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:3,RF06:3,RF07:3} },
    { id:"UC19", name:"Intelligent policy & renewal doc generation", business_domain:"Customer & Distribution", investment_theme:"Engagement", current_state:"Identified", regulatory_risk_classification:"Medium", enables:[], implementation_enablers:["EN07","EN05","EN03"], impact_scores:{IF01:2,IF02:3,IF03:2,IF04:4,IF05:3,IF06:3}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:3,RF06:3,RF07:3} },
    { id:"UC20", name:"Claims repair network optimisation", business_domain:"Claims", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Low", enables:[], implementation_enablers:["EN01","EN08"], impact_scores:{IF01:1,IF02:4,IF03:2,IF04:4,IF05:3,IF06:3}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:2,RF05:3,RF06:3,RF07:3} },
    { id:"UC21", name:"Telematics / UBI pricing", business_domain:"Personal Lines Underwriting", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN02","EN03","EN04"], impact_scores:{IF01:5,IF02:2,IF03:4,IF04:3,IF05:5,IF06:2}, readiness_scores:{RF01:1,RF02:1,RF03:1,RF04:2,RF05:2,RF06:1,RF07:3} },
    { id:"UC22", name:"HR & workforce planning intelligence", business_domain:"Operations & IT", investment_theme:"Intelligence", current_state:"Identified", regulatory_risk_classification:"Low", enables:[], implementation_enablers:["EN01","EN02"], impact_scores:{IF01:1,IF02:3,IF03:2,IF04:1,IF05:2,IF06:5}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:3,RF06:3,RF07:3} },
    { id:"UC23", name:"AI co-pilot for contact centre agents", business_domain:"Customer & Distribution", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Medium", enables:["UC12"], implementation_enablers:["EN05","EN06","EN04"], impact_scores:{IF01:2,IF02:4,IF03:3,IF04:4,IF05:3,IF06:5}, readiness_scores:{RF01:3,RF02:2,RF03:3,RF04:3,RF05:2,RF06:3,RF07:3} },
    { id:"UC24", name:"CAT event claims surge management", business_domain:"Claims", investment_theme:"Engagement", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN04","EN08"], impact_scores:{IF01:2,IF02:3,IF03:4,IF04:5,IF05:4,IF06:3}, readiness_scores:{RF01:2,RF02:1,RF03:2,RF04:1,RF05:2,RF06:2,RF07:3} },
    { id:"UC25", name:"Pricing optimisation — competitive positioning", business_domain:"Personal Lines Underwriting", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN01","EN02","EN03"], impact_scores:{IF01:5,IF02:2,IF03:3,IF04:2,IF05:5,IF06:2}, readiness_scores:{RF01:2,RF02:2,RF03:1,RF04:2,RF05:2,RF06:2,RF07:3} },
    { id:"UC26", name:"Internal knowledge management assistant", business_domain:"Operations & IT", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Low", enables:["UC08","UC23"], implementation_enablers:["EN06","EN05"], impact_scores:{IF01:1,IF02:4,IF03:2,IF04:2,IF05:2,IF06:5}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:2,RF06:4,RF07:3} },
    { id:"UC27", name:"Vulnerable customer identification & routing", business_domain:"Customer & Distribution", investment_theme:"Engagement", current_state:"Identified", regulatory_risk_classification:"High", enables:[], implementation_enablers:["EN07","EN03","EN05"], impact_scores:{IF01:1,IF02:2,IF03:5,IF04:4,IF05:3,IF06:2}, readiness_scores:{RF01:2,RF02:3,RF03:2,RF04:3,RF05:2,RF06:3,RF07:4} },
    { id:"UC28", name:"Supplier & third-party risk monitoring", business_domain:"Compliance & Risk", investment_theme:"Intelligence", current_state:"Hypothetical", regulatory_risk_classification:"Medium", enables:[], implementation_enablers:["EN06","EN02"], impact_scores:{IF01:1,IF02:3,IF03:4,IF04:1,IF05:3,IF06:3}, readiness_scores:{RF01:3,RF02:3,RF03:3,RF04:3,RF05:2,RF06:3,RF07:3} },
    { id:"UC29", name:"Automated MI & management reporting", business_domain:"Finance & Actuarial", investment_theme:"Efficiency", current_state:"Identified", regulatory_risk_classification:"Low", enables:[], implementation_enablers:["EN01","EN04"], impact_scores:{IF01:1,IF02:5,IF03:2,IF04:1,IF05:2,IF06:4}, readiness_scores:{RF01:3,RF02:2,RF03:3,RF04:3,RF05:3,RF06:3,RF07:3} },
    { id:"UC30", name:"Proactive churn prevention — personal lines", business_domain:"Customer & Distribution", investment_theme:"Engagement", current_state:"Hypothetical", regulatory_risk_classification:"Medium", enables:[], implementation_enablers:["EN01","EN07","EN02"], impact_scores:{IF01:4,IF02:2,IF03:2,IF04:4,IF05:3,IF06:2}, readiness_scores:{RF01:2,RF02:2,RF03:2,RF04:2,RF05:2,RF06:2,RF07:3} },
  ]
};

const COMPLETION_LEVELS = [
  { value:0, label:"Not started",   multiplier:0.00 },
  { value:1, label:"Initial",       multiplier:0.25 },
  { value:2, label:"Partial",       multiplier:0.50 },
  { value:3, label:"Substantial",   multiplier:0.75 },
  { value:4, label:"Comprehensive", multiplier:1.00 },
];

const COLOR_MODES = [
  { id:"investment_theme",               label:"Investment theme",  field:"investment_theme" },
  { id:"business_domain",               label:"Business domain",   field:"business_domain" },
  { id:"regulatory_risk_classification", label:"Regulatory risk",   field:"regulatory_risk_classification" },
  { id:"current_state",                 label:"Current state",     field:"current_state" },
];

const PALETTE = ["#3B82F6","#F59E0B","#22C55E","#8B5CF6","#F97316","#06B6D4","#EC4899","#84CC16","#14B8A6","#A78BFA"];

const FIXED_COLOR_MAPS = {
  regulatory_risk_classification: { "High": "#EF4444", "Medium": "#F97316", "Low": "#22C55E" },
};

function buildColorMap(ucs, field) {
  if (FIXED_COLOR_MAPS[field]) return FIXED_COLOR_MAPS[field];
  const vals = [...new Set(ucs.map(uc => uc[field]))].sort();
  const map = {};
  vals.forEach((v, i) => { map[v] = PALETTE[i % PALETTE.length]; });
  return map;
}

function computeScores(uc, impactWeights, readinessWeights, enablerMap) {
  const iTotal = Object.values(impactWeights).reduce((a,b)=>a+b,0)||1;
  const impactScore = Object.entries(impactWeights).reduce((s,[id,w])=>s+(uc.impact_scores[id]||3)*w,0)/iTotal;

  const rTotal = Object.values(readinessWeights).reduce((a,b)=>a+b,0)||1;
  // Uplift is delta from each enabler's stored baseline, not absolute.
  // enablerMap carries: completion_level (current session value) and
  // baseline_completion_level (the stored value when the tool loaded).
  // If the user hasn't touched a slider, delta = 0 and no adjustment is shown.
  const adj = { ...uc.readiness_scores };
  const deltas = {};
  for (const enId of uc.implementation_enablers) {
    const en = enablerMap[enId]; if (!en) continue;
    const baseMult    = COMPLETION_LEVELS.find(l=>l.value===en.baseline_completion_level)?.multiplier??0;
    const currentMult = COMPLETION_LEVELS.find(l=>l.value===en.completion_level)?.multiplier??0;
    const deltaMult   = currentMult - baseMult;
    if (deltaMult === 0) continue;
    for (const fu of en.factor_uplifts) {
      const delta = fu.max_uplift * deltaMult;
      deltas[fu.factor_id] = (deltas[fu.factor_id]||0) + delta;
    }
  }
  for (const [factorId, delta] of Object.entries(deltas)) {
    adj[factorId] = Math.max(1, Math.min(5, (adj[factorId]||3) + delta));
  }
  const readinessScore = Object.entries(readinessWeights).reduce((s,[id,w])=>s+(adj[id]||3)*w,0)/rTotal;
  return { impactScore, readinessScore, adjustedReadiness: adj, readinessDeltas: deltas };
}

function computeAxisRanges(computedUCs) {
  const xs = computedUCs.map(c=>c.scores.readinessScore);
  const ys = computedUCs.map(c=>c.scores.impactScore);
  const xMin=Math.min(...xs), xMax=Math.max(...xs), yMin=Math.min(...ys), yMax=Math.max(...ys);
  const xPad=(xMax-xMin)*0.2||0.3, yPad=(yMax-yMin)*0.2||0.3;
  return { xMin:Math.max(1,xMin-xPad), xMax:Math.min(5,xMax+xPad), yMin:Math.max(1,yMin-yPad), yMax:Math.min(5,yMax+yPad) };
}

const THEMES = {
  dark: {
    bg:"#060D1A", surface:"#0D1829", surface2:"#162032", border:"#1E2D42", border2:"#2A3D55",
    text:"#E8F0FE", textMid:"#8BA3BE", textDim:"#4A6580",
    gridLine:"rgba(255,255,255,0.03)", axisTick:"#2A3D55", tooltip:"#0D1829", nodeLabel:"#fff",
  },
  light: {
    bg:"#F0F4F8", surface:"#FFFFFF", surface2:"#F0F4F8", border:"#D6E0EC", border2:"#B8CCDE",
    text:"#0D1829", textMid:"#3A5068", textDim:"#7A95AC",
    gridLine:"rgba(0,0,0,0.04)", axisTick:"#C0D0DE", tooltip:"#FFFFFF", nodeLabel:"#fff",
  }
};

const PAD = { top:32, right:32, bottom:56, left:56 };

function Tooltip({ uc, scores, color, x, y, chartW, chartH, T, enablerMap }) {
  if (!uc) return null;
  const flipX = x > chartW*0.62, flipY = y > chartH*0.58;
  return (
    <div style={{
      position:"absolute", left:flipX?x-272:x+16, top:flipY?y-230:y+16,
      width:260, background:T.tooltip, border:`1px solid ${T.border2}`,
      borderRadius:10, padding:"13px 14px", pointerEvents:"none", zIndex:50,
      boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
        <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}}/>
        <div style={{color:T.text,fontWeight:700,fontSize:12,lineHeight:1.3}}>{uc.id} — {uc.name}</div>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:9}}>
        {[{l:"IMPACT",v:scores.impactScore.toFixed(2),c:"#F59E0B"},{l:"READINESS",v:scores.readinessScore.toFixed(2),c:"#3B82F6"}].map(m=>(
          <div key={m.l}>
            <div style={{color:T.textDim,fontSize:9,marginBottom:1}}>{m.l}</div>
            <div style={{color:m.c,fontSize:18,fontWeight:800}}>{m.v}</div>
          </div>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:8,display:"grid",gap:4}}>
        {[
          {label:"Domain",   val:uc.business_domain},
          {label:"Theme",    val:uc.investment_theme},
          {label:"Risk",     val:uc.regulatory_risk_classification},
          {label:"State",    val:uc.current_state},
          {label:"Enablers", val:uc.implementation_enablers.map(id=>enablerMap[id]?.name||id).join(", ")||"—"},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:10}}>
            <span style={{color:T.textDim,flexShrink:0}}>{r.label}</span>
            <span style={{color:T.textMid,textAlign:"right"}}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScatterPlot({ computedUCs, colorMode, colorMap, highlightedUCIds, legendFilter, selectedUC, onSelectUC, T, enablerMap, showArrows }) {
  const [hover, setHover] = useState(null);
  const [hoverPos, setHoverPos] = useState({x:0,y:0});
  const containerRef = useRef(null);
  const [dims, setDims] = useState({w:700,h:500});

  useEffect(()=>{
    const obs = new ResizeObserver(es=>{ const e=es[0]; if(e) setDims({w:e.contentRect.width,h:e.contentRect.height}); });
    if(containerRef.current) obs.observe(containerRef.current);
    return ()=>obs.disconnect();
  },[]);

  const {w,h} = dims;
  const plotW = w-PAD.left-PAD.right;
  const plotH = h-PAD.top-PAD.bottom;
  const axisRanges = useMemo(()=>computeAxisRanges(computedUCs),[computedUCs]);
  const {xMin,xMax,yMin,yMax} = axisRanges;
  const toX = v => PAD.left + ((v-xMin)/(xMax-xMin))*plotW;
  const toY = v => PAD.top  + ((yMax-v)/(yMax-yMin))*plotH;

  const nTicks = 5;
  const xTicks = Array.from({length:nTicks},(_,i)=>xMin+(xMax-xMin)*i/(nTicks-1));
  const yTicks = Array.from({length:nTicks},(_,i)=>yMin+(yMax-yMin)*i/(nTicks-1));
  const field = COLOR_MODES.find(m=>m.id===colorMode)?.field||"investment_theme";

  const isDimmed = (ucId) => {
    if (highlightedUCIds && !highlightedUCIds.has(ucId)) return true;
    if (legendFilter.size > 0) {
      const uc = computedUCs.find(c=>c.uc.id===ucId)?.uc;
      if (uc && !legendFilter.has(uc[field])) return true;
    }
    return false;
  };

  // Compute Bezier arrow paths between visible (non-dimmed) use cases
  const arrowPaths = useMemo(() => {
    if (!showArrows) return [];
    const visibleIds = new Set(computedUCs.filter(({uc}) => !isDimmed(uc.id)).map(({uc}) => uc.id));
    const posMap = {};
    for (const {uc, scores} of computedUCs) {
      posMap[uc.id] = { cx: toX(scores.readinessScore), cy: toY(scores.impactScore) };
    }
    const paths = [];
    for (const {uc} of computedUCs) {
      if (!visibleIds.has(uc.id)) continue;
      for (const targetId of (uc.enables || [])) {
        if (!visibleIds.has(targetId)) continue;
        const s = posMap[uc.id], t = posMap[targetId];
        if (!s || !t) continue;

        const dx = t.cx - s.cx, dy = t.cy - s.cy;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;

        // Perpendicular offset — bows the curve sideways
        // Magnitude scales with distance, capped to avoid wild curves
        const bowStrength = Math.min(dist * 0.35, 80);
        // Perpendicular unit vector (rotate 90°)
        const px = -dy / dist, py = dx / dist;

        // Control point at midpoint + perpendicular offset
        const mx = (s.cx + t.cx) / 2 + px * bowStrength;
        const my = (s.cy + t.cy) / 2 + py * bowStrength;

        // Shorten start/end so arrows sit outside node circles (r=12)
        const nodeR = 14;
        const sx = s.cx + (dx / dist) * nodeR;
        const sy = s.cy + (dy / dist) * nodeR;

        // For end point, approach from control point direction
        const ex2 = t.cx - mx, ey2 = t.cy - my;
        const ed = Math.sqrt(ex2*ex2 + ey2*ey2) || 1;
        const tx2 = t.cx - (ex2 / ed) * nodeR;
        const ty2 = t.cy - (ey2 / ed) * nodeR;

        paths.push({
          id: `${uc.id}-${targetId}`,
          d: `M ${sx} ${sy} Q ${mx} ${my} ${tx2} ${ty2}`,
          sourceId: uc.id,
          targetId,
        });
      }
    }
    return paths;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArrows, computedUCs, highlightedUCIds, legendFilter, w, h, xMin, xMax, yMin, yMax]);

  return (
    <div ref={containerRef} style={{position:"relative",width:"100%",height:"100%"}}>
      <svg width={w} height={h} style={{display:"block"}}>
        {xTicks.map((v,i)=>(
          <line key={`gx${i}`} x1={toX(v)} x2={toX(v)} y1={PAD.top} y2={PAD.top+plotH} stroke={T.gridLine} strokeWidth={1}/>
        ))}
        {yTicks.map((v,i)=>(
          <line key={`gy${i}`} x1={PAD.left} x2={PAD.left+plotW} y1={toY(v)} y2={toY(v)} stroke={T.gridLine} strokeWidth={1}/>
        ))}
        <line x1={PAD.left} x2={PAD.left+plotW} y1={PAD.top+plotH} y2={PAD.top+plotH} stroke={T.axisTick} strokeWidth={1.5}/>
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top+plotH} stroke={T.axisTick} strokeWidth={1.5}/>
        {xTicks.map((v,i)=>(
          <text key={`tx${i}`} x={toX(v)} y={PAD.top+plotH+18} textAnchor="middle" fill={T.textDim} fontSize={10}>{v.toFixed(1)}</text>
        ))}
        {yTicks.map((v,i)=>(
          <text key={`ty${i}`} x={PAD.left-10} y={toY(v)+4} textAnchor="end" fill={T.textDim} fontSize={10}>{v.toFixed(1)}</text>
        ))}
        <text x={PAD.left+plotW/2} y={h-8} textAnchor="middle" fill={T.textMid} fontSize={11} fontWeight={500}>Technical Readiness →</text>
        <text transform={`translate(14,${PAD.top+plotH/2}) rotate(-90)`} textAnchor="middle" fill={T.textMid} fontSize={11} fontWeight={500}>Business Impact →</text>

        {/* Arrow marker definition */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(148,163,184,0.7)"/>
          </marker>
        </defs>

        {/* Dependency arrows — rendered below nodes */}
        {showArrows && arrowPaths.map(p => (
          <path
            key={p.id}
            d={p.d}
            fill="none"
            stroke="rgba(148,163,184,0.55)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            markerEnd="url(#arrowhead)"
            pointerEvents="none"
          />
        ))}

        {computedUCs.filter(({uc})=>isDimmed(uc.id)).map(({uc,scores})=>{
          const cx=toX(scores.readinessScore), cy=toY(scores.impactScore);
          const color=colorMap[uc[field]]||"#94A3B8";
          return (
            <g key={uc.id} style={{cursor:"pointer"}} onClick={()=>onSelectUC(uc.id===selectedUC?null:uc.id)}>
              <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.06}/>
              <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.12}/>
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={8} fontWeight={600} opacity={0.2} pointerEvents="none">{uc.id.replace("UC","")}</text>
            </g>
          );
        })}

        {computedUCs.filter(({uc})=>!isDimmed(uc.id)).map(({uc,scores})=>{
          const cx=toX(scores.readinessScore), cy=toY(scores.impactScore);
          const color=colorMap[uc[field]]||"#94A3B8";
          const isSel=uc.id===selectedUC;
          return (
            <g key={uc.id} style={{cursor:"pointer"}}
               onClick={()=>onSelectUC(uc.id===selectedUC?null:uc.id)}
               onMouseEnter={()=>{setHover(uc.id);setHoverPos({x:cx,y:cy});}}
               onMouseLeave={()=>setHover(null)}>
              {isSel&&<circle cx={cx} cy={cy} r={22} fill="none" stroke={color} strokeWidth={2} opacity={0.45}/>}
              <circle cx={cx} cy={cy} r={17} fill={color} opacity={0.15}/>
              <circle cx={cx} cy={cy} r={12} fill={color} opacity={isSel?1:0.85} stroke={isSel?"#fff":"none"} strokeWidth={isSel?2:0}/>
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={T.nodeLabel} fontSize={10} fontWeight={700} pointerEvents="none">{uc.id.replace("UC","")}</text>
            </g>
          );
        })}
      </svg>
      {hover&&(()=>{
        const hit=computedUCs.find(c=>c.uc.id===hover);
        const f=COLOR_MODES.find(m=>m.id===colorMode)?.field||"investment_theme";
        const color=hit?colorMap[hit.uc[f]]||"#94A3B8":"#94A3B8";
        return hit?<Tooltip uc={hit.uc} scores={hit.scores} color={color} x={hoverPos.x} y={hoverPos.y} chartW={w} chartH={h} T={T} enablerMap={enablerMap}/>:null;
      })()}
    </div>
  );
}

function WeightSlider({label,value,onChange,T}) {
  return (
    <div style={{marginBottom:7}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
        <span style={{fontSize:11,color:T.textMid}}>{label}</span>
        <span style={{fontSize:11,color:T.text,fontWeight:600,minWidth:24,textAlign:"right"}}>{value}</span>
      </div>
      <input type="range" min={0} max={40} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:"#3B82F6",cursor:"pointer"}}/>
    </div>
  );
}

function EnablerPanel({enablers,completionLevels,baseCompletionLevels,onChangeLevel,highlightedEnablers,onToggleEnablerHighlight,ucsByEnabler,T}) {
  return (
    <div>
      <p style={{fontSize:11,color:T.textDim,marginBottom:10,lineHeight:1.5}}>
        ✓ Tick to highlight dependent use cases. Adjust completion to model score impacts relative to the current baseline.
      </p>
      {enablers.map(en=>{
        const level    = completionLevels[en.id]??en.completion_level;
        const baseline = baseCompletionLevels?.[en.id]??en.completion_level;
        const changed  = level !== baseline;
        const isHl     = highlightedEnablers.has(en.id);
        const affected = ucsByEnabler[en.id]||[];
        const deltaVal = level - baseline;
        const deltaLabel = changed ? (deltaVal>0?`▲ +${deltaVal}`:`▼ ${deltaVal}`) : null;
        return (
          <div key={en.id} style={{marginBottom:8,padding:"10px 12px",
            background:isHl?"rgba(59,130,246,0.08)":T.surface2,
            border:`1px solid ${isHl?"#3B82F6":changed?"#F59E0B":T.border}`,
            borderRadius:8}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:7}}>
              <button onClick={()=>onToggleEnablerHighlight(en.id)} style={{width:16,height:16,borderRadius:3,flexShrink:0,marginTop:1,cursor:"pointer",
                background:isHl?"#3B82F6":"transparent",
                border:`1.5px solid ${isHl?"#3B82F6":T.textDim}`,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                {isHl&&<span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}
              </button>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:T.text,fontWeight:600,lineHeight:1.3}}>{en.name}</div>
                <div style={{fontSize:10,color:T.textDim,marginTop:2}}>{en.effort_scale} effort · {en.category} · {affected.length} use case{affected.length!==1?"s":""}</div>
              </div>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center"}}>
                <span style={{fontSize:10,color:T.textDim}}>Completion</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {changed&&<span style={{fontSize:9,fontWeight:700,color:deltaVal>0?"#22C55E":"#EF4444"}}>{deltaLabel}</span>}
                  <span style={{fontSize:10,color:changed?"#F59E0B":T.textMid,fontWeight:600}}>
                    {COMPLETION_LEVELS.find(l=>l.value===level)?.label}
                  </span>
                </div>
              </div>
              <div style={{display:"flex",gap:3}}>
                {COMPLETION_LEVELS.map(cl=>{
                  const isBaseline = cl.value === baseline;
                  const isFilled   = cl.value <= level;
                  const isGain     = cl.value > baseline && cl.value <= level;
                  const isLost     = cl.value > level && cl.value <= baseline;
                  const bg = isGain?"#22C55E":isLost?"#EF4444":isFilled?"#3B82F6":T.border2;
                  return (
                    <button key={cl.value} onClick={()=>onChangeLevel(en.id,cl.value)} title={`${cl.label}${isBaseline?" (baseline)":""}`}
                      style={{flex:1,height:7,borderRadius:3,cursor:"pointer",
                        border:isBaseline?`1.5px solid ${T.textMid}`:"1px solid transparent",
                        background:bg,opacity:(isFilled||isLost)?0.75:0.28}}/>
                  );
                })}
              </div>
              {changed&&<div style={{fontSize:9,color:T.textDim,marginTop:4,textAlign:"right"}}>
                Baseline: {COMPLETION_LEVELS.find(l=>l.value===baseline)?.label}
              </div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function UseCaseListPanel({computedUCs,colorMode,colorMap,highlightedUCIds,legendFilter,selectedUC,onSelectUC,T}) {
  const field=COLOR_MODES.find(m=>m.id===colorMode)?.field||"investment_theme";
  const [sortBy,setSortBy]=useState("attribute");

  const sorted=useMemo(()=>{
    const arr=[...computedUCs];
    if(sortBy==="attribute") arr.sort((a,b)=>(a.uc[field]||"").localeCompare(b.uc[field]||"")||a.uc.id.localeCompare(b.uc.id));
    else if(sortBy==="impact") arr.sort((a,b)=>b.scores.impactScore-a.scores.impactScore);
    else if(sortBy==="readiness") arr.sort((a,b)=>b.scores.readinessScore-a.scores.readinessScore);
    return arr;
  },[computedUCs,sortBy,field]);

  return (
    <div>
      <div style={{display:"flex",gap:3,marginBottom:8}}>
        {[{id:"attribute",label:"By attribute"},{id:"impact",label:"Impact ↓"},{id:"readiness",label:"Readiness ↓"}].map(s=>(
          <button key={s.id} onClick={()=>setSortBy(s.id)} style={{flex:1,padding:"4px 0",fontSize:10,border:`1px solid ${sortBy===s.id?"#3B82F6":T.border2}`,borderRadius:5,background:sortBy===s.id?"#3B82F6":T.surface2,color:sortBy===s.id?"#fff":T.textMid,cursor:"pointer",fontWeight:sortBy===s.id?600:400}}>{s.label}</button>
        ))}
      </div>
      {sorted.map(({uc,scores})=>{
        const color=colorMap[uc[field]]||"#94A3B8";
        const dimmed=(highlightedUCIds&&!highlightedUCIds.has(uc.id))||(legendFilter.size>0&&!legendFilter.has(uc[field]));
        const isSel=uc.id===selectedUC;
        return (
          <div key={uc.id} onClick={()=>onSelectUC(uc.id===selectedUC?null:uc.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 8px",borderRadius:7,marginBottom:2,cursor:"pointer",background:isSel?`rgba(59,130,246,0.1)`:"transparent",border:`1px solid ${isSel?"#3B82F6":"transparent"}`,opacity:dimmed?0.28:1,transition:"opacity 0.15s"}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:9,fontWeight:700,color:"#fff"}}>{uc.id.replace("UC","")}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:T.text,fontWeight:isSel?600:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{uc.name}</div>
              <div style={{fontSize:10,color:T.textDim}}>{scores.impactScore.toFixed(1)} impact · {scores.readinessScore.toFixed(1)} readiness</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailPanel({uc,scores,impactFactors,readinessFactors,enablerMap,T}) {
  if(!uc) return (
    <div style={{color:T.textDim,fontSize:12,textAlign:"center",paddingTop:40,lineHeight:1.8}}>
      Click a use case node<br/>to see details
    </div>
  );
  return (
    <div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.textDim,marginBottom:2}}>{uc.id}</div>
        <div style={{fontSize:13,color:T.text,fontWeight:700,lineHeight:1.3,marginBottom:8}}>{uc.name}</div>
        {[
          {label:"Business domain",val:uc.business_domain},
          {label:"Investment theme",val:uc.investment_theme},
          {label:"Current state",   val:uc.current_state},
          {label:"Regulatory risk", val:uc.regulatory_risk_classification},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",marginBottom:4,paddingBottom:4,borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:10,color:T.textDim}}>{r.label}</span>
            <span style={{fontSize:10,color:T.textMid,fontWeight:500}}>{r.val}</span>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[{label:"Business impact",val:scores.impactScore.toFixed(2),c:"#F59E0B"},{label:"Tech readiness",val:scores.readinessScore.toFixed(2),c:"#3B82F6"}].map(m=>(
          <div key={m.label} style={{background:T.surface2,borderRadius:8,padding:"8px 10px",textAlign:"center",border:`1px solid ${T.border}`}}>
            <div style={{fontSize:9,color:T.textDim,marginBottom:2}}>{m.label.toUpperCase()}</div>
            <div style={{fontSize:20,fontWeight:800,color:m.c}}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={{fontSize:10,color:T.textDim,marginBottom:5,fontWeight:600,letterSpacing:0.4}}>IMPACT SCORES</div>
      {impactFactors.map(f=>{
        const v=uc.impact_scores[f.id]||0;
        return (
          <div key={f.id} style={{marginBottom:5}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
              <span style={{fontSize:10,color:T.textMid}}>{f.name}</span>
              <span style={{fontSize:10,color:"#F59E0B",fontWeight:600}}>{v}</span>
            </div>
            <div style={{height:4,background:T.surface2,borderRadius:2}}>
              <div style={{height:"100%",width:`${(v/5)*100}%`,background:"#F59E0B",borderRadius:2,opacity:0.7}}/>
            </div>
          </div>
        );
      })}

      <div style={{fontSize:10,color:T.textDim,margin:"10px 0 3px",fontWeight:600,letterSpacing:0.4}}>READINESS SCORES</div>
      <div style={{fontSize:10,color:T.textDim,marginBottom:7,lineHeight:1.4,padding:"5px 8px",background:T.surface2,borderRadius:5}}>
        <span style={{color:"#3B82F6",fontWeight:600}}>■</span> Base score &nbsp;
        <span style={{color:"#22C55E",fontWeight:600}}>■</span> Uplift from enabler adjustments &nbsp;
        <span style={{color:"#EF4444",fontWeight:600}}>■</span> Reduction
      </div>
      {readinessFactors.map(f=>{
        const base=uc.readiness_scores[f.id]||0;
        const adj=scores.adjustedReadiness[f.id]||base;
        const uplift=adj-base; // can be negative if enabler level reduced below baseline
        return (
          <div key={f.id} style={{marginBottom:5}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
              <span style={{fontSize:10,color:T.textMid}}>{f.name}</span>
              <span style={{fontSize:10,fontWeight:600}}>
                <span style={{color:"#3B82F6"}}>{base}</span>
                {uplift>0.05&&<><span style={{color:"#22C55E",fontSize:9}}> +{uplift.toFixed(1)}</span><span style={{color:T.textDim,fontSize:9}}> = {adj.toFixed(1)}</span></>}
                {uplift<-0.05&&<><span style={{color:"#EF4444",fontSize:9}}> {uplift.toFixed(1)}</span><span style={{color:T.textDim,fontSize:9}}> = {adj.toFixed(1)}</span></>}
              </span>
            </div>
            <div style={{height:4,background:T.surface2,borderRadius:2,position:"relative",overflow:"hidden"}}>
              {uplift>=0
                ? <><div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(base/5)*100}%`,background:"#3B82F6",borderRadius:2,opacity:0.6}}/>
                    {uplift>0.05&&<div style={{position:"absolute",left:`${(base/5)*100}%`,top:0,height:"100%",width:`${(uplift/5)*100}%`,background:"#22C55E",borderRadius:2,opacity:0.8}}/>}</>
                : <><div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(adj/5)*100}%`,background:"#3B82F6",borderRadius:2,opacity:0.6}}/>
                    <div style={{position:"absolute",left:`${(adj/5)*100}%`,top:0,height:"100%",width:`${(Math.abs(uplift))/5*100}%`,background:"#EF4444",borderRadius:2,opacity:0.7}}/></>
              }
            </div>
          </div>
        );
      })}

      {uc.implementation_enablers.length>0&&(
        <>
          <div style={{fontSize:10,color:T.textDim,margin:"10px 0 5px",fontWeight:600,letterSpacing:0.4}}>IMPLEMENTATION ENABLERS</div>
          {uc.implementation_enablers.map(id=>{
            const en=enablerMap[id]; if(!en) return null;
            const lvl=COMPLETION_LEVELS.find(l=>l.value===en.completion_level);
            return (
              <div key={id} style={{fontSize:10,marginBottom:4,display:"flex",justifyContent:"space-between",gap:8}}>
                <span style={{color:T.textMid,flex:1}}>{en.name}</span>
                <span style={{color:en.completion_level===4?"#22C55E":en.completion_level===0?T.textDim:"#F59E0B",fontWeight:500,flexShrink:0}}>{lvl?.label}</span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function ColorLegend({colorMode,colorMap,legendFilter,onToggleLegendFilter,T}) {
  const mode=COLOR_MODES.find(m=>m.id===colorMode);
  return (
    <div style={{padding:"8px 16px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",minHeight:42}}>
      <span style={{fontSize:10,color:T.textDim,fontWeight:600,flexShrink:0}}>{mode?.label?.toUpperCase()}</span>
      <div style={{display:"flex",flexWrap:"wrap",gap:"3px 8px",flex:1}}>
        {Object.entries(colorMap).map(([val,color])=>{
          const active=legendFilter.size===0||legendFilter.has(val);
          return (
            <button key={val} onClick={()=>onToggleLegendFilter(val)} style={{display:"flex",alignItems:"center",gap:5,background:legendFilter.has(val)?`${color}22`:"transparent",border:legendFilter.has(val)?`1px solid ${color}`:`1px solid transparent`,cursor:"pointer",padding:"2px 7px",borderRadius:12,opacity:active?1:0.3,transition:"all 0.15s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
              <span style={{fontSize:10,color:T.textMid,whiteSpace:"nowrap"}}>{val}</span>
            </button>
          );
        })}
      </div>
      {legendFilter.size>0&&(
        <button onClick={()=>onToggleLegendFilter(null)} style={{fontSize:10,color:"#3B82F6",background:"transparent",border:"none",cursor:"pointer",padding:"2px 6px",flexShrink:0}}>Clear</button>
      )}
    </div>
  );
}

// ChangesBar removed — replaced by Export button in header

function ExportModal({payload,onClose,T}) {
  const json = JSON.stringify(payload, null, 2);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(()=>{
        setCopied(true);
        setTimeout(()=>setCopied(false), 2000);
      });
    }
  };

  const changes = payload?.session_changes || {};
  const sections = [
    { key:"enabler_completion_levels", label:"Enabler completion levels" },
    { key:"impact_weights",            label:"Impact factor weights" },
    { key:"readiness_weights",         label:"Readiness factor weights" },
  ].filter(s=>changes[s.key] && Object.keys(changes[s.key]).length>0);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,
                 display:"flex",alignItems:"center",justifyContent:"center"}}
         onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:520,maxHeight:"80vh",display:"flex",flexDirection:"column",
                   background:T.surface,border:`1px solid ${T.border2}`,
                   borderRadius:12,boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        {/* Header */}
        <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${T.border}`,
                     display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>Session changes</div>
            <div style={{fontSize:11,color:T.textDim,marginTop:2}}>
              Exported {payload?.exported_at?.slice(0,19).replace("T"," ")} · {payload?.client}
            </div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",
            color:T.textDim,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 4px"}}>✕</button>
        </div>

        {/* Summary */}
        <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          {sections.length===0
            ? <div style={{fontSize:12,color:T.textDim}}>No meaningful changes to export.</div>
            : sections.map(s=>(
              <div key={s.key} style={{marginBottom:10}}>
                <div style={{fontSize:10,color:T.textDim,fontWeight:600,letterSpacing:0.4,marginBottom:5}}>
                  {s.label.toUpperCase()}
                </div>
                {Object.entries(changes[s.key]).map(([id,v])=>(
                  <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                        marginBottom:3,padding:"4px 8px",background:T.surface2,borderRadius:5}}>
                    <span style={{fontSize:11,color:T.textMid,flex:1}}>{v.name||id}</span>
                    <span style={{fontSize:11,fontWeight:600,flexShrink:0}}>
                      <span style={{color:T.textDim}}>{v.from_label||v.from}</span>
                      <span style={{color:T.textDim}}> → </span>
                      <span style={{color:v.to>v.from?"#22C55E":"#EF4444"}}>
                        {v.to_label||v.to}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ))
          }
        </div>

        {/* Raw JSON */}
        <div style={{flex:1,overflow:"auto",padding:"12px 20px"}}>
          <div style={{fontSize:10,color:T.textDim,fontWeight:600,letterSpacing:0.4,marginBottom:6}}>
            RAW JSON — copy and apply to source data
          </div>
          <pre style={{margin:0,fontSize:10,color:T.textMid,background:T.surface2,
                       padding:"10px 12px",borderRadius:6,overflowX:"auto",
                       border:`1px solid ${T.border}`,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
            {json}
          </pre>
        </div>

        {/* Footer */}
        <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,
                     display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
          <button onClick={onClose} style={{padding:"6px 14px",borderRadius:7,fontSize:12,
            border:`1px solid ${T.border2}`,background:"transparent",color:T.textMid,cursor:"pointer"}}>
            Close
          </button>
          <button onClick={handleCopy} style={{padding:"6px 16px",borderRadius:7,fontSize:12,
            border:"none",background:copied?"#22C55E":"#3B82F6",color:"#fff",
            cursor:"pointer",fontWeight:600,transition:"background 0.2s",minWidth:80}}>
            {copied?"✓ Copied":"Copy JSON"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PANEL_TABS = [{id:"enablers",label:"Enablers"},{id:"weights",label:"Weights"},{id:"list",label:"Use Cases"},{id:"detail",label:"Detail"}];

export default function App() {
  const [themeKey, setThemeKey] = useState("dark");
  const T = THEMES[themeKey];
  const [baseData, setBaseData] = useState(()=>JSON.parse(JSON.stringify(BASE_DATA)));
  const [session, setSession] = useState({completionLevels:{},impactWeights:{},readinessWeights:{}});
  const [colorMode, setColorMode] = useState("investment_theme");
  const [highlightedEnablers, setHighlightedEnablers] = useState(new Set());
  const [legendFilter, setLegendFilter] = useState(new Set());
  const [selectedUC, setSelectedUC] = useState(null);
  const [activePanel, setActivePanel] = useState("enablers");
  const [showArrows, setShowArrows] = useState(false);

  const enablerMap = useMemo(()=>{
    const map={};
    for(const en of baseData.implementation_enablers) map[en.id]={
      ...en,
      baseline_completion_level: en.completion_level,
      completion_level: session.completionLevels[en.id]??en.completion_level,
    };
    return map;
  },[baseData,session.completionLevels]);

  const impactWeights = useMemo(()=>{
    const base=Object.fromEntries(baseData.framework_config.impact_factors.map(f=>[f.id,f.weight]));
    return {...base,...session.impactWeights};
  },[baseData,session.impactWeights]);

  const readinessWeights = useMemo(()=>{
    const base=Object.fromEntries(baseData.framework_config.readiness_factors.map(f=>[f.id,f.weight]));
    return {...base,...session.readinessWeights};
  },[baseData,session.readinessWeights]);

  const computedUCs = useMemo(()=>baseData.use_cases.map(uc=>({uc,scores:computeScores(uc,impactWeights,readinessWeights,enablerMap)})),[baseData,impactWeights,readinessWeights,enablerMap]);

  const field = COLOR_MODES.find(m=>m.id===colorMode)?.field||"investment_theme";
  const colorMap = useMemo(()=>buildColorMap(baseData.use_cases,field),[baseData,field]);

  useEffect(()=>setLegendFilter(new Set()),[colorMode]);

  const highlightedUCIds = useMemo(()=>{
    if(highlightedEnablers.size===0) return null;
    const ids=new Set();
    for(const uc of baseData.use_cases) if(uc.implementation_enablers.some(id=>highlightedEnablers.has(id))) ids.add(uc.id);
    return ids;
  },[highlightedEnablers,baseData]);

  const ucsByEnabler = useMemo(()=>{
    const map={};
    for(const uc of baseData.use_cases) for(const enId of uc.implementation_enablers){ if(!map[enId]) map[enId]=[]; map[enId].push(uc.id); }
    return map;
  },[baseData]);

  const hasChanges = useMemo(()=>Object.keys(session.completionLevels).length>0||Object.keys(session.impactWeights).length>0||Object.keys(session.readinessWeights).length>0,[session]);

  const handleChangeLevel = useCallback((enId,level)=>setSession(s=>({...s,completionLevels:{...s.completionLevels,[enId]:level}})),[]);
  const handleImpactWeight = useCallback((id,val)=>setSession(s=>({...s,impactWeights:{...s.impactWeights,[id]:val}})),[]);
  const handleReadinessWeight = useCallback((id,val)=>setSession(s=>({...s,readinessWeights:{...s.readinessWeights,[id]:val}})),[]);
  const handleToggleEnablerHighlight = useCallback(id=>setHighlightedEnablers(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;}),[]);
  const handleToggleLegendFilter = useCallback(val=>{if(val===null){setLegendFilter(new Set());return;}setLegendFilter(s=>{const n=new Set(s);n.has(val)?n.delete(val):n.add(val);return n;});},[]);

  const buildExportPayload = useCallback(()=>{
    const changes={};
    if(Object.keys(session.completionLevels).length>0){
      changes.enabler_completion_levels={};
      for(const [id,newVal] of Object.entries(session.completionLevels)){
        const en=baseData.implementation_enablers.find(e=>e.id===id);
        if(en && newVal!==en.completion_level)
          changes.enabler_completion_levels[id]={name:en.name,from:en.completion_level,to:newVal,
            from_label:COMPLETION_LEVELS.find(l=>l.value===en.completion_level)?.label,
            to_label:COMPLETION_LEVELS.find(l=>l.value===newVal)?.label};
      }
      if(Object.keys(changes.enabler_completion_levels).length===0) delete changes.enabler_completion_levels;
    }
    if(Object.keys(session.impactWeights).length>0){
      changes.impact_weights={};
      for(const [id,newVal] of Object.entries(session.impactWeights)){
        const f=baseData.framework_config.impact_factors.find(x=>x.id===id);
        if(f && newVal!==f.weight) changes.impact_weights[id]={name:f.name,from:f.weight,to:newVal};
      }
      if(Object.keys(changes.impact_weights).length===0) delete changes.impact_weights;
    }
    if(Object.keys(session.readinessWeights).length>0){
      changes.readiness_weights={};
      for(const [id,newVal] of Object.entries(session.readinessWeights)){
        const f=baseData.framework_config.readiness_factors.find(x=>x.id===id);
        if(f && newVal!==f.weight) changes.readiness_weights[id]={name:f.name,from:f.weight,to:newVal};
      }
      if(Object.keys(changes.readiness_weights).length===0) delete changes.readiness_weights;
    }
    return { exported_at:new Date().toISOString(), client:baseData.meta.client, session_changes:changes };
  },[session,baseData]);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const exportPayload = useMemo(()=>hasChanges?buildExportPayload():null,[hasChanges,buildExportPayload]);
  const handleExport = useCallback(()=>setExportModalOpen(true),[]);

  const handleReset = useCallback(()=>setSession({completionLevels:{},impactWeights:{},readinessWeights:{}}),[]);
  const selectedUCData = useMemo(()=>selectedUC?computedUCs.find(c=>c.uc.id===selectedUC):null,[selectedUC,computedUCs]);

  return (
    <>
    <div style={{height:"100vh",background:T.bg,display:"flex",flexDirection:"column",fontFamily:"'IBM Plex Sans','DM Sans',system-ui,sans-serif",color:T.text,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:700,letterSpacing:-0.3}}>AI Opportunity Map</div>
          <div style={{fontSize:10,color:T.textDim}}>{baseData.meta.client}</div>
        </div>
        {/* Attribute selector */}
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:T.textDim,fontWeight:600,letterSpacing:0.4,flexShrink:0}}>COLOUR BY</span>
          {COLOR_MODES.map(m=>{
            const active=colorMode===m.id;
            return (
              <button key={m.id} onClick={()=>setColorMode(m.id)} style={{padding:"4px 11px",borderRadius:20,border:`1px solid ${active?"#3B82F6":T.border2}`,cursor:"pointer",fontSize:11,background:active?"#3B82F6":T.surface2,color:active?"#fff":T.textMid,fontWeight:active?600:400,transition:"all 0.15s",flexShrink:0}}>
                {m.label}
              </button>
            );
          })}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          <button onClick={()=>setShowArrows(v=>!v)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${showArrows?"#8B5CF6":T.border2}`,background:showArrows?"rgba(139,92,246,0.15)":T.surface2,color:showArrows?"#8B5CF6":T.textMid,cursor:"pointer",fontSize:11,fontWeight:showArrows?600:400,transition:"all 0.15s"}}>
            {showArrows?"⤳ Hide connections":"⤳ Show connections"}
          </button>
          {hasChanges&&<button onClick={handleReset} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${T.border2}`,background:"transparent",color:T.textMid,cursor:"pointer",fontSize:11}}>↺ Reset</button>}
          <button onClick={handleExport} disabled={!hasChanges} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${hasChanges?"#3B82F6":T.border2}`,background:hasChanges?"#3B82F6":T.surface2,color:hasChanges?"#fff":T.textDim,cursor:hasChanges?"pointer":"default",fontSize:11,fontWeight:hasChanges?600:400,opacity:hasChanges?1:0.45,transition:"all 0.2s"}}>
            ↓ Export changes
          </button>
          <button onClick={()=>setThemeKey(k=>k==="dark"?"light":"dark")} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${T.border2}`,background:T.surface2,color:T.textMid,cursor:"pointer",fontSize:11}}>
            {themeKey==="dark"?"☀ Light":"☾ Dark"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,position:"relative"}}>
            <ScatterPlot computedUCs={computedUCs} colorMode={colorMode} colorMap={colorMap} highlightedUCIds={highlightedUCIds} legendFilter={legendFilter} selectedUC={selectedUC} onSelectUC={id=>{setSelectedUC(id);if(id)setActivePanel("detail");}} T={T} enablerMap={enablerMap} showArrows={showArrows}/>
          </div>
          <ColorLegend colorMode={colorMode} colorMap={colorMap} legendFilter={legendFilter} onToggleLegendFilter={handleToggleLegendFilter} T={T}/>
        </div>
        {/* Right panel */}
        <div style={{width:300,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",background:T.surface,flexShrink:0}}>
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            {PANEL_TABS.map(t=>{
              const active=activePanel===t.id;
              return (
                <button key={t.id} onClick={()=>setActivePanel(t.id)} style={{flex:1,padding:"9px 0",border:"none",cursor:"pointer",fontSize:11,background:active?`rgba(59,130,246,0.08)`:T.surface,color:active?"#3B82F6":T.textDim,borderBottom:active?"2px solid #3B82F6":"2px solid transparent",fontWeight:active?600:400}}>
                  {t.label}
                </button>
              );
            })}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 10px"}}>
            {activePanel==="enablers"&&<EnablerPanel enablers={baseData.implementation_enablers} completionLevels={{...Object.fromEntries(baseData.implementation_enablers.map(e=>[e.id,e.completion_level])),...session.completionLevels}} baseCompletionLevels={Object.fromEntries(baseData.implementation_enablers.map(e=>[e.id,e.completion_level]))} onChangeLevel={handleChangeLevel} highlightedEnablers={highlightedEnablers} onToggleEnablerHighlight={handleToggleEnablerHighlight} ucsByEnabler={ucsByEnabler} T={T}/>}
            {activePanel==="weights"&&(
              <div>
                <div style={{fontSize:10,color:T.textDim,marginBottom:8,fontWeight:600,letterSpacing:0.4}}>IMPACT FACTOR WEIGHTS</div>
                {baseData.framework_config.impact_factors.map(f=><WeightSlider key={f.id} label={f.name} value={session.impactWeights[f.id]??f.weight} onChange={v=>handleImpactWeight(f.id,v)} T={T}/>)}
                <div style={{fontSize:10,color:T.textDim,margin:"14px 0 8px",fontWeight:600,letterSpacing:0.4}}>READINESS FACTOR WEIGHTS</div>
                {baseData.framework_config.readiness_factors.map(f=><WeightSlider key={f.id} label={f.name} value={session.readinessWeights[f.id]??f.weight} onChange={v=>handleReadinessWeight(f.id,v)} T={T}/>)}
                <div style={{marginTop:10,padding:"8px 10px",background:T.surface2,borderRadius:6,fontSize:10,color:T.textDim,lineHeight:1.5}}>
                  Weights are relative. Scores normalise by total — increasing one factor implicitly reduces the influence of others.
                </div>
              </div>
            )}
            {activePanel==="list"&&<UseCaseListPanel computedUCs={computedUCs} colorMode={colorMode} colorMap={colorMap} highlightedUCIds={highlightedUCIds} legendFilter={legendFilter} selectedUC={selectedUC} onSelectUC={id=>{setSelectedUC(id);if(id)setActivePanel("detail");}} T={T}/>}
            {activePanel==="detail"&&<DetailPanel uc={selectedUCData?.uc} scores={selectedUCData?.scores} impactFactors={baseData.framework_config.impact_factors} readinessFactors={baseData.framework_config.readiness_factors} enablerMap={enablerMap} T={T}/>}
          </div>
        </div>
      </div>

    </div>
    {exportModalOpen&&<ExportModal payload={exportPayload} onClose={()=>setExportModalOpen(false)} T={T}/>}
    </>
  );
}
