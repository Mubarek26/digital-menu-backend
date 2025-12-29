exports.adminTemplate = (name, email, message) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background:#f4f6fa; padding:40px 20px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.08); overflow:hidden;">
      <div style="background:#4299e1; padding:40px 30px; text-align:center;">
        <h2 style="color:#ffffff; margin:0; font-size:28px; font-weight:600; letter-spacing:-0.5px;">📩 New Contact Message</h2>
      </div>
      <div style="padding:40px 30px;">
        <table style="width:100%; border-collapse:separate; border-spacing:0 20px;">
          <tr>
            <td style="font-weight:600; color:#4a5568; width:100px; vertical-align:top; font-size:16px;">Name:</td>
            <td style="font-size:16px; color:#2d3748;">${name}</td>
          </tr>
          <tr>
            <td style="font-weight:600; color:#4a5568; vertical-align:top; font-size:16px;">Email:</td>
            <td style="font-size:16px; color:#2d3748;">${email}</td>
          </tr>
          <tr>
            <td style="font-weight:600; color:#4a5568; vertical-align:top; font-size:16px;">Message:</td>
            <td>
              <div style="background:#edf2f7; padding:20px; border-radius:10px; border-left:5px solid #4299e1; font-size:16px; line-height:1.6; white-space:pre-wrap; word-break:break-word; color:#2d3748;">
                ${message}
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
`;

