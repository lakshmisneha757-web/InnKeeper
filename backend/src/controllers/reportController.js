import { getReports as fetchReports } from '../utils/db.js';

export const getReports = async (req, res) => {
  try {
    const reports = await fetchReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
