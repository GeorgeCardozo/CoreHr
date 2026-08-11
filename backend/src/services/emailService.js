const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('[EmailService] EMAIL_USER o EMAIL_PASS no configurados. Los correos no se enviarán.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

const enviarCredenciales = async (correoDestino, nombre, contrasenaDefault) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[EmailService] No se pudo enviar correo a ' + correoDestino + ' (transporter no configurado).');
    return { enviado: false, razon: 'Email no configurado' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const fromName = process.env.EMAIL_FROM_NAME || 'CoreRRHH';
  const fromAddress = process.env.EMAIL_USER;

  const htmlContent = [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:0;background:#f4f4f5;font-family:\'Segoe UI\',Arial,sans-serif;">',
    '  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">',
    '    <div style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:32px 24px;text-align:center;">',
    '      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Bienvenido(a) a CoreRRHH</h1>',
    '      <p style="color:#ccfbf1;margin:8px 0 0;font-size:14px;">Tu cuenta ha sido creada exitosamente</p>',
    '    </div>',
    '    <div style="padding:32px 24px;">',
    '      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Hola <strong>' + nombre + '</strong>,</p>',
    '      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Se ha creado tu cuenta en el portal de Recursos Humanos. A continuaci\u00f3n encontrar\u00e1s tus credenciales de acceso:</p>',
    '      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:20px;margin:0 0 20px;">',
    '        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;"><strong>Correo:</strong></p>',
    '        <p style="margin:0 0 16px;font-size:15px;color:#0f766e;font-weight:600;">' + correoDestino + '</p>',
    '        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;"><strong>Contrase\u00f1a temporal:</strong></p>',
    '        <p style="margin:0;font-size:15px;color:#0f766e;font-weight:600;font-family:monospace;">' + contrasenaDefault + '</p>',
    '      </div>',
    '      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:12px;padding:16px;margin:0 0 24px;">',
    '        <p style="margin:0;font-size:13px;color:#92400e;">\u26a0\ufe0f <strong>Importante:</strong> Al iniciar sesi\u00f3n por primera vez, se te pedir\u00e1 cambiar esta contrase\u00f1a por una personal y segura.</p>',
    '      </div>',
    '      <div style="text-align:center;">',
    '        <a href="' + frontendUrl + '" style="display:inline-block;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Iniciar Sesi\u00f3n</a>',
    '      </div>',
    '    </div>',
    '    <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">',
    '      <p style="margin:0;font-size:11px;color:#9ca3af;">Este es un correo autom\u00e1tico generado por CoreRRHH. No responder a este mensaje.</p>',
    '    </div>',
    '  </div>',
    '</body>',
    '</html>'
  ].join('\n');

  try {
    await transporter.sendMail({
      from: '"' + fromName + '" <' + fromAddress + '>',
      to: correoDestino,
      subject: 'Bienvenido(a) a CoreRRHH - Tus credenciales de acceso',
      html: htmlContent,
    });
    console.log('[EmailService] Correo de credenciales enviado a ' + correoDestino);
    return { enviado: true };
  } catch (error) {
    console.error('[EmailService] Error al enviar correo a ' + correoDestino + ':', error.message);
    return { enviado: false, razon: error.message };
  }
};

module.exports = { enviarCredenciales };
