export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = { name: 120, email: 200, subject: 160, message: 4000 } as const;

export function validateContact(raw: Partial<Record<keyof ContactInput, unknown>>): {
  data: ContactInput;
  errors: FieldErrors;
} {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const data: ContactInput = {
    name: s(raw.name),
    email: s(raw.email),
    subject: s(raw.subject),
    message: s(raw.message),
  };
  const errors: FieldErrors = {};
  if (data.name.length < 2) errors.name = "Please enter your name.";
  else if (data.name.length > LIMITS.name) errors.name = "Name is too long.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Please enter a valid email address.";
  else if (data.email.length > LIMITS.email) errors.email = "Email is too long.";
  if (data.subject.length < 2) errors.subject = "Please add a subject.";
  else if (data.subject.length > LIMITS.subject) errors.subject = "Subject is too long.";
  if (data.message.length < 10) errors.message = "Please write a message of at least 10 characters.";
  else if (data.message.length > LIMITS.message) errors.message = "Message is too long.";
  return { data, errors };
}
