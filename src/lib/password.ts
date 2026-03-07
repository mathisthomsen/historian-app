export type PasswordStrength = 0 | 1 | 2 | 3 | 4 | 5;

export function checkPasswordStrength(password: string): {
  score: PasswordStrength;
  label: "weak" | "fair" | "good" | "strong" | "veryStrong";
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["weak", "weak", "fair", "good", "strong", "veryStrong"] as const;
  // score is 0-5 which is always a valid index; non-null assertion is safe
   
  return { score: score as PasswordStrength, label: labels[score]! };
}
