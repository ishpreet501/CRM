import { Router } from "express";
import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all lead routes with authentication middleware
router.use(requireAuth);

// Helper to validate Mongo ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// -------------------------------------------------------------
// 1. Get Lead Statistics for Dashboard
// -------------------------------------------------------------
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user._id;

    const totalLeads = await Lead.countDocuments({ user: userId });
    const newLeads = await Lead.countDocuments({ user: userId, status: "New" });
    const contactedLeads = await Lead.countDocuments({
      user: userId,
      status: "Contacted",
    });
    const qualifiedLeads = await Lead.countDocuments({
      user: userId,
      status: "Qualified",
    });
    const proposalLeads = await Lead.countDocuments({
      user: userId,
      status: "Proposal",
    });
    const wonLeads = await Lead.countDocuments({ user: userId, status: "Won" });
    const lostLeads = await Lead.countDocuments({ user: userId, status: "Lost" });

    return res.json({
      total: totalLeads,
      new: newLeads,
      contacted: contactedLeads,
      qualified: qualifiedLeads,
      proposal: proposalLeads,
      won: wonLeads,
      lost: lostLeads,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ message: "Failed to load lead statistics" });
  }
});

// -------------------------------------------------------------
// 2. Get All / Filter / Search / Sort / Paginate Leads
// -------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, status, sort, page, limit, all } = req.query;

    // Filter by current authenticated user only
    const query = { user: userId };

    // Search by name, email, or company (case-insensitive)
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
      ];
    }

    // Filter by status if provided and not "All"
    if (status && status !== "All") {
      query.status = status;
    }

    // Determine sorting
    let sortOptions = { createdAt: -1 }; // default newest first
    if (sort === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sort === "name") {
      sortOptions = { name: 1 };
    }

    // If client requested all leads (useful for client-side table or stats)
    if (all === "true") {
      const leads = await Lead.find(query).sort(sortOptions);
      return res.json({
        leads,
        totalLeads: leads.length,
        totalPages: 1,
        page: 1,
      });
    }

    // Server-side Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalLeads / limitNum) || 1;

    return res.json({
      leads,
      totalLeads,
      totalPages,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return res.status(500).json({ message: "Failed to fetch leads" });
  }
});

// -------------------------------------------------------------
// 3. Create a New Lead
// -------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, company, source, status, notes } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "Name, email and phone number are required",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const newLead = await Lead.create({
      user: req.user._id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: company ? company.trim() : "",
      source: source || "Website",
      status: status || "New",
      notes: notes ? notes.trim() : "",
    });

    return res.status(201).json({
      message: "Lead created successfully",
      lead: newLead,
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    return res.status(500).json({ message: "Failed to create lead" });
  }
});

// -------------------------------------------------------------
// 4. Get a Single Lead by ID
// -------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid lead ID format" });
    }

    // Check ownership
    const lead = await Lead.findOne({ _id: id, user: req.user._id });
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.json({ lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return res.status(500).json({ message: "Failed to fetch lead" });
  }
});

// -------------------------------------------------------------
// 5. Update a Lead by ID
// -------------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid lead ID format" });
    }

    const { name, email, phone, company, source, status, notes } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "Name, email and phone number are required",
      });
    }

    const updatedLead = await Lead.findOneAndUpdate(
      { _id: id, user: req.user._id },
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company ? company.trim() : "",
        source: source || "Website",
        status: status || "New",
        notes: notes ? notes.trim() : "",
      },
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return res.status(500).json({ message: "Failed to update lead" });
  }
});

// -------------------------------------------------------------
// 6. Delete a Lead by ID
// -------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid lead ID format" });
    }

    const deletedLead = await Lead.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deletedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return res.status(500).json({ message: "Failed to delete lead" });
  }
});

export default router;
