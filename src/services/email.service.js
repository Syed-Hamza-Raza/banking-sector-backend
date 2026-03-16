const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Bank Transaction" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Email error:", error);
        throw error;
    }
};

const sendRegisterEmail = async (email, userName) => {
    const subject = "Welcome to Our Platform 🚀";

    const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f9; font-family:Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          
          <table width="600" cellpadding="0" cellspacing="0" 
            style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
            
            <tr>
              <td align="center" style="background:#4f46e5; padding:30px;">
                <h1 style="color:#ffffff; margin:0;">🚀 Bank Transact</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 30px;">
                <h2 style="margin-top:0; color:#333;">Hi ${userName},</h2>
                
                <h3 style="color:#4f46e5;">Welcome Onboard!</h3>

                <p style="color:#555; line-height:1.6; font-size:15px;">
                  Thank you for joining our platform. We're excited to have you with us.
                  Click the button below to get started.
                </p>

                <p style="color:#888; font-size:13px;">
                  If you didn’t create this account, please ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background:#f9fafb; padding:20px; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} Your Company. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;

    await sendEmail(email, subject, "Welcome to our platform", htmlTemplate);
};

const sendTransactionEmail = async ({
    email,
    userName,
    amount,
    type,
    balance,
    transactionId,
}) => {

    const isCredit = type === "CREDIT";

    const subject = `Transaction Alert: ${type} of Rs ${amount}`;

    const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="margin:0; padding:0; background:#f4f6f9; font-family:Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          
          <table width="600" cellpadding="0" cellspacing="0" 
          style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="background:${isCredit ? "#16a34a" : "#dc2626"}; padding:25px;">
                <h2 style="color:#ffffff; margin:0;">
                  ${isCredit ? "💰 Amount Credited" : "💸 Amount Debited"}
                </h2>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;">
                <p style="font-size:16px;">Hi <strong>${userName}</strong>,</p>

                <p style="font-size:15px; color:#555;">
                  A transaction has been processed on your account.
                </p>

                <div style="background:#f9fafb; padding:20px; border-radius:8px; margin:20px 0;">
                  
                  <p><strong>Transaction ID:</strong> ${transactionId}</p>
                  <p><strong>Type:</strong> ${type}</p>
                  <p><strong>Amount:</strong> Rs ${amount}</p>
                  <p><strong>Available Balance:</strong> Rs ${balance}</p>
                  
                </div>

                <p style="font-size:14px; color:#777;">
                  If you did not authorize this transaction, please contact support immediately.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background:#f1f5f9; padding:15px; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} Your Bank. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;

    await sendEmail(email, subject, `Transaction ${type} of Rs ${amount}`, htmlTemplate);
};

module.exports = { sendRegisterEmail, sendTransactionEmail };