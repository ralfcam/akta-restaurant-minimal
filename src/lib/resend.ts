import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendBookingConfirmationEmail(booking: any) {
  if (!resend) {
    console.warn("RESEND_API_KEY non configurée. Simulation de l'envoi d'email de confirmation à", booking.client_email);
    return;
  }

  try {
    const recipient = booking.client_email;

    await resend.emails.send({
      from: 'Réservation Äkta <onboarding@resend.dev>',
      to: recipient,
      subject: `[TEST SANDBOX] Votre réservation chez Äkta le ${booking.booking_date} à ${booking.booking_time}`,
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
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
  }
}

export async function sendPendingManualApprovalEmail(booking: any) {
  if (!resend) {
    console.warn("RESEND_API_KEY non configurée. Simulation de l'envoi d'email d'attente à", booking.client_email);
    return;
  }

  try {
    const recipient = booking.client_email;

    await resend.emails.send({
      from: 'Réservation Äkta <onboarding@resend.dev>',
      to: recipient,
      subject: `[TEST SANDBOX] Demande de réservation reçue - Äkta le ${booking.booking_date}`,
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
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email d'attente:", error);
  }
}

export async function sendBookingRejectionEmail(booking: any) {
  if (!resend) {
    console.warn("RESEND_API_KEY non configurée. Simulation de l'envoi d'email de rejet à", booking.client_email);
    return;
  }

  try {
    const recipient = booking.client_email;

    await resend.emails.send({
      from: 'Réservation Äkta <onboarding@resend.dev>',
      to: recipient,
      subject: `[TEST SANDBOX] Concernant votre réservation chez Äkta le ${booking.booking_date}`,
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
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet:", error);
  }
}

export async function sendAdminNotificationEmail(booking: any) {
  if (!resend) {
    console.warn("RESEND_API_KEY non configurée. Simulation de l'envoi d'email admin pour", booking.client_name);
    return;
  }

  try {
    const actionRequired = booking.status === 'pending';
    const title = actionRequired ? 'Demande de Réservation en Attente' : 'Nouvelle Réservation Confirmée';
    const subject = actionRequired 
      ? `[TEST SANDBOX] À APPROUVER : ${booking.client_name} - ${booking.guests}p - ${booking.booking_date}`
      : `[TEST SANDBOX] CONFIRMÉE : ${booking.client_name} - ${booking.guests}p - ${booking.booking_date}`;

    await resend.emails.send({
      from: 'Réservation Äkta <onboarding@resend.dev>',
      to: 'edtroeder@gmail.com', // Forcé sur l'email vérifié en sandbox
      subject,
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
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email admin:", error);
  }
}
