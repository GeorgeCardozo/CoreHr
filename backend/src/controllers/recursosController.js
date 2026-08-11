const MAX_MESSAGE_LENGTH = 500;

const getGuidance = (message) => {
  const normalized = message.toLocaleLowerCase('es-CO');
  if (/(certific|constancia)/.test(normalized)) {
    return 'Puedes descargar tu certificación laboral desde Mi perfil. El documento no incluye datos salariales para preservar la confidencialidad definida por CoreRRHH.';
  }
  if (/(vacacion|permiso|ausent|incapacidad|licencia)/.test(normalized)) {
    return 'Registra una solicitud con sus fechas, motivo y, si corresponde, el soporte documental. Gestión Humana revisará el estado desde la bandeja de solicitudes.';
  }
  if (/(salario|contrato|nómina|nomina)/.test(normalized)) {
    return 'Los datos salariales y contractuales son de consulta exclusiva para el rol administrador. Para una inquietud laboral, comunícate con Gestión Humana por el canal institucional.';
  }
  return 'CoreRRHH centraliza perfiles, solicitudes y certificaciones laborales. Para consultas legales, de nómina o casos particulares, contacta directamente a Gestión Humana.';
};

const procesarChatRecursos = async (req, res) => {
  const message = String(req.body?.mensaje || '').trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ message: `La consulta debe tener entre 1 y ${MAX_MESSAGE_LENGTH} caracteres.` });
  }

  // No se envían consultas de empleados a proveedores externos: el alcance es
  // on-premise y la información puede contener datos personales sensibles.
  return res.status(200).json({
    respuesta: getGuidance(message),
    fuente: 'Guía operativa interna de CoreRRHH',
  });
};

module.exports = { procesarChatRecursos };
