/**
 * Project types for critical data science and critical care trials
 * Organized by category for better UI/UX
 */

export interface ProjectTypeCategory {
  name: string;
  types: ProjectType[];
}

export interface ProjectType {
  value: string;
  label: string;
  description?: string;
  color?: string;
}

export const PROJECT_TYPE_CATEGORIES: ProjectTypeCategory[] = [
  {
    name: "Clinical Trials",
    types: [
      { 
        value: "rct", 
        label: "Randomized Controlled Trial (RCT)",
        description: "Gold standard for clinical research with random assignment",
        color: "#10B981"
      },
      { 
        value: "pragmatic_rct", 
        label: "Pragmatic RCT",
        description: "Real-world effectiveness trial in routine clinical practice",
        color: "#059669"
      },
      { 
        value: "cluster_rct", 
        label: "Cluster RCT",
        description: "Randomization at group/institution level",
        color: "#047857"
      },
      { 
        value: "adaptive_trial", 
        label: "Adaptive Trial",
        description: "Design modifications based on accumulating data",
        color: "#6366F1"
      },
      { 
        value: "stepped_wedge", 
        label: "Stepped-Wedge Trial",
        description: "Sequential rollout across clusters over time",
        color: "#4F46E5"
      },
      { 
        value: "crossover_trial", 
        label: "Crossover Trial",
        description: "Participants receive multiple interventions in sequence",
        color: "#7C3AED"
      }
    ]
  },
  {
    name: "Observational Studies",
    types: [
      { 
        value: "cohort_prospective", 
        label: "Prospective Cohort",
        description: "Following participants forward in time",
        color: "#3B82F6"
      },
      { 
        value: "cohort_retrospective", 
        label: "Retrospective Cohort",
        description: "Historical data analysis of past outcomes",
        color: "#2563EB"
      },
      { 
        value: "case_control", 
        label: "Case-Control",
        description: "Comparing cases with matched controls",
        color: "#1D4ED8"
      },
      { 
        value: "cross_sectional", 
        label: "Cross-Sectional",
        description: "Snapshot of population at single time point",
        color: "#1E40AF"
      },
      { 
        value: "longitudinal", 
        label: "Longitudinal",
        description: "Repeated observations over extended time",
        color: "#1E3A8A"
      },
      { 
        value: "registry_based", 
        label: "Registry-Based",
        description: "Analysis using clinical/disease registries",
        color: "#06B6D4"
      }
    ]
  },
  {
    name: "Data Science & Analytics",
    types: [
      { 
        value: "ml_predictive", 
        label: "ML Predictive Modeling",
        description: "Machine learning for outcome prediction",
        color: "#F59E0B"
      },
      { 
        value: "nlp_analysis", 
        label: "NLP/Text Mining",
        description: "Natural language processing of clinical notes",
        color: "#F97316"
      },
      { 
        value: "ehr_mining", 
        label: "EHR Data Mining",
        description: "Electronic health record analysis",
        color: "#EA580C"
      },
      { 
        value: "real_world_evidence", 
        label: "Real-World Evidence (RWE)",
        description: "Analysis of real-world data sources",
        color: "#DC2626"
      },
      { 
        value: "federated_learning", 
        label: "Federated Learning",
        description: "Multi-site ML without data sharing",
        color: "#B91C1C"
      },
      { 
        value: "causal_inference", 
        label: "Causal Inference",
        description: "Estimating causal effects from observational data",
        color: "#991B1B"
      },
      { 
        value: "network_analysis", 
        label: "Network Analysis",
        description: "Analyzing relationships and patterns",
        color: "#7F1D1D"
      }
    ]
  },
  {
    name: "Critical Care Specific",
    types: [
      { 
        value: "sepsis_trial", 
        label: "Sepsis Management Trial",
        description: "Studies on sepsis detection/treatment",
        color: "#EF4444"
      },
      { 
        value: "ards_trial", 
        label: "ARDS Trial",
        description: "Acute respiratory distress syndrome research",
        color: "#DC2626"
      },
      { 
        value: "ventilation_protocol", 
        label: "Ventilation Protocol",
        description: "Mechanical ventilation optimization",
        color: "#B91C1C"
      },
      { 
        value: "sedation_protocol", 
        label: "Sedation Protocol",
        description: "ICU sedation management studies",
        color: "#991B1B"
      },
      { 
        value: "delirium_prevention", 
        label: "Delirium Prevention",
        description: "ICU delirium prevention/management",
        color: "#7F1D1D"
      },
      { 
        value: "early_mobilization", 
        label: "Early Mobilization",
        description: "ICU mobility and rehabilitation",
        color: "#EC4899"
      },
      { 
        value: "nutrition_protocol", 
        label: "Nutrition Protocol",
        description: "Critical care nutrition optimization",
        color: "#DB2777"
      }
    ]
  },
  {
    name: "Quality Improvement & Implementation",
    types: [
      { 
        value: "qi_project", 
        label: "Quality Improvement (QI)",
        description: "Systematic improvement of care processes",
        color: "#84CC16"
      },
      { 
        value: "implementation_science", 
        label: "Implementation Science",
        description: "Translating evidence into practice",
        color: "#65A30D"
      },
      { 
        value: "pdsa_cycle", 
        label: "PDSA Cycle",
        description: "Plan-Do-Study-Act improvement cycle",
        color: "#4D7C0F"
      },
      { 
        value: "bundle_implementation", 
        label: "Bundle Implementation",
        description: "Care bundle deployment and evaluation",
        color: "#365314"
      },
      { 
        value: "clinical_decision_support", 
        label: "Clinical Decision Support",
        description: "CDS tool development/evaluation",
        color: "#14532D"
      }
    ]
  },
  {
    name: "Systematic Reviews & Meta-Analysis",
    types: [
      { 
        value: "systematic_review", 
        label: "Systematic Review",
        description: "Comprehensive literature synthesis",
        color: "#6B7280"
      },
      { 
        value: "meta_analysis", 
        label: "Meta-Analysis",
        description: "Statistical pooling of study results",
        color: "#4B5563"
      },
      { 
        value: "scoping_review", 
        label: "Scoping Review",
        description: "Mapping available evidence",
        color: "#374151"
      },
      { 
        value: "living_review", 
        label: "Living Systematic Review",
        description: "Continuously updated evidence synthesis",
        color: "#1F2937"
      }
    ]
  },
  {
    name: "Pilot & Feasibility",
    types: [
      { 
        value: "pilot_study", 
        label: "Pilot Study",
        description: "Small-scale preliminary study",
        color: "#A855F7"
      },
      { 
        value: "feasibility_study", 
        label: "Feasibility Study",
        description: "Assessing practicality of larger trial",
        color: "#9333EA"
      },
      { 
        value: "proof_of_concept", 
        label: "Proof of Concept",
        description: "Demonstrating principle viability",
        color: "#7C3AED"
      }
    ]
  },
  {
    name: "Other Study Types",
    types: [
      { 
        value: "diagnostic_accuracy", 
        label: "Diagnostic Accuracy",
        description: "Evaluating diagnostic test performance",
        color: "#0EA5E9"
      },
      { 
        value: "prognostic_model", 
        label: "Prognostic Model",
        description: "Developing/validating prediction models",
        color: "#0284C7"
      },
      { 
        value: "cost_effectiveness", 
        label: "Cost-Effectiveness Analysis",
        description: "Economic evaluation of interventions",
        color: "#0369A1"
      },
      { 
        value: "qualitative_research", 
        label: "Qualitative Research",
        description: "Interviews, focus groups, ethnography",
        color: "#075985"
      },
      { 
        value: "mixed_methods", 
        label: "Mixed Methods",
        description: "Combining quantitative and qualitative",
        color: "#0C4A6E"
      },
      { 
        value: "simulation_study", 
        label: "Simulation Study",
        description: "In-silico or mannequin-based research",
        color: "#082F49"
      }
    ]
  }
];

// Flatten all project types for easy access
export const ALL_PROJECT_TYPES: ProjectType[] = PROJECT_TYPE_CATEGORIES.reduce(
  (acc, category) => [...acc, ...category.types],
  [] as ProjectType[]
);

// Helper function to get project type details
export function getProjectType(value: string): ProjectType | undefined {
  return ALL_PROJECT_TYPES.find(type => type.value === value);
}

// Helper function to get project type label
export function getProjectTypeLabel(value: string): string {
  const type = getProjectType(value);
  return type?.label || value;
}

// Helper function to get project type color
export function getProjectTypeColor(value: string): string {
  const type = getProjectType(value);
  return type?.color || '#6B7280'; // Default gray if no color specified
}