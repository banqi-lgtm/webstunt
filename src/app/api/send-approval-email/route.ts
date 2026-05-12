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
    const { email, nombre, estadoPago } = await req.json();

    if (!email || !nombre) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Determine the text based on the payment status
    const isDiaEvento = estadoPago === 'pago_dia_evento';
    
    const statusText = isDiaEvento 
      ? 'Tu solicitud ha sido revisada y has sido <strong>APROBADO</strong> bajo la modalidad de <strong>Pago Día del Evento</strong>.'
      : 'Tu pago ha sido verificado y tu cupo está <strong>OFICIALMENTE CONFIRMADO</strong>.';

    const paymentReminder = isDiaEvento
      ? '<p style="color: #ffcc00; font-weight: bold; background-color: #333; padding: 10px; border-left: 4px solid #ffcc00;">⚠️ IMPORTANTE: Recuerda que debes realizar el pago en la entrada el día del evento para poder acceder a la pista.</p>'
      : '';

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación Copa Stunt F2R</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #0d0d0d; color: #ffffff;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #000000; padding: 30px; border-bottom: 2px solid #39FF14;">
                  <h1 style="color: #39FF14; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Copa Stunt F2R</h1>
                  <p style="color: #888; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">REPUESTOS NITROX</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">¡Hola, ${nombre}! 🏍️🔥</h2>
                  <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
                    Tenemos excelentes noticias. ${statusText}
                  </p>

                  ${paymentReminder}

                  <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #39FF14; margin-top: 0; font-size: 18px; text-transform: uppercase;">Pasos Finales:</h3>
                    <ul style="color: #cccccc; font-size: 15px; line-height: 1.6; padding-left: 20px;">
                      <li style="margin-bottom: 10px;">Lleva tu motocicleta lista y preparada.</li>
                      <li style="margin-bottom: 10px;">Asegúrate de llevar tu <strong>Documento de Identidad Original</strong> y todos los documentos de la moto (<strong>SOAT, TARJETA DE PROPIEDAD, PLACA</strong>).</li>
                      <li style="margin-bottom: 10px;">Si te falta cargar alguno de estos documentos, súbelo cuanto antes en la plataforma.</li>
                      <li style="margin-bottom: 10px;">Ingresa a <a href="https://paskinesstunt.com" target="_blank" style="color: #39FF14; text-decoration: none; font-weight: bold;">paskinesstunt.com</a>, verifica que todos tus documentos estén aprobados y <strong>asegúrate de tener tu Código QR de ingreso activo</strong>.</li>
                    </ul>
                  </div>

                  <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
                    ¡Prepárate para dar el mejor show en <span style="color: #39FF14; font-weight: bold; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Plaza Mayor Medellín</span>! Nos vemos en la pista.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #0a0a0a; padding: 20px; border-top: 1px solid #333;">
                  <p style="color: #666666; font-size: 12px; margin: 0;">
                    Este es un mensaje automático generado por Copa Stunt F2R.<br>
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
    await transporter.sendMail({
      from: '"Copa Stunt F2R" <copastuntfrnitrox@gmail.com>',
      to: email,
      subject: '¡Tu inscripción ha sido APROBADA! - Copa Stunt F2R',
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error interno del servidor al enviar correo' }, { status: 500 });
  }
}
