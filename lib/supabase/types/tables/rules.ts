export interface RulesTable {
  Row: {
    id: number;
    rule_name: string;
    code: string;
  };
  Insert: {
    id?: number;
    rule_name: string;
    code: string;
  };
  Update: {
    id?: number;
    rule_name?: string;
    code?: string;
  };
  Relationships: [];
}
