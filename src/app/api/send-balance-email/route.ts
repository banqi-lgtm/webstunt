import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const { email, nombre, saldoAmount, motivo, eventId } = await req.json();

    if (!email || !nombre) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Dynamic configuration based on eventId
    let eventName = 'Copa Stunt F2R';
    if (eventId === 'festival') {
      eventName = 'Festival Stunt Bike';
    } else if (eventId === 'nitrox') {
      eventName = 'Copa Stunt Nitrox';
    }

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Saldo Pendiente - ${eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #0d0d0d; color: #ffffff;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #000000; padding: 30px; border-bottom: 2px solid #FF5E00;">
                  <h1 style="color: #FF5E00; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">${eventName}</h1>
                  <p style="color: #888; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">AVISO DE PAGO INCOMPLETO</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">¡Hola, ${nombre}! ⚠️</h2>
                  <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
                    Hemos revisado tu comprobante de pago, pero hemos detectado que <strong>tienes un saldo pendiente</strong>.
                  </p>
                  
                  <div style="background-color: #262626; border-left: 4px solid #FF5E00; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #FF5E00; margin-top: 0; font-size: 18px; text-transform: uppercase;">Detalles del Saldo:</h3>
                    <ul style="color: #cccccc; font-size: 15px; line-height: 1.6; padding-left: 20px;">
                      <li style="margin-bottom: 10px;">Monto Faltante: <strong style="color: #ffffff;">$${saldoAmount}</strong></li>
                      <li style="margin-bottom: 10px;">Motivo: <strong>${motivo}</strong></li>
                    </ul>
                    <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin-top: 15px;">
                      Para asegurar tu cupo, por favor ingresa a <a href="https://paskinesstunt.com" target="_blank" style="color: #FF5E00; text-decoration: underline; font-weight: bold;">paskinesstunt.com</a>, transfiere el monto faltante y anexa tu nuevo comprobante de saldo.
                    </p>
                  </div>

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

    console.log(`[Email Balance] Attempting to send email to: ${email}, Name: ${nombre}, Event: ${eventName}, EventId: ${eventId}`);
    const info = await transporter.sendMail({
      from: `"${eventName}" <copastuntfrnitrox@gmail.com>`,
      to: email,
      subject: `⚠️ Tienes un Saldo Pendiente - ${eventName}`,
      html: htmlTemplate,
    });
    console.log(`[Email Balance] Email sent successfully. MessageId: ${info.messageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error interno del servidor al enviar correo' }, { status: 500 });
  }
}
