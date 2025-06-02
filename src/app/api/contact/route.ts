import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Send email to support
    const { data, error } = await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: ['support@resume-roaster.xyz'],
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This message was sent from the Resume Roaster contact form.</p>
            <p>Reply directly to this email to respond to ${name} at ${email}</p>
          </div>
        </div>
      `,
      replyTo: email,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Send confirmation email to user
    try {
      await resend.emails.send({
        from: 'Resume Roaster <onboarding@resend.dev>',
        to: [email],
        subject: 'Thank you for contacting Resume Roaster',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #f97316; margin: 0;">🔥 Resume Roaster</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Thank you for reaching out!</h2>
              
              <p>Hi ${name},</p>
              
              <p>We've received your message about "<strong>${subject}</strong>" and we'll get back to you within 24 hours.</p>
              
              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-style: italic;">Your message:</p>
                <p style="margin: 10px 0 0 0;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <p>In the meantime, feel free to:</p>
              <ul style="color: #666;">
                <li>Check out our <a href="https://resume-roaster.xyz/help" style="color: #f97316;">Help Center</a> for quick answers</li>
                <li>Try our <a href="https://resume-roaster.xyz" style="color: #f97316;">Resume Analyzer</a> for instant feedback</li>
                <li>Follow us for resume tips and career advice</li>
              </ul>
              
              <p>Best regards,<br>
              The Resume Roaster Team</p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #666; font-size: 12px;">
              <p>Resume Roaster - Making resumes that get noticed</p>
              <p>600 California St, San Francisco, CA 94108</p>
            </div>
          </div>
        `,
      })
    } catch (confirmationError) {
      console.warn('Failed to send confirmation email:', confirmationError)
      // Don't fail the main request if confirmation email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: data?.id
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
} 