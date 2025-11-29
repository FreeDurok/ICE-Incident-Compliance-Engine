export interface TaxonomyValue {
  code: string;
  label: string;
  description: string;
}

export interface SubPredicate {
  code: string;
  name: string;
  description: string;
  values: TaxonomyValue[];
}

export interface Predicate {
  code: string;
  name: string;
  description: string;
  has_subpredicates: boolean;
  subpredicates: SubPredicate[];
  values: TaxonomyValue[];
}

export interface MacroCategory {
  code: string;
  name: string;
  description: string;
  predicates: Predicate[];
}

export interface WizardStep {
  step: number;
  title: string;
  description: string;
  macrocategory: string;
  predicates: string[];
}
