const crypto = require("crypto");
const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const prisma = require("../prismaClient");
const { decryptJSON } = require("./crypto");

const BULK_BATCH_SIZE = 20;
const BATCH_DELAY_MS = 1500;

const DRIVE_LINK =
  "https://drive.google.com/file/d/1Ub73iPyrnTLPUwytr4GQV311u-7emDjd/view?usp=sharing";

let cachedProvider = null;
let providerInstance = null;

// Calculates AWS SES SMTP password from an IAM Secret Access Key using official AWS SigV4
function calculateSesSmtpPassword(secretAccessKey, region = "us-east-1") {
  if (!secretAccessKey) return "";
  const cleanKey = String(secretAccessKey).trim();
  const cleanRegion = String(region || "us-east-1").trim().toLowerCase();

  // If already an AWS SES SMTP password (44-char base64 starting with B or A), use as is
  if (cleanKey.length === 44 && (cleanKey.startsWith("B") || cleanKey.startsWith("A"))) {
    return cleanKey;
  }

  const DATE = "11111111";
  const SERVICE = "ses";
  const MESSAGE = "SendRawEmail";
  const TERMINAL = "aws4_request";
  const VERSION = 0x04;

  const sign = (key, msg) =>
    crypto.createHmac("sha256", key).update(msg, "utf8").digest();

  try {
    const kDate = sign(Buffer.from("AWS4" + cleanKey, "utf8"), DATE);
    const kRegion = sign(kDate, cleanRegion);
    const kService = sign(kRegion, SERVICE);
    const kTerminal = sign(kService, TERMINAL);
    const signature = sign(kTerminal, MESSAGE);

    const signatureAndVersion = Buffer.concat([
      Buffer.from([VERSION]),
      signature,
    ]);
    return signatureAndVersion.toString("base64");
  } catch (e) {
    return cleanKey;
  }
}

function calculateSesSmtpPasswordV2(secretAccessKey) {
  if (!secretAccessKey) return "";
  try {
    const cleanKey = String(secretAccessKey).trim();
    const MESSAGE = "SendRawEmail";
    const VERSION = 0x02;
    const signature = crypto
      .createHmac("sha256", cleanKey)
      .update(MESSAGE)
      .digest();
    return Buffer.concat([Buffer.from([VERSION]), signature]).toString("base64");
  } catch (e) {
    return secretAccessKey;
  }
}

function createSesTransport(accessKey, password, region = "us-east-1") {
  const cleanRegion = String(region || "us-east-1").trim().toLowerCase();
  return nodemailer.createTransport({
    host: `email-smtp.${cleanRegion}.amazonaws.com`,
    port: 465,
    secure: true,
    auth: {
      user: String(accessKey).trim(),
      pass: String(password).trim(),
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });
}

const getProvider = async () => {
  const provider = await prisma.emailProvider.findFirst({
    where: { isActive: true },
  });

  if (!provider) {
    throw new Error("No active email provider configured.");
  }

  if (cachedProvider && cachedProvider.id === provider.id && cachedProvider.updatedAt.getTime() === provider.updatedAt.getTime()) {
    return { provider: cachedProvider, instance: providerInstance };
  }

  const credentials = decryptJSON(provider.credentials);
  let instance = null;

  if (provider.name === "RESEND") {
    instance = new Resend(credentials.apiKey?.trim());
  } else if (provider.name === "GOOGLE") {
    instance = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: provider.senderEmail?.trim(),
        clientId: credentials.clientId?.trim(),
        clientSecret: credentials.clientSecret?.trim(),
        refreshToken: credentials.refreshToken?.trim(),
      },
    });
  } else if (provider.name === "AWS_SES") {
    const accessKey = credentials.accessKey?.trim();
    const rawSecret = credentials.secretKey?.trim();
    const region = (credentials.region?.trim() || "us-east-1").toLowerCase();

    // Support both raw 40-char IAM Secret Key (SigV4) and generated 44-char SES SMTP Password
    const smtpPassword = calculateSesSmtpPassword(rawSecret, region);
    instance = createSesTransport(accessKey, smtpPassword, region);
  } else if (provider.name === "SMTP") {
    instance = nodemailer.createTransport({
      host: credentials.host?.trim(),
      port: Number(credentials.port),
      secure: Number(credentials.port) === 465,
      auth: {
        user: credentials.username?.trim(),
        pass: credentials.password?.trim(),
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
    });
  }

  cachedProvider = provider;
  providerInstance = instance;

  return { provider, instance };
};

const sendQrEmail = async (attendee, event, qrCodeDataUrl, customMessage = "", template = null, trackingId = null) => {
  try {
    if (!attendee.email) {
      console.log(`[SKIP_EMAIL] ${attendee.roll} has no email`);
      return { success: false, email: attendee.email };
    }

    const { provider, instance } = await getProvider();

    // 1. Generate high-resolution, high-contrast QR PNG buffer optimized for fast camera scans
    const qrBuffer = await QRCode.toBuffer(attendee.qrLink, {
      type: "png",
      margin: 3,
      width: 380,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    const qrBase64 = `data:image/png;base64,${qrBuffer.toString("base64")}`;

    const messageHtml = customMessage ? `
      <div style="background:#EEF2FF; padding:18px; border-radius:14px; margin-bottom:24px; border-left:5px solid #4F46E5; color:#3730A3; font-size:15px; line-height:1.7; white-space:pre-wrap; word-break:break-word;">
        ${customMessage}
      </div>
    ` : "";

    // Server base URL for tracking pixel
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";
    const trackingPixel = trackingId ? `<img src="${BACKEND_URL}/api/campaigns/track/${trackingId}" width="1" height="1" style="display:none;" />` : "";

    // Dedicated, prominent QR Pass Block that is guaranteed to appear in all pass emails
    const qrPassBlock = `
      <div style="max-width: 460px; margin: 28px auto; background: #FFFFFF; border-radius: 16px; border: 2px dashed #94A3B8; padding: 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="font-size: 11px; font-weight: 800; color: #0D1038; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
          OFFICIAL EVENT ENTRY PASS
        </div>
        <div style="font-size: 13px; color: #475569; margin-bottom: 14px;">
          Pass Holder: <strong style="color: #0F172A;">${attendee.name || "Student"}</strong> | Roll: <strong style="color: #0F172A;">${attendee.roll || ""}</strong>
        </div>
        <div style="display: inline-block; padding: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <img src="cid:entry-pass-qr" alt="Entry Pass QR" width="220" height="220" style="display: block; margin: 0 auto; width: 220px; height: 220px; border-radius: 8px;" />
        </div>
        <div style="margin-top: 12px;">
          <span style="display: inline-block; padding: 4px 14px; background: #DCFCE7; color: #166534; font-size: 10px; font-weight: 800; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
            ● VERIFIED ENTRY TICKET
          </span>
        </div>
        <div style="margin-top: 16px;">
          <a href="${attendee.qrLink}" style="display: inline-block; background: #A31D24; color: #FFFFFF; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 700;">
            View Online Digital Pass →
          </a>
        </div>
      </div>
    `;

    let htmlContent = "";

    if (template) {
      htmlContent = template.htmlBody
        .replace(/{{name}}/g, attendee.name || "")
        .replace(/{{roll}}/g, attendee.roll || "")
        .replace(/{{event_name}}/g, event?.name || "")
        .replace(/{{event_type}}/g, event?.type || "")
        .replace(/{{event_date}}/g, event?.date ? new Date(event.date).toLocaleDateString() : "")
        .replace(/{{event_venue}}/g, event?.venue || "")
        .replace(/{{qr_code}}/g, `<img src="cid:entry-pass-qr" alt="Entry Pass QR" width="220" height="220" style="display:block; margin:0 auto; width:220px; height:220px; border-radius:8px;" />`)
        .replace(/cid:qrcode/g, "cid:entry-pass-qr")
        .replace(/{{qr_link}}/g, attendee.qrLink || "");

      // If template did NOT include a QR code placeholder, inject the official QR pass block!
      if (!htmlContent.includes("cid:entry-pass-qr")) {
        if (htmlContent.includes("</body>")) {
          htmlContent = htmlContent.replace("</body>", `${qrPassBlock}</body>`);
        } else {
          htmlContent += qrPassBlock;
        }
      }
      htmlContent += trackingPixel;
    } else {
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 24px; max-width: 520px; margin: 0 auto;">
          <div style="border-bottom: 2px solid #A31D24; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #A31D24; margin: 0; font-size: 18px;">Graphic Era (Deemed to be University)</h2>
            <p style="color: #64748B; font-size: 12px; margin: 4px 0 0;">Official Event Entry & Gate Pass Management</p>
          </div>
          ${messageHtml || `<h3 style="color: #0D1038; margin: 0 0 16px; font-size: 16px;">Here is your Entry Pass for <strong>${event?.name || "the Event"}</strong></h3>`}
          ${qrPassBlock}
          <p style="font-size: 12px; color: #94A3B8; margin-top: 24px;">Please present this pass at the gate. Designed & Developed by Department Of Computer Science and Engineering.</p>
        </div>
        ${trackingPixel}
      `;
    }

    if (!htmlContent.toLowerCase().includes("<html")) {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#F8FAFC;">
  ${htmlContent}
</body>
</html>`;
    }

    // Convert any inline base64 images (e.g. uploaded posters) into CID attachments
    // because Gmail and webmail clients block raw data:image/... URIs
    const extraAttachments = [];
    const base64ImgRegex = /src=["'](data:(image\/[a-zA-Z+]+);base64,([A-Za-z0-9+/=]+))["']/gi;
    let imgIndex = 1;
    htmlContent = htmlContent.replace(base64ImgRegex, (fullMatch, dataUri, mimeType, base64Data) => {
      const cid = `embedded-img-${imgIndex++}`;
      try {
        const buf = Buffer.from(base64Data, "base64");
        const ext = mimeType.split("/")[1] || "png";
        extraAttachments.push({
          filename: `image-${imgIndex}.${ext}`,
          content: buf,
          cid: cid,
          contentType: mimeType,
          contentDisposition: "inline",
        });
        return `src="cid:${cid}"`;
      } catch (err) {
        console.error("Failed to parse embedded image data URI:", err);
        return fullMatch;
      }
    });

    let response;

    if (provider.name === "RESEND") {
      // For Resend API, replace cid with data URI for native rendering
      let resendHtml = htmlContent.replace(/cid:entry-pass-qr/g, qrBase64);
      extraAttachments.forEach((att) => {
        resendHtml = resendHtml.replace(
          new RegExp(`cid:${att.cid}`, "g"),
          `data:${att.contentType};base64,${att.content.toString("base64")}`
        );
      });

      const res = await instance.emails.send({
        from: provider.senderEmail,
        to: attendee.email,
        subject: template ? template.subject : `Official Entry Pass: ${event?.name || "Event"} - Graphic Era`,
        html: resendHtml,
        attachments: [
          {
            filename: "entry-pass-qr.png",
            content: qrBuffer.toString("base64"),
          },
          ...extraAttachments.map((att) => ({
            filename: att.filename,
            content: att.content.toString("base64"),
          })),
        ],
      });

      if (res.error) {
        throw new Error(res.error.message || JSON.stringify(res.error));
      }
      response = res.data;
    } else {
      // For Nodemailer (AWS SES, SMTP, Google), attach via CID inline attachment
      response = await instance.sendMail({
        from: provider.senderEmail,
        to: attendee.email,
        subject: template ? template.subject : `Official Entry Pass: ${event?.name || "Event"} - Graphic Era`,
        html: htmlContent,
        attachments: [
          {
            filename: "entry-pass-qr.png",
            content: qrBuffer,
            cid: "entry-pass-qr",
            contentType: "image/png",
            contentDisposition: "inline",
          },
          ...extraAttachments,
        ],
      });
    }

    console.log(`[EMAIL_SENT] ${attendee.email}`);

    return {
      success: true,
      email: attendee.email,
      response,
    };
  } catch (error) {
    console.error(`[EMAIL_FAILED] ${attendee.email}`, error.message);

    return {
      success: false,
      email: attendee.email,
      error: error.message,
    };
  }
};

const sendBulkQrEmails = async (
  attendees,
  qrGeneratorFunction,
  customMessage = "",
) => {
  const results = [];

  console.log(`Starting bulk email sending to ${attendees.length} attendees`);

  for (let i = 0; i < attendees.length; i += BULK_BATCH_SIZE) {
    const batch = attendees.slice(i, i + BULK_BATCH_SIZE);

    console.log(`Processing batch ${Math.floor(i / BULK_BATCH_SIZE) + 1}`);

    const batchResults = await Promise.all(
      batch.map(async (attendee) => {
        try {
          const qrCodeDataUrl = await qrGeneratorFunction(attendee);
          return await sendQrEmail(attendee, qrCodeDataUrl, customMessage);
        } catch (err) {
          console.error(
            `[QR_GENERATION_FAILED] ${attendee.email}`,
            err.message,
          );

          return {
            success: false,
            email: attendee.email,
            error: err.message,
          };
        }
      }),
    );

    results.push(...batchResults);

    if (i + BULK_BATCH_SIZE < attendees.length) {
      console.log(`Waiting ${BATCH_DELAY_MS}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(`
========================================
BULK EMAIL COMPLETED
========================================
`);

  return results;
};

module.exports = {
  sendQrEmail,
  sendBulkQrEmails,
  getProvider,
  calculateSesSmtpPassword,
  calculateSesSmtpPasswordV2,
  createSesTransport
};