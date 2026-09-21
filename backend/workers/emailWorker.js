const prisma = require("../prismaClient");
const { getProvider, sendQrEmail } = require("../utils/email");
const QRCode = require("qrcode");

let isRunning = false;
let workerTimer = null;

const WORKER_INTERVAL_MS = 2000;

// Provider specific cooldown delay (respects user-configured delayMs with safety bounds)
const getProviderDelay = (provider, batchSize, requestedDelay) => {
  const parsed = Number(requestedDelay);
  if (!isNaN(parsed) && parsed >= 500) {
    return parsed;
  }
  // Safe provider defaults if unconfigured
  if (provider?.name === "GOOGLE") return 3000;
  if (provider?.name === "AWS_SES") return 1000;
  if (provider?.name === "RESEND") return 2000;
  return 2000;
};

const processQueue = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    // Promote SCHEDULED campaigns if their time has arrived OR if scheduledAt is null OR if created over 1 minute ago
    await prisma.emailCampaign.updateMany({
      where: {
        status: "SCHEDULED",
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } },
          { createdAt: { lte: new Date(Date.now() - 60000) } }
        ]
      },
      data: { status: "RUNNING" }
    });

    const activeCampaign = await prisma.emailCampaign.findFirst({
      where: { status: "RUNNING" },
      include: { event: true, template: true }
    });

    if (!activeCampaign) {
      isRunning = false;
      return;
    }

    console.log(`[WORKER] Running campaign: "${activeCampaign.name}" (ID: ${activeCampaign.id}, Pending: ${activeCampaign.pendingCount})`);

    // Find up to batchSize jobs
    const jobs = await prisma.emailJob.findMany({
      where: {
        campaignId: activeCampaign.id,
        status: { in: ["PENDING", "FAILED"] },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } }
        ]
      },
      take: activeCampaign.batchSize,
      include: { attendee: true }
    });

    if (jobs.length === 0) {
      // Check if all jobs are done
      const pendingCount = await prisma.emailJob.count({
        where: { campaignId: activeCampaign.id, status: { in: ["PENDING", "FAILED", "PROCESSING"] } }
      });
      if (pendingCount === 0) {
        await prisma.emailCampaign.update({
          where: { id: activeCampaign.id },
          data: { status: "COMPLETED", pendingCount: 0 }
        });
      }
      isRunning = false;
      return;
    }

    // Mark as PROCESSING
    await prisma.emailJob.updateMany({
      where: { id: { in: jobs.map(j => j.id) } },
      data: { status: "PROCESSING" }
    });

    let successCount = 0;
    let failCount = 0;

    for (const job of jobs) {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(job.attendee.qrLink, {
          margin: 3,
          width: 380,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        const result = await sendQrEmail(job.attendee, activeCampaign.event, qrCodeDataUrl, "", activeCampaign.template, job.trackingId);
        
        if (result.success) {
          await prisma.emailJob.update({
            where: { id: job.id },
            data: { status: "SENT", deliveredAt: new Date() }
          });
          successCount++;
        } else {
          throw new Error(result.error || "Unknown Error");
        }
      } catch (err) {
        const isPermanent = err.message.includes("Invalid Address") || job.retries >= job.maxRetries;
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: isPermanent ? "PERM_FAILED" : "FAILED",
            errorMessage: err.message,
            retries: { increment: 1 },
            nextRetryAt: isPermanent ? null : new Date(Date.now() + 60000) // Retry in 1 min
          }
        });
        failCount++;
      }
    }

    // Calculate absolute stats for perfect accuracy
    const sentCount = await prisma.emailJob.count({ where: { campaignId: activeCampaign.id, status: "SENT" } });
    const failedCount = await prisma.emailJob.count({ where: { campaignId: activeCampaign.id, status: { in: ["FAILED", "PERM_FAILED"] } } });
    const pendingCount = await prisma.emailJob.count({ where: { campaignId: activeCampaign.id, status: { in: ["PENDING", "PROCESSING"] } } });

    // Update Campaign Stats
    await prisma.emailCampaign.update({
      where: { id: activeCampaign.id },
      data: {
        sentCount,
        failedCount,
        pendingCount
      }
    });

    // Handle Delay
    try {
      const { provider } = await getProvider();
      const delay = getProviderDelay(provider, jobs.length, activeCampaign.delayMs);
      await new Promise(res => setTimeout(res, delay));
    } catch(e) {
      // If no provider active, default delay
      await new Promise(res => setTimeout(res, activeCampaign.delayMs));
    }

  } catch (error) {
    console.error("Worker error:", error);
  } finally {
    isRunning = false;
  }
};

const startWorker = () => {
  if (!workerTimer) {
    console.log("Starting Email Queue Worker...");
    workerTimer = setInterval(processQueue, WORKER_INTERVAL_MS);
  }
};

const stopWorker = () => {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
    console.log("Stopped Email Queue Worker.");
  }
};

module.exports = {
  startWorker,
  stopWorker
};
