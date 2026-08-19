import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

const SENDER_EMAIL = process.env.EMAIL_FROM || 'Réservation Äkta <onboarding@resend.dev>';
const SANDBOX_FALLBACK_EMAIL = 'edtroeder@gmail.com';

async function sendWithSandboxFallback(options: {
  to: string;
  subject: string;
  html: string;
  logLabel: string;
}) {
  if (!resend) {
    console.warn(`RESEND_API_KEY non configurée. Simulation de l'envoi [${options.logLabel}] à ${options.to}`);
    return;
  }

  try {
    const res = await resend.emails.send({
      from: SENDER_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (res.error) {
      console.warn(`Resend email error [${options.logLabel}]:`, res.error);

      // If in Resend Sandbox mode (403 restricted to account owner email), fallback to SANDBOX_FALLBACK_EMAIL
      if (res.error.statusCode === 403 || res.error.name === 'validation_error') {
        console.info(`Sandbox Resend détectée. Redirection de l'email vers ${SANDBOX_FALLBACK_EMAIL}`);
        
        const sandboxHtml = `
          <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-family: sans-serif; font-size: 13px;">
            ⚠️ <strong>Mode Sandbox Resend :</strong> Cet email était destiné à <u>${options.to}</u>.<br>
            Pour envoyer des emails à des clients externes, ajoutez et vérifiez votre nom de domaine sur <a href="https://resend.com/domains" target="_blank" style="color: #856404; font-weight: bold;">resend.com/domains</a>.
          </div>
          ${options.html}
        `;

        await resend.emails.send({
          from: SENDER_EMAIL,
          to: SANDBOX_FALLBACK_EMAIL,
          subject: `[SANDBOX - Pour ${options.to}] ${options.subject}`,
          html: sandboxHtml,
        });
      }
    }
  } catch (err) {
    console.error(`Erreur inattendue lors de l'envoi de l'email [${options.logLabel}]:`, err);
  }
}

export async function sendBookingConfirmationEmail(booking: any) {
  await sendWithSandboxFallback({
    to: booking.client_email,
    subject: `Votre réservation chez Äkta le ${booking.booking_date} à ${booking.booking_time}`,
    logLabel: 'Confirmation Client',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #01382f;">Bonjour ${booking.client_name},</h2>
        <p>Nous sommes ravis de confirmer votre réservation chez <strong>Äkta</strong>.</p>
        <div style="background-color: #f5edd6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date :</strong> ${booking.booking_date}</p>
          <p><strong>Heure :</strong> ${booking.booking_time}</p>
          <p><strong>Personnes :</strong> ${booking.guests}</p>
          ${booking.notes ? `<p><strong>Note :</strong> ${booking.notes}</p>` : ''}
        </div>
        <p>En cas d'empêchement, merci de nous prévenir par téléphone.</p>
        <p>Au plaisir de vous recevoir,</p>
        <p><strong>L'équipe Äkta</strong><br>Bd de la Cluse 20, 1205 Genève</p>
      </div>
    `,
  });
}

export async function sendPendingManualApprovalEmail(booking: any) {
  await sendWithSandboxFallback({
    to: booking.client_email,
    subject: `Demande de réservation reçue - Äkta le ${booking.booking_date}`,
    logLabel: 'Attente Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #01382f;">Bonjour ${booking.client_name},</h2>
        <p>Nous avons bien reçu votre demande de réservation chez <strong>Äkta</strong>.</p>
        <p>Notre équipe va vérifier la disponibilité pour les grands groupes et vous confirmera la réservation dans les plus brefs délais.</p>
        <div style="background-color: #f5edd6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date :</strong> ${booking.booking_date}</p>
          <p><strong>Heure :</strong> ${booking.booking_time}</p>
          <p><strong>Personnes :</strong> ${booking.guests}</p>
        </div>
        <p>Merci pour votre patience,</p>
        <p><strong>L'équipe Äkta</strong></p>
      </div>
    `,
  });
}

export async function sendBookingRejectionEmail(booking: any) {
  await sendWithSandboxFallback({
    to: booking.client_email,
    subject: `Concernant votre réservation chez Äkta le ${booking.booking_date}`,
    logLabel: 'Refus Réservation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #01382f;">Bonjour ${booking.client_name},</h2>
        <p>Malheureusement, nous ne sommes pas en mesure de confirmer votre réservation pour le <strong>${booking.booking_date} à ${booking.booking_time}</strong>.</p>
        <p>Nous sommes complets pour cette date ou n'avons plus de table adaptée à la taille de votre groupe.</p>
        <p>N'hésitez pas à nous contacter par téléphone ou à essayer une autre date.</p>
        <p>Au plaisir de vous recevoir prochainement,</p>
        <p><strong>L'équipe Äkta</strong></p>
      </div>
    `,
  });
}

export async function sendAdminNotificationEmail(booking: any) {
  const actionRequired = booking.status === 'pending';
  const title = actionRequired ? 'Demande de Réservation en Attente' : 'Nouvelle Réservation Confirmée';
  const subject = actionRequired 
    ? `À APPROUVER : ${booking.client_name} - ${booking.guests}p - ${booking.booking_date}`
    : `CONFIRMÉE : ${booking.client_name} - ${booking.guests}p - ${booking.booking_date}`;

  await sendWithSandboxFallback({
    to: SANDBOX_FALLBACK_EMAIL,
    subject,
    logLabel: 'Notification Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #01382f;">${title}</h2>
        ${actionRequired ? "<p>Une nouvelle demande de réservation nécessite votre approbation depuis l'espace d'administration.</p>" : "<p>Une nouvelle réservation automatique a été confirmée.</p>"}
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Client :</strong> ${booking.client_name}</p>
          <p><strong>Contact :</strong> ${booking.client_phone} / ${booking.client_email}</p>
          <p><strong>Date :</strong> ${booking.booking_date}</p>
          <p><strong>Heure :</strong> ${booking.booking_time}</p>
          <p><strong>Personnes :</strong> ${booking.guests}</p>
          <p><strong>Table Assignée :</strong> ${booking.assigned_table_label || 'Aucune / À définir'}</p>
          ${booking.notes ? `<p><strong>Note :</strong> ${booking.notes}</p>` : ''}
        </div>
      </div>
    `,
  });
}
