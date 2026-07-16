import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Afghanistan Online Cargo <support@afghancargo.online>'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email skipped — no RESEND_API_KEY] To: ${to} | Subject: ${subject}`)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[Email error]', err)
    // Non-blocking — email failure should never crash the app
  }
}

export const emailTemplates = {
  accountApproved: (nickname: string) => ({
    subject: 'Your Afghanistan Online Cargo account has been approved!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Welcome, ${nickname}! 🎉</h2>
        <p style="color: #64748B;">Your account has been reviewed and approved. You can now post trips and packages, connect with other verified users, and use all platform features.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" 
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Sign In Now
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  accountRejected: (nickname: string, reason: string) => ({
    subject: 'Update on your Afghanistan Online Cargo registration',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${nickname},</h2>
        <p style="color: #64748B;">Unfortunately, your registration could not be approved at this time.</p>
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #E0524B; margin: 0;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p style="color: #64748B;">If you believe this is an error or would like to reapply with updated documents, please contact us.</p>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  newMessage: (recipientNickname: string, senderNickname: string, preview: string) => ({
    subject: `New message from ${senderNickname} on Afghanistan Online Cargo`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${recipientNickname},</h2>
        <p style="color: #64748B;">You have a new message from <strong>${senderNickname}</strong>:</p>
        <div style="background: #F8F9FB; border-left: 4px solid #2DB7C4; border-radius: 4px; padding: 16px; margin: 16px 0;">
          <p style="color: #1E2A5E; margin: 0;">"${preview.slice(0, 200)}${preview.length > 200 ? '...' : ''}"</p>
        </div>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?tab=messages"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Message
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  deliveryProposed: (travelerNickname: string, packageTitle: string, senderNickname: string) => ({
    subject: `New delivery request on Afghanistan Online Cargo`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${travelerNickname},</h2>
        <p style="color: #64748B;"><strong>${senderNickname}</strong> has sent you a delivery request for:</p>
        <div style="background: #F8F9FB; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #1E2A5E; font-weight: bold; margin: 0;">📦 ${packageTitle}</p>
        </div>
        <p style="color: #64748B;">Log in to review the request and accept or decline it.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?tab=deliveries"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Delivery Request
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  deliveryAccepted: (senderNickname: string, packageTitle: string, travelerNickname: string, estimatedDate: string) => ({
    subject: `Your delivery request was accepted — Afghanistan Online Cargo`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${senderNickname},</h2>
        <p style="color: #64748B;">Great news! <strong>${travelerNickname}</strong> has accepted your delivery request for <strong>${packageTitle}</strong>.</p>
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #15803D; margin: 0;">✅ Estimated delivery date: <strong>${estimatedDate}</strong></p>
        </div>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?tab=deliveries"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Delivery
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  registrationReceived: (nickname: string) => ({
    subject: 'We received your Afghanistan Online Cargo registration',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${nickname},</h2>
        <p style="color: #64748B;">Thanks for registering! Your documents have been submitted and are now awaiting review by our admin team.</p>
        <div style="background: #F8F9FB; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #1E2A5E; margin: 0;">⏳ Approval typically takes 1-2 business days. You'll receive an email as soon as a decision is made.</p>
        </div>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  // Phase 1 signups (quick register + Google) haven't submitted any KYC
  // documents yet — unlike registrationReceived, this must prompt them to
  // complete their profile rather than claim documents are under review.
  completeProfileReminder: (nickname: string) => ({
    subject: 'Welcome! One more step to get approved — Afghanistan Online Cargo',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Welcome, ${nickname}! 🎉</h2>
        <p style="color: #64748B;">Your account has been created. Before you can post trips or packages, complete your profile with your identity documents so an admin can review and approve your account.</p>
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #92400E; margin: 0;">⏳ Approval typically takes 1-2 business days once your profile is submitted.</p>
        </div>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile/complete"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Complete My Profile
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  tripPosted: (nickname: string, originCity: string, destCity: string, departureDate: string) => ({
    subject: 'Your trip has been posted — Afghanistan Online Cargo',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${nickname},</h2>
        <p style="color: #64748B;">Your trip has been posted successfully:</p>
        <div style="background: #F8F9FB; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #1E2A5E; font-weight: bold; margin: 0;">✈️ ${originCity} → ${destCity}</p>
          <p style="color: #64748B; margin: 4px 0 0;">Departing ${departureDate}</p>
        </div>
        <p style="color: #64748B;">Senders can now find you and contact you about carrying their packages.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/trips"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Your Trip
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  packagePosted: (nickname: string, packageTitle: string, destCity: string) => ({
    subject: 'Your package has been posted — Afghanistan Online Cargo',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${nickname},</h2>
        <p style="color: #64748B;">Your package has been posted successfully:</p>
        <div style="background: #F8F9FB; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #1E2A5E; font-weight: bold; margin: 0;">📦 ${packageTitle}</p>
          <p style="color: #64748B; margin: 4px 0 0;">Destination: ${destCity}</p>
        </div>
        <p style="color: #64748B;">Travelers heading your way can now find and contact you.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/packages"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Your Package
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  reviewReceived: (travelerNickname: string, reviewerNickname: string, rating: number, packageTitle: string) => ({
    subject: `You received a ${rating}-star review — Afghanistan Online Cargo`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${travelerNickname},</h2>
        <p style="color: #64748B;"><strong>${reviewerNickname}</strong> left you a ${'⭐'.repeat(rating)} review for delivering <strong>${packageTitle}</strong>.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Your Profile
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),

  deliveryFinalized: (senderNickname: string, packageTitle: string, travelerNickname: string) => ({
    subject: `Your package has been delivered — Afghanistan Online Cargo`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1E2A5E; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F2A60D; margin: 0; font-size: 20px;">Afghanistan Online Cargo</h1>
        </div>
        <h2 style="color: #1E2A5E;">Hi ${senderNickname},</h2>
        <p style="color: #64748B;"><strong>${travelerNickname}</strong> has confirmed that your package <strong>${packageTitle}</strong> has been delivered to the recipient.</p>
        <p style="color: #64748B;">You can now leave a review for ${travelerNickname} to help other users on the platform.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?tab=deliveries"
           style="display: inline-block; background: #F2A60D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Leave a Review
        </a>
        <p style="color: #64748B; font-size: 12px; margin-top: 32px;">
          Afghanistan Online Cargo — Cross-border package coordination platform
        </p>
      </div>
    `,
  }),
}