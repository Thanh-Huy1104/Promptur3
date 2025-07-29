// For now, we'll use simple DTOs without validation decorators
// to avoid TypeScript/ESLint issues. Validation can be added later.

export class CreateUserDto {
  name: string;
  email: string;
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  darkMode?: boolean;
  preferences?: Record<string, any>;
}

export class UpdateUserDto {
  name?: string;
  email?: string;
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  darkMode?: boolean;
  preferences?: Record<string, any>;
}
