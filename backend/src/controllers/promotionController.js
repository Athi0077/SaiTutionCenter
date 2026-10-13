const AcademicYear = require("../models/AcademicYear");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const PromotionBatch = require("../models/PromotionBatch");
const Standard = require("../models/Standard");
const User = require("../models/User");

// Predefined standard order — matches the frontend dropdown (1st → 12th)
// Standards in DB are sorted by this list first; then by createdAt for any custom standards
const STANDARD_ORDER = [
  '1st Standard', '2nd Standard', '3rd Standard', '4th Standard',
  '5th Standard', '6th Standard', '7th Standard', '8th Standard',
  '9th Standard', '10th Standard', '11th Standard', '12th Standard',
];

// Build next-standard mapping using predefined order, falling back to createdAt
const buildStandardMapping = async () => {
  const allStandards = await Standard.find();

  // Sort: predefined standards first (by predefined index), then others by createdAt
  const sorted = allStandards.sort((a, b) => {
    const idxA = STANDARD_ORDER.indexOf(a.name);
    const idxB = STANDARD_ORDER.indexOf(b.name);
    // Both predefined — sort by predefined order
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    // Only a is predefined — a comes first
    if (idxA !== -1) return -1;
    // Only b is predefined — b comes first
    if (idxB !== -1) return 1;
    // Both custom — sort by creation time
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const mapping = {};
  for (let i = 0; i < sorted.length; i++) {
    if (i < sorted.length - 1) {
      mapping[sorted[i].name] = sorted[i + 1].name;
    } else {
      mapping[sorted[i].name] = 'Graduated'; // Last standard graduates
    }
  }
  return mapping;
};

// @desc    Preview Promotion
// @route   POST /api/promotions/preview
// @access  Private (Principal only)
const previewPromotion = async (req, res) => {
  try {
    const { sourceAcademicYearId, destinationAcademicYearId } = req.body;

    if (!sourceAcademicYearId || !destinationAcademicYearId) {
      return res.status(400).json({ success: false, message: "Source and destination academic year IDs are required" });
    }

    // Find all active enrollments for source year
    const sourceEnrollments = await Enrollment.find({
      academicYearId: sourceAcademicYearId,
      status: "active"
    })
      .populate('studentId')
      .populate('classId');

    const previewResults = [];
    const classesCache = await Class.find({});
    const standardMapping = await buildStandardMapping();

    for (const enr of sourceEnrollments) {
      const student = enr.studentId;
      const currentClass = enr.classId;

      if (!student || !currentClass) continue;

      const nextStandardName = standardMapping[currentClass.standard];

      let action = 'promote';
      let toClassId = null;
      let errorDetails = null;

      if (!nextStandardName) {
        action = 'exclude';
        errorDetails = 'Standard not found in the system. Please check Standards configuration.';
      } else if (nextStandardName === 'Graduated') {
        action = 'graduate';
      } else {
        // Try to map to the same section in the next standard
        const destClass = classesCache.find(
          c => c.standard === nextStandardName && c.section === currentClass.section
        );
        if (destClass) {
          toClassId = destClass._id;
        } else {
          // Try any class in next standard if same section doesn't exist
          const anyDestClass = classesCache.find(c => c.standard === nextStandardName);
          if (anyDestClass) {
            toClassId = anyDestClass._id;
            errorDetails = `Section "${currentClass.section}" not found in ${nextStandardName}. Assigned to "${anyDestClass.section}" instead.`;
          } else {
            errorDetails = `No class found for ${nextStandardName}. Please create classes for this standard first.`;
          }
        }
      }

      // Check if student is already enrolled in destination year
      const alreadyEnrolled = await Enrollment.findOne({
        studentId: student._id,
        academicYearId: destinationAcademicYearId
      });

      if (alreadyEnrolled) {
        action = 'exclude';
        errorDetails = 'Student already enrolled in destination academic year';
      }

      previewResults.push({
        studentId: student._id,
        studentName: student.name,
        email: student.email,
        rollNumber: student.rollNumber || enr.rollNumber || '-',
        fromClassId: currentClass._id,
        fromClassName: currentClass.className,
        toClassId,
        toClassName: toClassId
          ? classesCache.find(c => c._id.toString() === toClassId.toString())?.className
          : null,
        action,
        errorDetails
      });
    }

    // Sort: errors first, then by current class name
    previewResults.sort((a, b) => {
      if (a.errorDetails && !b.errorDetails) return -1;
      if (!a.errorDetails && b.errorDetails) return 1;
      return (a.fromClassName || '').localeCompare(b.fromClassName || '');
    });

    res.json({ success: true, data: previewResults });
  } catch (error) {
    console.error('Preview promotion error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm Promotion
// @route   POST /api/promotions/confirm
// @access  Private (Principal only)
const confirmPromotion = async (req, res) => {
  try {
    const { sourceAcademicYearId, destinationAcademicYearId, previewData } = req.body;

    if (!sourceAcademicYearId || !destinationAcademicYearId || !previewData?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const batch = await PromotionBatch.create({
      sourceAcademicYearId,
      destinationAcademicYearId,
      initiatedBy: req.user._id,
      status: "processing",
      results: []
    });

    let totalPromoted = 0, totalGraduated = 0, totalRepeating = 0,
        totalTransferred = 0, totalExcluded = 0, totalErrors = 0;

    for (const item of previewData) {
      try {
        // Skip excluded and transferred — no new enrollment created
        if (item.action === 'exclude' || item.action === 'transfer') {
          if (item.action === 'transfer') totalTransferred++;
          if (item.action === 'exclude') totalExcluded++;
          batch.results.push({
            studentId: item.studentId,
            action: item.action,
            fromClassId: item.fromClassId,
            status: "success"
          });
          continue;
        }

        // Check for duplicate enrollment
        const existingEnrollment = await Enrollment.findOne({
          studentId: item.studentId,
          academicYearId: destinationAcademicYearId
        });
        if (existingEnrollment) {
          throw new Error("Student already enrolled in destination academic year");
        }

        // Find the source enrollment to link and update
        const sourceEnr = await Enrollment.findOne({
          studentId: item.studentId,
          academicYearId: sourceAcademicYearId
        });

        // Handle graduation
        if (item.action === 'graduate') {
          if (sourceEnr) {
            await Enrollment.findByIdAndUpdate(sourceEnr._id, { status: 'graduated' });
          }
          totalGraduated++;
          batch.results.push({
            studentId: item.studentId,
            action: item.action,
            fromClassId: item.fromClassId,
            status: "success"
          });
          continue;
        }

        // Normal promotion or repeating — create new enrollment in destination year
        await Enrollment.create({
          studentId: item.studentId,
          academicYearId: destinationAcademicYearId,
          classId: item.toClassId,
          status: "active",
          type: item.action === 'repeat' ? 'repeating' : 'promoted',
          previousEnrollmentId: sourceEnr ? sourceEnr._id : null,
          promotionDate: new Date()
        });

        // Mark old enrollment as promoted/repeating
        if (sourceEnr) {
          await Enrollment.findByIdAndUpdate(sourceEnr._id, {
            status: item.action === 'repeat' ? 'repeating' : 'promoted'
          });
        }

        if (item.action === 'promote') totalPromoted++;
        if (item.action === 'repeat') totalRepeating++;

        batch.results.push({
          studentId: item.studentId,
          action: item.action,
          fromClassId: item.fromClassId,
          toClassId: item.toClassId,
          status: "success"
        });

      } catch (err) {
        totalErrors++;
        batch.results.push({
          studentId: item.studentId,
          action: item.action,
          fromClassId: item.fromClassId,
          toClassId: item.toClassId,
          status: "error",
          errorDetails: err.message
        });
      }
    }

    batch.summary = {
      totalProcessed: previewData.length,
      totalPromoted,
      totalGraduated,
      totalRepeating,
      totalTransferred,
      totalExcluded,
      totalErrors
    };
    batch.status = "completed";
    batch.completedAt = new Date();
    await batch.save();

    res.json({ success: true, message: "Promotion batch processed successfully", data: batch });
  } catch (error) {
    console.error('Confirm promotion error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Promotion History
// @route   GET /api/promotions/history
// @access  Private (Principal only)
const getPromotionHistory = async (req, res) => {
  try {
    const history = await PromotionBatch.find()
      .populate('sourceAcademicYearId', 'name')
      .populate('destinationAcademicYearId', 'name')
      .populate('initiatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  previewPromotion,
  confirmPromotion,
  getPromotionHistory
};
