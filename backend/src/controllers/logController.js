import { getLogs as fetchLogs } from '../utils/db.js';

export const getLogs = async (req, res) => {
  try {
    const logs = await fetchLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
