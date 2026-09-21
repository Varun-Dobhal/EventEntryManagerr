const prisma = require("../prismaClient");
const { encryptJSON, decryptJSON } = require("../utils/crypto");
const { getProvider } = require("../utils/email");

exports.getProviders = async (req, res) => {
  try {
    const providers = await prisma.emailProvider.findMany({
      orderBy: { id: "asc" },
    });
    
    // Mask credentials before sending to UI
    const maskedProviders = providers.map(p => {
      let fields = {};
      try {
        const creds = decryptJSON(p.credentials);
        Object.keys(creds).forEach(k => {
          fields[k] = creds[k] ? "********" : "";
        });
      } catch (e) {
         fields = { error: "Failed to decrypt" };
      }
      return {
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        senderEmail: p.senderEmail,
        updatedAt: p.updatedAt,
        fields
      };
    });
    
    res.json(maskedProviders);
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Failed to fetch providers." });
  }
};

exports.saveProvider = async (req, res) => {
  try {
    const { name, senderEmail, credentials } = req.body;
    
    if (!name || !senderEmail || !credentials) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const encryptedStr = encryptJSON(credentials);

    await prisma.$transaction(async (tx) => {
      // Find current active to log
      const currentActive = await tx.emailProvider.findFirst({
        where: { isActive: true }
      });
      
      // Deactivate all
      await tx.emailProvider.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Insert or Update the target provider
      const existing = await tx.emailProvider.findFirst({
        where: { name }
      });

      if (existing) {
        await tx.emailProvider.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            senderEmail,
            credentials: encryptedStr
          }
        });
      } else {
        await tx.emailProvider.create({
          data: {
            name,
            isActive: true,
            senderEmail,
            credentials: encryptedStr
          }
        });
      }

      // Log the change
      const prevName = currentActive ? currentActive.name : "None";
      await tx.auditLog.create({
        data: {
          adminId: req.user?.id || null,
          action: "CHANGED_EMAIL_PROVIDER",
          details: `From ${prevName} to ${name}`
        }
      });
    });

    res.json({ message: "Provider saved successfully." });
  } catch (error) {
    console.error("Error saving provider:", error);
    res.status(500).json({ error: "Failed to save provider." });
  }
};

exports.testConnection = async (req, res) => {
  try {
    const { provider, instance } = await getProvider();
    
    // Attempt to send test email to specified recipient, or to the verified sender email itself
    const toEmail = req.body?.recipient?.trim() || provider.senderEmail || req.user?.email;

    if (!toEmail) {
      return res.status(400).json({ error: "No recipient email address specified." });
    }
    
    if (provider.name === "RESEND") {
      const resData = await instance.emails.send({
        from: provider.senderEmail,
        to: toEmail,
        subject: "Graphic Era Event Entry Manager - Test Connection",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #0D1038; max-width: 500px; border: 1px solid #E2E8F0; border-radius: 12px;">
            <h2 style="color: #A31D24; margin-top: 0;">Graphic Era (Deemed to be University)</h2>
            <p style="font-size: 15px; font-weight: bold; color: #16A34A;">✔ Email Delivery Connection Verified!</p>
            <p style="font-size: 13px; color: #334155; line-height: 1.5;">This email confirms that your <strong>Resend</strong> provider credentials are operational and ready for pass dispatch.</p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
            <p style="font-size: 11px; color: #94A3B8; margin: 0;">Sender: ${provider.senderEmail} | Recipient: ${toEmail}</p>
          </div>
        `,
      });
      if (resData.error) {
        throw new Error(resData.error.message || JSON.stringify(resData.error));
      }
      return res.json({ message: `Connection successful! Test email delivered to ${toEmail}.` });
    }

    // For Nodemailer transports (AWS_SES, SMTP, GOOGLE)
    // 1. Verify SMTP connection authentication
    if (instance && typeof instance.verify === "function") {
      try {
        await instance.verify();
      } catch (verifyErr) {
        console.error("SMTP verify error:", verifyErr);
        let errorMsg = verifyErr.message || "SMTP Verification Failed";
        if (errorMsg.includes("535") || errorMsg.includes("Authentication Credentials Invalid")) {
          errorMsg = "AWS SES Authentication Failed (535): Invalid credentials. Please verify your Access Key ID and Secret Access Key / SES SMTP password.";
        }
        return res.status(400).json({ error: errorMsg });
      }
    }

    // 2. Dispatch minimal test email
    try {
      await instance.sendMail({
        from: provider.senderEmail,
        to: toEmail,
        subject: "Graphic Era Event Entry Manager - Test Connection",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #0D1038; max-width: 500px; border: 1px solid #E2E8F0; border-radius: 12px;">
            <h2 style="color: #A31D24; margin-top: 0;">Graphic Era (Deemed to be University)</h2>
            <p style="font-size: 15px; font-weight: bold; color: #16A34A;">✔ Email Delivery Connection Verified!</p>
            <p style="font-size: 13px; color: #334155; line-height: 1.5;">This email confirms that your <strong>${provider.name}</strong> delivery configuration is operational and connected.</p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
            <p style="font-size: 11px; color: #94A3B8; margin: 0;">Sender: ${provider.senderEmail} | Recipient: ${toEmail}</p>
          </div>
        `,
      });
      return res.json({ message: `Connection successful! Test email delivered to ${toEmail}.` });
    } catch (sendErr) {
      console.error("sendMail test error:", sendErr);
      let sendMsg = sendErr.message || "Failed to send test email";
      if (sendMsg.includes("Email address is not verified") || sendMsg.includes("554")) {
        return res.status(400).json({ 
          error: `AWS SES Sandbox: Recipient "${toEmail}" is not verified in AWS SES. In sandbox mode, you can only send to verified emails or domains (e.g. ${provider.senderEmail}). To send to anyone, request production access in AWS SES Console.`
        });
      }
      return res.status(400).json({ error: sendMsg });
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    res.status(500).json({ error: error.message || "Connection failed." });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { name: true } }
      },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs." });
  }
};
