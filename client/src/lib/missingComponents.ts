// Centralized missing components detection — used by Dashboard, ProgramDetails, Programs page
// Respects both disabledComponents (module toggles) and dismissedWarnings (N/A items)

interface Program {
  description?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  objectives?: any;
  kpis?: any;
  disabledComponents?: any;
  dismissedWarnings?: any;
}

export interface MissingComponent {
  key: string;        // e.g. "owner", "start_date", "milestones"
  label: string;      // e.g. "Owner", "Start Date", "Milestones"
  field?: string;     // program field to edit, if applicable
  type: 'field' | 'module'; // field = program property, module = related data
}

export function getMissingComponents(
  program: Program,
  counts: { risks: number; milestones: number; adopters: number }
): MissingComponent[] {
  const disabled: string[] = Array.isArray(program.disabledComponents) ? program.disabledComponents : [];
  const dismissed: string[] = Array.isArray(program.dismissedWarnings) ? program.dismissedWarnings : [];

  const missing: MissingComponent[] = [];

  const check = (key: string, label: string, condition: boolean, type: 'field' | 'module', field?: string) => {
    if (condition && !dismissed.includes(key)) {
      missing.push({ key, label, type, field });
    }
  };

  check('description', 'Description', !program.description || program.description.trim().length < 10, 'field', 'description');
  check('owner', 'Owner', !program.ownerId && !program.ownerName, 'field', 'ownerId');
  check('start_date', 'Start Date', !program.startDate, 'field', 'startDate');
  check('end_date', 'End Date', !program.endDate, 'field', 'endDate');
  check('objectives', 'Objectives', !program.objectives || (Array.isArray(program.objectives) && !program.objectives.length), 'field', 'objectives');
  check('kpis', 'KPIs', !program.kpis || (Array.isArray(program.kpis) && !program.kpis.length), 'field', 'kpis');
  check('risks', 'Risks', counts.risks === 0, 'module');
  check('milestones', 'Milestones', counts.milestones === 0, 'module');

  if (!disabled.includes('adopters')) {
    check('adopters', 'Adopter Teams', counts.adopters === 0, 'module');
  }

  return missing;
}
