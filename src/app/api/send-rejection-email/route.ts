import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure the transport using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const { email, nombre, estadoPago, eventId } = await req.json();

    if (!email || !nombre) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Dynamic configuration based on eventId
    let eventName = 'Copa Stunt F2R';
    let subject = `⚠️ Atención requerida con tu registro - ${eventName}`;
    let emailTitle = `¡Hola, ${nombre}! ⚠️`;
    
    const isSaldo = estadoPago === 'rechazado_saldo';
    
    const problemText = isSaldo 
      ? 'Hubo un problema verificando tu <strong>comprobante de saldo pendiente</strong>.'
      : 'Hubo un problema verificando tu <strong>comprobante de pago inicial</strong>.';

    let emailBody = `
      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
        Te escribimos de parte de la organización porque <strong>tu registro ha sido marcado como RECHAZADO</strong> temporalmente.
      </p>
      <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
        ${problemText} Esto puede deberse a que la imagen está borrosa, el monto no coincide, o el comprobante no es válido.
      </p>
    `;

    let instructionBlock = `
      <div style="background-color: #262626; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <h3 style="color: #ef4444; margin-top: 0; font-size: 18px; text-transform: uppercase;">¿Qué debes hacer ahora?</h3>
        <ul style="color: #cccccc; font-size: 15px; line-height: 1.6; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Ingresa inmediatamente a la plataforma: <a href="https://paskinesstunt.com" target="_blank" style="color: #ef4444; text-decoration: underline; font-weight: bold;">paskinesstunt.com</a></li>
          <li style="margin-bottom: 10px;">Inicia sesión con tu correo electrónico y contraseña.</li>
          <li style="margin-bottom: 10px;">Revisa la nota exacta del motivo del rechazo en tu panel de control.</li>
          <li style="margin-bottom: 10px;">Sube un comprobante nuevo, claro y válido para poder reservar tu cupo de nuevo.</li>
        </ul>
      </div>
    `;

    let footerReminder = `
      <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
        Ten en cuenta que <strong>tu cupo no está asegurado</strong> hasta que este problema sea solucionado y tu pago sea aprobado por un juez.
      </p>
    `;

    if (eventId === 'festival') {
      eventName = 'Festival Stunt Bike';
      subject = `Resultado de tu postulación - Campeonato Nacional de Stunt Bike`;
      emailTitle = `¡Hola, ${nombre}! 👋`;
      emailBody = `
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 18px;">
          Gracias por inscribirte al <strong>Campeonato Nacional de Stunt Bike</strong>. Después de revisar todas las postulaciones, en esta ocasión no has sido seleccionado para participar.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
          Agradecemos tu interés y el tiempo que dedicaste al proceso. Esperamos verte en la próxima edición del campeonato. ¡Muchos éxitos y gracias por hacer parte de esta comunidad!
        </p>
      `;
      instructionBlock = '';
      footerReminder = '';
    } else if (eventId === 'nitrox') {
      eventName = 'Copa Stunt Nitrox';
      subject = `⚠️ Atención requerida con tu registro - ${eventName}`;
    }

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resultado de Postulación - ${eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #0d0d0d; color: #ffffff;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #000000; padding: 30px; border-bottom: 2px solid #ef4444;">
                  <h1 style="color: #ef4444; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">${eventName}</h1>
                  <p style="color: #888; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">AVISO DE REGISTRO</p>
                </td>
              </tr>
 
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">${emailTitle}</h2>
                  ${emailBody}
  
                  ${instructionBlock}
 
                  ${footerReminder}
                </td>
              </tr>
 
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #0a0a0a; padding: 20px; border-top: 1px solid #333;">
                  <p style="color: #666666; font-size: 12px; margin: 0;">
                    Este es un mensaje automático generado por ${eventName}.<br>
                    Por favor no respondas a este correo.
                  </p>
                </td>
              </tr>
 
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // Send mail
    console.log(`[Email Rejection] Attempting to send email to: ${email}, Name: ${nombre}, Event: ${eventName}, EventId: ${eventId}`);
    const info = await transporter.sendMail({
      from: `"${eventName}" <copastuntfrnitrox@gmail.com>`,
      to: email,
      subject: subject,
      html: htmlTemplate,
    });
    console.log(`[Email Rejection] Email sent successfully. MessageId: ${info.messageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error interno del servidor al enviar correo' }, { status: 500 });
  }
}
