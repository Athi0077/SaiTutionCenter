const User = require("../models/User");

// @desc    Create a Parent account
// @route   POST /api/parents
// @access  Private (Principal)
const createParent = async (req, res) => {
  try {
    const { name, email, mobileNumber, phone, password, childrenIds } = req.body;
    const mobile = (mobileNumber || phone || "").trim();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    
    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: "Name, mobile number, and password are required" });
    }

    if (!childrenIds || childrenIds.length === 0) {
      return res.status(400).json({ success: false, message: "At least one linked student is required" });
    }

    const query = [
      { mobileNumber: mobile },
      { phone: mobile }
    ];
    if (cleanEmail) {
      query.push({ email: cleanEmail });
    }

    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      if (userExists.role !== 'parent') {
        return res.status(400).json({ success: false, message: "Mobile number or email is already registered to a non-parent account" });
      }

      if (childrenIds && childrenIds.length > 0) {
        const existingIds = userExists.children.map(id => id.toString());
        const newIds = childrenIds.filter(id => !existingIds.includes(id.toString()));
        if (newIds.length === 0) {
           return res.status(400).json({ success: false, message: "Students are already linked to this parent" });
        }
        userExists.children = [...existingIds, ...newIds];
        await userExists.save();
        return res.status(200).json({ success: true, message: "Parent exists. New students linked successfully.", data: userExists });
      } else {
        return res.status(400).json({ success: false, message: "Parent already exists. Please select students to link." });
      }
    }

    const parent = await User.create({
      name,
      email: cleanEmail || undefined,
      mobileNumber: mobile,
      phone: mobile,
      password,
      role: "parent",
      status: "active",
      children: childrenIds || []
    });

    res.status(201).json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Parents
// @route   GET /api/parents
// @access  Private (Principal)
const getParents = async (req, res) => {
  try {
    const parents = await User.find({ role: "parent" }).populate("children", "name studentId email");
    res.json({ success: true, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Parent
// @route   PUT /api/parents/:id
// @access  Private (Principal, Teacher)
const updateParent = async (req, res) => {
  try {
    const parent = await User.findById(req.params.id);
    if (!parent || parent.role !== "parent") {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    const { name, email, mobileNumber, phone, password, childrenIds } = req.body;
    const mobile = (mobileNumber || phone || "").trim();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    
    if (cleanEmail && cleanEmail !== parent.email) {
      const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: parent._id } });
      if (emailExists) return res.status(400).json({ success: false, message: "Email already taken" });
      parent.email = cleanEmail;
    } else if (email === "") {
      parent.email = undefined;
    }

    if (mobile && mobile !== parent.mobileNumber && mobile !== parent.phone) {
      const mobileExists = await User.findOne({ 
        $or: [{ mobileNumber: mobile }, { phone: mobile }], 
        _id: { $ne: parent._id } 
      });
      if (mobileExists) return res.status(400).json({ success: false, message: "Mobile number already taken" });
      parent.mobileNumber = mobile;
      parent.phone = mobile;
    }
    
    if (name) parent.name = name;
    if (password) parent.password = password;
    
    if (childrenIds) {
       parent.children = childrenIds;
    }

    await parent.save();
    res.json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Parent
// @route   DELETE /api/parents/:id
// @access  Private (Principal, Teacher)
const deleteParent = async (req, res) => {
  try {
    const parent = await User.findById(req.params.id);
    if (!parent || parent.role !== "parent") {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }
    
    await parent.deleteOne();
    res.json({ success: true, message: "Parent deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createParent,
  getParents,
  updateParent,
  deleteParent
};
