/**
 * Test Data Generator for LabSync API Testing
 * Use these functions in Postman pre-request scripts to generate realistic test data
 */

// Medical Research Project Names Generator
const generateProjectName = () => {
  const prefixes = [
    'Clinical Trial:',
    'Study:',
    'Research:',
    'Investigation:',
    'Analysis:',
    'Evaluation:',
    'Assessment:',
    'Review:'
  ];
  
  const topics = [
    'COVID-19 Vaccine Efficacy',
    'Diabetes Management Protocol',
    'Heart Disease Prevention',
    'Mental Health Intervention',
    'Cancer Biomarkers',
    'Pediatric Asthma Treatment',
    'Alzheimer\'s Disease Progression',
    'Hypertension Control Methods',
    'Obesity Prevention Strategy',
    'Antibiotic Resistance Patterns',
    'Sleep Disorder Treatment',
    'Chronic Pain Management',
    'Stroke Recovery Protocol',
    'Immunotherapy Response',
    'Genetic Testing Accuracy'
  ];
  
  const phases = [
    'Phase I',
    'Phase II',
    'Phase III',
    'Phase IV',
    'Pilot',
    'Retrospective',
    'Prospective',
    'Longitudinal',
    'Cross-sectional'
  ];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const phase = phases[Math.floor(Math.random() * phases.length)];
  
  return `${prefix} ${topic} - ${phase}`;
};

// ORA Number Generator
const generateORANumber = () => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `ORA-${year}-${sequence.toString().padStart(3, '0')}`;
};

// IRB Number Generator
const generateIRBNumber = () => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 9999) + 1;
  return `IRB${year}${month}-${sequence.toString().padStart(4, '0')}`;
};

// Grant Number Generator
const generateGrantNumber = () => {
  const agencies = ['NIH', 'NSF', 'CDC', 'FDA', 'PCORI', 'AHRQ'];
  const types = ['R01', 'R21', 'R03', 'K08', 'K23', 'U01', 'P30', 'T32'];
  const agency = agencies[Math.floor(Math.random() * agencies.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const number = Math.floor(Math.random() * 999999) + 100000;
  return `${agency}-${type}-${number}`;
};

// Research Team Member Generator
const generateTeamMember = () => {
  const firstNames = [
    'Sarah', 'Michael', 'Jennifer', 'David', 'Elizabeth',
    'Robert', 'Maria', 'James', 'Patricia', 'John',
    'Linda', 'William', 'Barbara', 'Richard', 'Susan'
  ];
  
  const lastNames = [
    'Johnson', 'Smith', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'
  ];
  
  const titles = [
    'MD', 'PhD', 'MD, PhD', 'RN', 'MPH',
    'PharmD', 'DNP', 'MS', 'MA', 'BS'
  ];
  
  const roles = [
    'Principal Investigator',
    'Co-Investigator',
    'Research Coordinator',
    'Data Analyst',
    'Clinical Research Nurse',
    'Study Coordinator',
    'Biostatistician',
    'Research Assistant',
    'Lab Technician',
    'Regulatory Specialist'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const title = titles[Math.floor(Math.random() * titles.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  
  return {
    name: `${firstName} ${lastName}, ${title}`,
    firstName: firstName,
    lastName: lastName,
    email: `${firstName.toLowerCase()}_${lastName.toLowerCase()}@rush.edu`,
    role: role,
    initials: `${firstName[0]}${lastName[0]}`
  };
};

// Task Generator
const generateTask = () => {
  const actions = [
    'Complete IRB submission for',
    'Analyze data from',
    'Prepare manuscript for',
    'Review protocol for',
    'Collect samples for',
    'Schedule meeting about',
    'Update documentation for',
    'Train staff on',
    'Audit compliance for',
    'Submit grant proposal for'
  ];
  
  const subjects = [
    'patient recruitment',
    'data collection phase',
    'statistical analysis',
    'interim results',
    'safety monitoring',
    'regulatory compliance',
    'budget review',
    'team training',
    'site initiation',
    'closeout procedures'
  ];
  
  const action = actions[Math.floor(Math.random() * actions.length)];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  
  return `${action} ${subject}`;
};

// Comment Generator with Medical Context
const generateComment = (includemention = false) => {
  const comments = [
    'The preliminary results look promising. We should consider expanding the sample size.',
    'IRB approval received. We can proceed with patient recruitment.',
    'Data quality check completed. No significant issues found.',
    'Statistical analysis plan needs review before we proceed.',
    'Budget allocation approved for the next quarter.',
    'Site visit scheduled for next week. Please prepare all documentation.',
    'Protocol amendment submitted to address safety concerns.',
    'Enrollment target reached. Moving to data analysis phase.',
    'Grant proposal draft ready for internal review.',
    'Compliance audit passed with no major findings.'
  ];
  
  let comment = comments[Math.floor(Math.random() * comments.length)];
  
  if (includemention) {
    const mentions = ['@JohnDoe', '@SarahSmith', '@DrJohnson', '@TeamLead'];
    const mention = mentions[Math.floor(Math.random() * mentions.length)];
    comment = `${mention} ${comment}`;
  }
  
  return comment;
};

// Future Date Generator
const generateFutureDate = (daysFromNow = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow) + 1);
  return date.toISOString();
};

// Past Date Generator
const generatePastDate = (daysAgo = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo) + 1);
  return date.toISOString();
};

// Priority Generator
const generatePriority = () => {
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const weights = [0.2, 0.5, 0.25, 0.05]; // Weighted distribution
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < priorities.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return priorities[i];
    }
  }
  
  return 'MEDIUM';
};

// Status Generator
const generateProjectStatus = () => {
  const statuses = [
    'PLANNING',
    'IRB_SUBMISSION',
    'IRB_APPROVED',
    'RECRUITING',
    'DATA_COLLECTION',
    'DATA_ANALYSIS',
    'MANUSCRIPT_PREP',
    'UNDER_REVIEW',
    'PUBLISHED',
    'COMPLETED',
    'ON_HOLD',
    'CANCELLED'
  ];
  
  return statuses[Math.floor(Math.random() * statuses.length)];
};

// Funding Source Generator
const generateFundingSource = () => {
  const sources = [
    'NIH',
    'NSF',
    'CDC',
    'Industry Sponsored',
    'Foundation Grant',
    'Internal Funding',
    'State Grant',
    'Federal Grant',
    'Private Donor',
    'Crowdfunding'
  ];
  
  return sources[Math.floor(Math.random() * sources.length)];
};

// External Collaborators Generator
const generateCollaborators = () => {
  const institutions = [
    'Northwestern University',
    'University of Chicago',
    'University of Illinois Chicago',
    'Loyola University Medical Center',
    'Mayo Clinic',
    'Cleveland Clinic',
    'Johns Hopkins University',
    'Harvard Medical School',
    'Stanford University',
    'Yale University'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1;
  const selected = [];
  
  for (let i = 0; i < count; i++) {
    const inst = institutions[Math.floor(Math.random() * institutions.length)];
    if (!selected.includes(inst)) {
      selected.push(inst);
    }
  }
  
  return selected.join(', ');
};

// Study Type Generator
const generateStudyType = () => {
  const types = [
    'Randomized Controlled Trial',
    'Observational Study',
    'Case-Control Study',
    'Cohort Study',
    'Cross-sectional Study',
    'Systematic Review',
    'Meta-analysis',
    'Case Series',
    'Qualitative Study',
    'Mixed Methods Study'
  ];
  
  return types[Math.floor(Math.random() * types.length)];
};

// Sample Size Generator
const generateSampleSize = () => {
  const sizes = [10, 25, 50, 100, 200, 500, 1000, 5000];
  return sizes[Math.floor(Math.random() * sizes.length)];
};

// Budget Generator
const generateBudget = () => {
  const min = 10000;
  const max = 5000000;
  const budget = Math.floor(Math.random() * (max - min) + min);
  return Math.round(budget / 1000) * 1000; // Round to nearest thousand
};

// Export functions for use in Postman
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateProjectName,
    generateORANumber,
    generateIRBNumber,
    generateGrantNumber,
    generateTeamMember,
    generateTask,
    generateComment,
    generateFutureDate,
    generatePastDate,
    generatePriority,
    generateProjectStatus,
    generateFundingSource,
    generateCollaborators,
    generateStudyType,
    generateSampleSize,
    generateBudget
  };
}

// Example usage in Postman pre-request script:
/*
// Copy the function you need into your pre-request script
// For example:

const generateProjectName = () => {
  const topics = ['COVID-19', 'Diabetes', 'Heart Disease'];
  const phases = ['Phase I', 'Phase II', 'Phase III'];
  return `Study: ${topics[Math.floor(Math.random() * topics.length)]} - ${phases[Math.floor(Math.random() * phases.length)]}`;
};

pm.environment.set('project_name', generateProjectName());
pm.environment.set('ora_number', generateORANumber());
pm.environment.set('due_date', generateFutureDate(90));
*/