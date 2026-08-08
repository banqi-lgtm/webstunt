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
    let locationText = 'Plaza Mayor Medellín';
    let prepVehicleText = '<li style="margin-bottom: 10px;">Lleva tu motocicleta lista y preparada.</li>';
    let docsText = 'todos los documentos de la moto (<strong>SOAT, TARJETA DE PROPIEDAD, PLACA</strong>)';
    let docsReminder = '<li style="margin-bottom: 10px;">Si te falta cargar alguno de estos documentos, súbelo cuanto antes en la plataforma.</li>';
    let sponsorText = '<p style="color: #888; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">REPUESTOS NITROX</p>';
    
    // Determine the text based on the payment status
    const isDiaEvento = estadoPago === 'pago_dia_evento';
    
    let statusText = isDiaEvento 
      ? 'Tu solicitud ha sido revisada y has sido <strong>APROBADO</strong> bajo la modalidad de <strong>Pago Día del Evento</strong>.'
      : 'Tu cupo está <strong>OFICIALMENTE CONFIRMADO</strong>.';

    let paymentReminder = isDiaEvento
      ? '<p style="color: #ffcc00; font-weight: bold; background-color: #333; padding: 10px; border-left: 4px solid #ffcc00;">⚠️ IMPORTANTE: Recuerda que debes realizar el pago en la entrada el día del evento para poder acceder a la pista.</p>'
      : '';

    let subject = `¡Tu inscripción ha sido APROBADA! - ${eventName}`;
    let emailTitle = `¡Hola, ${nombre}! 🏍️🔥`;
    let emailBody = `<p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Tenemos excelentes noticias. ${statusText}</p>`;
    
    if (eventId === 'festival') {
      eventName = 'Festival Stunt Bike';
      locationText = 'Plaza Cívica Ciudad Victoria, en Pereira';
      subject = '🏆 ¡Felicitaciones! Has sido aprobado para el Campeonato Nacional de Stunt Bike';
      emailTitle = `¡Felicitaciones, ${nombre}! 🏆`;
      emailBody = `
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 18px;">
          Después de revisar tu información, confirmamos que <strong>has sido aprobado</strong> y eres apto para participar en el <strong>Campeonato Nacional de Stunt Bike</strong>.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
          Te esperamos el <strong>30 de agosto de 2026</strong> en la <strong>Plaza Cívica Ciudad Victoria, en Pereira</strong>, con la mejor energía para vivir una gran jornada y demostrar todo tu talento. ¡Nos vemos en la competencia!
        </p>
      `;
      prepVehicleText = '<li style="margin-bottom: 10px;">Lleva tu bicicleta lista y preparada.</li>';
      docsText = '';
      docsReminder = '<li style="margin-bottom: 10px;">Asegúrate de llevar tu <strong>Documento de Identidad Original</strong>.</li>';
      sponsorText = '';
      paymentReminder = '';
    } else if (eventId === 'nitrox') {
      eventName = 'Copa Stunt Nitrox';
      locationText = 'Pereira';
      prepVehicleText = '<li style="margin-bottom: 10px;">Lleva tu motocicleta lista y preparada.</li>';
      docsText = '';
      docsReminder = '<li style="margin-bottom: 10px;">Si te falta cargar tu identificación o foto de deportista, súbelos cuanto antes en la plataforma.</li>';
      subject = `¡Tu inscripción ha sido APROBADA! - ${eventName}`;
      emailTitle = `¡Hola, ${nombre}! 🏍️🔥`;
      emailBody = `<p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Tenemos excelentes noticias. ${statusText}</p>`;
    }

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación - ${eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #0d0d0d; color: #ffffff;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #000000; padding: 30px; border-bottom: 2px solid #10B981;">
                  <h1 style="color: #10B981; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">${eventName}</h1>
                  ${sponsorText}
                </td>
              </tr>
 
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">${emailTitle}</h2>
                  ${emailBody}
 
                  ${paymentReminder}

                  <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #10B981; margin-top: 0; font-size: 18px; text-transform: uppercase;">Pasos Finales:</h3>
                    <ul style="color: #cccccc; font-size: 15px; line-height: 1.6; padding-left: 20px;">
                      ${prepVehicleText}
                      ${docsText ? `<li style="margin-bottom: 10px;">Asegúrate de llevar tu <strong>Documento de Identidad Original</strong> y ${docsText}.</li>` : ''}
                      ${docsReminder}
                      <li style="margin-bottom: 10px;">Ingresa a <a href="https://paskinesstunt.com" target="_blank" style="color: #10B981; text-decoration: none; font-weight: bold;">paskinesstunt.com</a> y verifica que todos tus documentos estén aprobados.</li>
                    </ul>
                  </div>

                  <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
                    ¡Prepárate para dar el mejor show en <span style="color: #10B981; font-weight: bold; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">${locationText}</span>! Nos vemos en la pista.
                  </p>
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
    console.log(`[Email Approval] Attempting to send email to: ${email}, Name: ${nombre}, Event: ${eventName}, EventId: ${eventId}`);
    const info = await transporter.sendMail({
      from: `"${eventName}" <copastuntfrnitrox@gmail.com>`,
      to: email,
      subject: subject,
      html: htmlTemplate,
    });
    console.log(`[Email Approval] Email sent successfully. MessageId: ${info.messageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error interno del servidor al enviar correo' }, { status: 500 });
  }
}
