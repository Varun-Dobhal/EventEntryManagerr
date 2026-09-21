const prisma = require("../prismaClient");

exports.getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { checkpoints: { orderBy: { order: "asc" } } }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events." });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { checkpoints: { orderBy: { order: "asc" } } }
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event." });
  }
};

exports.getActiveEvent = async (req, res) => {
  try {
    const event = await prisma.event.findFirst({
      where: { isActive: true },
      include: { checkpoints: { orderBy: { order: "asc" } } }
    });
    if (!event) return res.status(404).json({ error: "No active event found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active event." });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { name, type, date, venue, bannerImage, description, entryTiming, exitTiming, isSequential, checkpoints } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Event name is required." });
    }

    // Auto-activate the first event or if none are active
    const activeCount = await prisma.event.count({ where: { isActive: true } });
    
    const parsedDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        type: type || "Campus Event",
        date: parsedDate,
        venue: venue || "Graphic Era Campus",
        bannerImage: bannerImage || null,
        description: description || null,
        entryTiming: entryTiming || null,
        exitTiming: exitTiming || null,
        isActive: activeCount === 0,
        isSequential: isSequential || false
      }
    });

    if (checkpoints && Array.isArray(checkpoints) && checkpoints.length > 0) {
      const cps = checkpoints.map((c, i) => ({
        eventId: event.id,
        name: c.name,
        order: c.order !== undefined ? c.order : i,
        isActive: c.isActive !== undefined ? c.isActive : true
      }));
      await prisma.checkpoint.createMany({ data: cps });
    } else {
      // Create a default "Main Gate Entry" checkpoint for the event
      await prisma.checkpoint.create({
        data: {
          eventId: event.id,
          name: "Main Gate Entry",
          order: 0,
          isActive: true
        }
      });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event." });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { name, type, date, venue, bannerImage, description, entryTiming, exitTiming, isSequential } = req.body;
    const event = await prisma.event.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        type,
        date: date ? new Date(date) : undefined,
        venue,
        bannerImage,
        description,
        entryTiming,
        exitTiming,
        isSequential
      }
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event." });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: "Event deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event." });
  }
};

exports.activateEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    await prisma.$transaction(async (tx) => {
      await tx.event.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
      await tx.event.update({
        where: { id: eventId },
        data: { isActive: true }
      });
    });
    res.json({ message: "Event activated." });
  } catch (error) {
    res.status(500).json({ error: "Failed to activate event." });
  }
};
