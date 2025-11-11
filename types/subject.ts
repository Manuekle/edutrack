export interface Student {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  correoPersonal: string | null;
  document?: string | null;
  telefono?: string | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}
