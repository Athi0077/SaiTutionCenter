const MotivationalQuote = require("../models/MotivationalQuote");
const { getIo } = require("../utils/socket");

// @desc    Create a new quote
// @route   POST /api/quotes
// @access  Private (Principal)
const createQuote = async (req, res) => {
  try {
    const { quote, author, audience } = req.body;
    
    if (!quote || !audience) {
      return res.status(400).json({ success: false, message: "Quote and audience are required" });
    }

    const newQuote = await MotivationalQuote.create({
      quote,
      author: author || "Unknown",
      audience,
      status: "draft",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: newQuote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all quotes (history)
// @route   GET /api/quotes
// @access  Private (Principal)
const getQuotes = async (req, res) => {
  try {
    const quotes = await MotivationalQuote.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current quote for authenticated user's role
// @route   GET /api/quotes/current
// @access  Private (All)
const getCurrentQuote = async (req, res) => {
  try {
    const role = req.user.role; // 'student' or 'teacher' or 'principal'
    let queryAudience = ["both"];
    
    if (role === "student") {
      queryAudience.push("students");
    } else if (role === "teacher") {
      queryAudience.push("teachers");
    } else if (role === "principal") {
      // Principal can view both current quotes if needed, but for their own dashboard they might just get 'both' or we can return an object.
      // We will provide a specific principal endpoint or just return all current ones.
      const currentQuotes = await MotivationalQuote.find({ status: "published" });
      return res.json({ success: true, data: currentQuotes });
    }

    // For teacher/student, return the single active quote applicable
    // Since 'both' might override 'students', we sort by publishedAt desc
    const quote = await MotivationalQuote.findOne({
      status: "published",
      audience: { $in: queryAudience }
    }).sort({ publishedAt: -1 });

    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a quote
// @route   PUT /api/quotes/:id
// @access  Private (Principal)
const updateQuote = async (req, res) => {
  try {
    const { quote, author, audience } = req.body;
    let existingQuote = await MotivationalQuote.findById(req.params.id);

    if (!existingQuote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    // Only allow updating drafts or published (but editing published might be weird, let's allow it but not change status)
    existingQuote.quote = quote || existingQuote.quote;
    existingQuote.author = author || existingQuote.author;
    existingQuote.audience = audience || existingQuote.audience;

    await existingQuote.save();
    res.json({ success: true, data: existingQuote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Publish a quote
// @route   POST /api/quotes/:id/publish
// @access  Private (Principal)
const publishQuote = async (req, res) => {
  try {
    const quoteToPublish = await MotivationalQuote.findById(req.params.id);

    if (!quoteToPublish) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    const audience = quoteToPublish.audience;

    // Determine audiences to archive
    let audiencesToArchive = [];
    if (audience === "both") {
      audiencesToArchive = ["both", "students", "teachers"];
    } else {
      audiencesToArchive = [audience];
      // Note: If a 'both' quote is currently active and we publish a 'students' quote, 
      // the 'students' quote will take precedence because of sorting in `getCurrentQuote`, 
      // or we can archive the 'both' quote. 
      // To keep it simple: Archive any existing published quote that exactly matches the new audience, 
      // AND if we publish a specific one (e.g. students), we might need to handle 'both'.
      // The requirement says: "A Students quote replaces the current Students quote. A Teachers quote replaces the current Teachers quote. A Both quote becomes current for both audiences."
      // So if 'both' is published, archive all. If 'students' is published, archive 'students' and 'both'? Wait, if we archive 'both', teachers lose their quote.
      // So if 'students' is published, we just archive 'students'. If 'both' is active, the student endpoint will sort by publishedAt descending, meaning the new 'students' quote wins over the old 'both' quote.
      // We'll just archive the exact matching audience, AND if it's 'both', archive all.
    }

    // Archive previously published quotes for these audiences
    await MotivationalQuote.updateMany(
      { status: "published", audience: { $in: audiencesToArchive } },
      { $set: { status: "archived" } }
    );

    quoteToPublish.status = "published";
    quoteToPublish.publishedAt = Date.now();
    await quoteToPublish.save();

    // Emit Socket.IO event
    try {
      const io = getIo();
      if (audience === "students" || audience === "both") {
        io.to("role:student").emit("quote:published", quoteToPublish);
      }
      if (audience === "teachers" || audience === "both") {
        io.to("role:teacher").emit("quote:published", quoteToPublish);
      }
    } catch (ioError) {
      console.error("Socket.io emit error:", ioError);
    }

    res.json({ success: true, data: quoteToPublish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Archive (soft delete) a quote
// @route   DELETE /api/quotes/:id
// @access  Private (Principal)
const archiveQuote = async (req, res) => {
  try {
    const quote = await MotivationalQuote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    quote.status = "archived";
    await quote.save();

    res.json({ success: true, message: "Quote archived successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createQuote,
  getQuotes,
  getCurrentQuote,
  updateQuote,
  publishQuote,
  archiveQuote,
};
