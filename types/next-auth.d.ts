import { Role } from '@prisma/client';
import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      personalEmail?: string | null;
      institutionalEmail?: string | null;
      signatureUrl?: string | null;
      teacherCode?: string | null;
      studentCode?: string | null;
      phone?: string | null;
      document?: string | null;
      isActive: boolean;
      mustChangePassword: boolean;
    } & DefaultSession['user'];
    accessToken?: string;
  }

  interface User {
    id: string;
    name: string | null;
    role: Role;
    personalEmail?: string | null;
    institutionalEmail?: string | null;
    signatureUrl?: string | null;
    teacherCode?: string | null;
    studentCode?: string | null;
    phone?: string | null;
    document?: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    personalEmail?: string | null;
    institutionalEmail?: string | null;
    signatureUrl?: string | null;
    teacherCode?: string | null;
    studentCode?: string | null;
    phone?: string | null;
    document?: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
    accessToken?: string;
  }
}
