import Report from "../models/Report.js"

// Create a new report
const createReport = async (req, res) => {
  try {
    const { subject, message, reportedItemId, reportType } = req.body;

    const report = new Report({
      user: req.user.id,
      subject,
      message,
      reportedItemId,
      reportType,
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create report', error: error.message });
  }
};

// Get all reports (admin only)
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('user', 'email name');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve reports', error: error.message });
  }
};

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    await Report.findByIdAndDelete(id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete report', error: error.message });
  }
};


export
{
  createReport,getAllReports, deleteReport
}