exports.adminTemplate = (name, email, message) => `
<div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:10px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#FF6F3C; color:#ffffff; text-align:center; padding:12px 0;">
      <h2 style="margin:0; font-size:18px;">New Contact Message</h2>
    </div>

    <!-- Body -->
    <div style="padding:15px; color:#333; line-height:1.4; font-size:14px;">
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b></p>
      <div style="background:#FFF2EC; padding:10px; border-radius:4px;">${message}</div>
    </div>

    <!-- Footer -->
    <div style="background:#f1f3f6; text-align:center; padding:8px; font-size:12px; color:#777;">
      &copy; ${new Date().getFullYear()} Saro Food Delivery
    </div>

  </div>
</div>
`;
