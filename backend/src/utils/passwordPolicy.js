const MIN_PASSWORD_LENGTH = 12;

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return {
      valid: false,
      message: 'La contraseña debe incluir al menos una mayúscula, una minúscula y un número.',
    };
  }

  return { valid: true };
};

module.exports = { MIN_PASSWORD_LENGTH, validatePassword };
