exports.adminTemplate = (name, email, message) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Message</title>
    <style type="text/css">
      body { margin: 0; padding: 0; background: #f7fafc; }
      .container { max-width: 600px; margin: 0 auto; }
      .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
      .content { padding: 40px; }
      .label { font-weight: 600; color: #4a5568; width: 100px; }
      .message-box { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
      @media only screen and (max-width: 600px) {
        .content { padding: 24px !important; }
        .label-cell { display: block; width: 100% !important; padding-bottom: 8px !important; }
        .value-cell { display: block; width: 100% !important; }
      }
    </style>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#f7fafc; margin:0; padding:20px 0;">
    <div class="container">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td class="card">
            <div class="content">
              <h1 style="margin:0 0 32px; font-size:24px; font-weight:600; color:#1a202c; letter-spacing:-0.5px;">
                New Contact Message
              </h1>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                <tr>
                  <td class="label label-cell" style="vertical-align:top; padding-bottom:16px; font-size:16px;">Name:</td>
                  <td class="value-cell" style="padding-bottom:16px; font-size:16px; color:#2d3748;">${name}</td>
                </tr>
                <tr>
                  <td class="label label-cell" style="vertical-align:top; padding-bottom:16px; font-size:16px;">Email:</td>
                  <td class="value-cell" style="padding-bottom:16px; font-size:16px; color:#2d3748;">${email}</td>
                </tr>
                <tr>
                  <td class="label label-cell" style="vertical-align:top; padding-bottom:8px; font-size:16px;">Message:</td>
                  <td class="value-cell">
                    <div class="message-box" style="font-size:16px; color:#2d3748;">
                      ${message}
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;