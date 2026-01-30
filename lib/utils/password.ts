import { PasswordCharacterSet, PasswordPolicyNumber } from '@/constants/password';

function generateRandomCharacter(characters: string): string {
  const index = Math.floor(Math.random() * characters.length);
  return characters[index] ?? characters[0] ?? '';
}

export function generateStrongPassword(): string {
  const requiredCharacters: string[] = [];

  for (let index = 0; index < PasswordPolicyNumber.MIN_UPPERCASE; index += 1) {
    requiredCharacters.push(generateRandomCharacter(PasswordCharacterSet.UPPERCASE));
  }

  for (let index = 0; index < PasswordPolicyNumber.MIN_LOWERCASE; index += 1) {
    requiredCharacters.push(generateRandomCharacter(PasswordCharacterSet.LOWERCASE));
  }

  for (let index = 0; index < PasswordPolicyNumber.MIN_DIGITS; index += 1) {
    requiredCharacters.push(generateRandomCharacter(PasswordCharacterSet.DIGITS));
  }

  for (let index = 0; index < PasswordPolicyNumber.MIN_SYMBOLS; index += 1) {
    requiredCharacters.push(generateRandomCharacter(PasswordCharacterSet.SYMBOLS));
  }

  const allCharacters = `${PasswordCharacterSet.UPPERCASE}${PasswordCharacterSet.LOWERCASE}${PasswordCharacterSet.DIGITS}${PasswordCharacterSet.SYMBOLS}`;

  while (requiredCharacters.length < PasswordPolicyNumber.MIN_LENGTH) {
    requiredCharacters.push(generateRandomCharacter(allCharacters));
  }

  for (let index = requiredCharacters.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryValue = requiredCharacters[index];
    requiredCharacters[index] = requiredCharacters[randomIndex];
    requiredCharacters[randomIndex] = temporaryValue;
  }

  return requiredCharacters.join('');
}

