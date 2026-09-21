const prisma = require("../prismaClient");
const { getProvider } = require("../utils/email");

exports.sendOtp = async (req, res) => {
  try {
    const { roll, type = "entry" } = req.body;
    if (!roll || !roll.trim()) {
      return res.status(400).json({ error: "Roll number is required." });
    }

    const cleanRoll = roll.trim().toUpperCase();

    // Role-based validation
    if (req.user.role === "ENTRY_VOLUNTEER" && type !== "entry") {
      return res.status(403).json({ error: "Entry volunteers can only perform entry OTP sending." });
    }
    if (req.user.role === "FOOD_VOLUNTEER" && type !== "food") {
      return res.status(403).json({ error: "Food volunteers can only perform food OTP sending." });
    }

    // Lookup attendee safely (case-insensitive, prioritizing active dataset)
    let attendee = await prisma.attendee.findFirst({
      where: {
        roll: { equals: cleanRoll, mode: "insensitive" },
        dataset: { isActive: true },
      },
      include: { event: true, dataset: true },
    });

    if (!attendee) {
      attendee = await prisma.attendee.findFirst({
        where: {
          roll: { equals: cleanRoll, mode: "insensitive" },
        },
        orderBy: { id: "desc" },
        include: { event: true, dataset: true },
      });
    }

    if (!attendee) {
      return res.status(404).json({ error: `No attendee found with roll number "${cleanRoll}".` });
    }

    if (type === "entry" && attendee.entryStatus) {
      return res.status(400).json({ error: `Attendee ${attendee.name} has already checked in for entry.` });
    }

    if (type === "food") {
      if (!attendee.entryStatus) {
        return res.status(400).json({ error: `Gate entry required before food distribution for ${attendee.name}.` });
      }
      if (attendee.foodStatus) {
        return res.status(400).json({ error: `Food pass already claimed by ${attendee.name}.` });
      }
    }

    if (!attendee.email || !attendee.email.trim()) {
      return res.status(400).json({
        error: `Attendee ${attendee.name} (${attendee.roll}) does not have a registered email address.`,
      });
    }

    const now = new Date();
    const scanTypeEnum = type === "food" ? "FOOD" : "ENTRY";

    // Cooldown check: 20 seconds between requests
    const recentOtp = await prisma.otpLog.findFirst({
      where: { attendeeId: attendee.id, otpType: scanTypeEnum },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp) {
      const timeDiff = now.getTime() - recentOtp.createdAt.getTime();
      if (timeDiff < 20000) {
        const waitSec = Math.ceil((20000 - timeDiff) / 1000);
        return res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting another OTP.` });
      }

      if (recentOtp.attempts >= 5) {
        return res.status(403).json({ error: "Maximum OTP attempts exceeded for this attendee." });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes expiry

    // Invalidate previous unused OTPs and save the new code
    await prisma.$transaction([
      prisma.otpLog.updateMany({
        where: {
          attendeeId: attendee.id,
          otpType: scanTypeEnum,
          used: false,
        },
        data: {
          used: true,
        },
      }),
      prisma.otpLog.create({
        data: {
          attendeeId: attendee.id,
          otpCode: code,
          otpType: scanTypeEnum,
          attempts: recentOtp ? recentOtp.attempts : 0,
          expiresAt: expiry,
        },
      }),
    ]);

    // Send OTP email using the active email provider
    let emailSent = false;
    let providerErr = null;

    try {
      const { provider, instance } = await getProvider();
      const subjectText = type === "food"
        ? `Food Distribution OTP: ${code} - Graphic Era University`
        : `Event Gate Entry OTP: ${code} - Graphic Era University`;

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #0D1038; letter-spacing: 1.5px; text-transform: uppercase;">
              Graphic Era (Deemed to be University)
            </div>
            <h2 style="color: #0D1038; margin: 8px 0 4px; font-size: 20px;">Gate Entry Verification Code</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Attendee: <strong>${attendee.name}</strong> (Roll: <strong>${attendee.roll}</strong>)</p>
          </div>

          <div style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              Your 6-Digit ${type === "food" ? "Food Distribution" : "Gate Entry"} OTP
            </div>
            <div style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #1E2A78; font-family: monospace;">
              ${code}
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">
              ⏱ Valid for 10 minutes. Single-use verification only.
            </div>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0; line-height: 1.5;">
            Please share this 6-digit OTP with the event volunteer at the checkpoint to confirm your admission.
          </p>
        </div>
      `;

      if (provider.name === "RESEND") {
        const resData = await instance.emails.send({
          from: provider.senderEmail,
          to: attendee.email,
          subject: subjectText,
          html: htmlBody,
        });
        if (resData.error) {
          throw new Error(resData.error.message || JSON.stringify(resData.error));
        }
      } else {
        // AWS SES, SMTP, GOOGLE
        await instance.sendMail({
          from: provider.senderEmail,
          to: attendee.email,
          subject: subjectText,
          text: `Your Graphic Era verification code is: ${code}. Valid for 10 minutes.`,
          html: htmlBody,
        });
      }
      emailSent = true;
    } catch (err) {
      console.error("[OTP_EMAIL_FAILED]", err);
      providerErr = err.message;
    }

    if (!emailSent) {
      return res.status(500).json({
        error: `Failed to send OTP to ${attendee.email}: ${providerErr || "No active email provider configured."}`,
      });
    }

    const maskedEmail = attendee.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    return res.status(200).json({
      message: `Verification OTP dispatched to ${maskedEmail}`,
      maskedEmail,
      name: attendee.name,
      roll: attendee.roll,
    });
  } catch (err) {
    console.error("sendOtp error:", err);
    res.status(500).json({ error: err.message || "Server error while generating OTP." });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { roll, otp, type = "entry", checkpointId } = req.body;
    if (!roll || !otp) {
      return res.status(400).json({ error: "Roll number and OTP are required." });
    }

    const cleanRoll = roll.trim().toUpperCase();
    const cleanOtp = String(otp).trim();

    // Role-based validation
    if (req.user.role === "ENTRY_VOLUNTEER" && type !== "entry") {
      return res.status(403).json({ error: "Entry volunteers can only verify entry OTPs." });
    }
    if (req.user.role === "FOOD_VOLUNTEER" && type !== "food") {
      return res.status(403).json({ error: "Food volunteers can only verify food OTPs." });
    }

    const scanTypeEnum = type === "food" ? "FOOD" : "ENTRY";

    const result = await prisma.$transaction(async (tx) => {
      let attendee = await tx.attendee.findFirst({
        where: {
          roll: { equals: cleanRoll, mode: "insensitive" },
          dataset: { isActive: true },
        },
        include: { event: { include: { checkpoints: { orderBy: { order: "asc" } } } } },
      });

      if (!attendee) {
        attendee = await tx.attendee.findFirst({
          where: {
            roll: { equals: cleanRoll, mode: "insensitive" },
          },
          orderBy: { id: "desc" },
          include: { event: { include: { checkpoints: { orderBy: { order: "asc" } } } } },
        });
      }

      if (!attendee) {
        return { status: 404, payload: { error: `Attendee with roll "${cleanRoll}" not found.` } };
      }

      // Checkpoint verification if checkpointId provided
      let checkpointName = "Main Gate";
      if (checkpointId && attendee.event) {
        const cp = attendee.event.checkpoints?.find((c) => c.id === parseInt(checkpointId));
        if (cp) {
          checkpointName = cp.name;
          const existingStatus = await tx.checkpointStatus.findUnique({
            where: { attendeeId_checkpointId: { attendeeId: attendee.id, checkpointId: cp.id } },
          });

          if (existingStatus && existingStatus.status) {
            return { status: 400, payload: { error: `${attendee.name} has already been admitted at ${cp.name}.` } };
          }

          if (attendee.event.isSequential) {
            const currentIndex = attendee.event.checkpoints.findIndex((c) => c.id === cp.id);
            if (currentIndex > 0) {
              const previousCp = attendee.event.checkpoints[currentIndex - 1];
              const prevStatus = await tx.checkpointStatus.findUnique({
                where: { attendeeId_checkpointId: { attendeeId: attendee.id, checkpointId: previousCp.id } },
              });
              if (!prevStatus || !prevStatus.status) {
                return { status: 400, payload: { error: `Out of sequence: Please scan at ${previousCp.name} first.` } };
              }
            }
          }
        }
      }

      if (type === "entry" && !checkpointId && attendee.entryStatus) {
        return { status: 400, payload: { error: `${attendee.name} has already checked in.` } };
      }

      if (type === "food") {
        if (!attendee.entryStatus) {
          return { status: 400, payload: { error: `Gate entry required before food distribution for ${attendee.name}.` } };
        }
        if (attendee.foodStatus) {
          return { status: 400, payload: { error: `Food pass already claimed by ${attendee.name}.` } };
        }
      }

      const otpLog = await tx.otpLog.findFirst({
        where: { attendeeId: attendee.id, otpType: scanTypeEnum, used: false },
        orderBy: { createdAt: "desc" },
      });

      if (!otpLog) {
        return { status: 400, payload: { error: "No active OTP found. Please tap 'Send Verification OTP' first." } };
      }

      if (otpLog.attempts >= 5) {
        return { status: 403, payload: { error: "Maximum verification attempts exceeded. Please request a new OTP." } };
      }

      if (new Date() > otpLog.expiresAt) {
        return { status: 400, payload: { error: "OTP has expired. Please request a new OTP." } };
      }

      if (otpLog.otpCode !== cleanOtp) {
        await tx.otpLog.update({
          where: { id: otpLog.id },
          data: { attempts: otpLog.attempts + 1 },
        });
        return { status: 400, payload: { error: "Invalid 6-digit OTP code. Please check and re-enter." } };
      }

      // Mark OTP as used
      await tx.otpLog.update({
        where: { id: otpLog.id },
        data: { used: true, verifiedAt: new Date() },
      });

      // Update checkpoint status if checkpointId was supplied
      if (checkpointId && attendee.event) {
        const cp = attendee.event.checkpoints?.find((c) => c.id === parseInt(checkpointId));
        if (cp) {
          await tx.checkpointStatus.upsert({
            where: { attendeeId_checkpointId: { attendeeId: attendee.id, checkpointId: cp.id } },
            update: { status: true, scannedAt: new Date(), scannedById: req.user?.id },
            create: { attendeeId: attendee.id, checkpointId: cp.id, status: true, scannedAt: new Date(), scannedById: req.user?.id },
          });
        }
      }

      // Mark entry / food status on attendee
      if (type === "entry") {
        await tx.attendee.update({
          where: { id: attendee.id },
          data: { entryStatus: true, entryOtpUsed: true, entryScannedAt: new Date() },
        });
      } else if (type === "food") {
        await tx.attendee.update({
          where: { id: attendee.id },
          data: { foodStatus: true, foodOtpUsed: true, foodScannedAt: new Date() },
        });
      }

      // Record ScanLog
      await tx.scanLog.create({
        data: {
          attendeeId: attendee.id,
          scannedById: req.user?.id || null,
          checkpointId: checkpointId ? parseInt(checkpointId) : null,
          scanType: scanTypeEnum,
          result: "SUCCESS",
          reason: "ALLOWED_OTP",
          ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });

      return {
        status: 200,
        payload: {
          status: "ALLOWED",
          message: `Successfully verified and admitted ${attendee.name} at ${checkpointName}!`,
          name: attendee.name,
          roll: attendee.roll,
          token: attendee.token,
          admitted: true,
        },
      };
    });

    return res.status(result.status).json(result.payload);
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ error: err.message || "Server error during OTP verification." });
  }
};
