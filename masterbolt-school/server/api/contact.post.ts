export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method not allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      throw createError({
        statusCode: 400,
        message: 'All fields are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid email address'
      })
    }

    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const fromEmail = process.env.FROM_EMAIL || smtpUser
    const toEmail = 'contact@masterbolt.school'

    // If SMTP is not configured, return a success response but log the message
    // This allows the form to work in development without SMTP setup
    if (!smtpUser || !smtpPassword) {
      console.log('Contact form submission (SMTP not configured):', {
        name,
        email,
        message,
        to: toEmail
      })
      
      return {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      }
    }

    // Send email using nodemailer
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    })

    const mailOptions = {
      from: `"${name}" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    }

    await transporter.sendMail(mailOptions)

    return {
      success: true,
      message: 'Thank you for your message! We will get back to you soon.'
    }
  } catch (error: any) {
    console.error('Contact form error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to send message. Please try again later.'
    })
  }
})

