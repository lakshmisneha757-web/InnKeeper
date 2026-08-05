import { getChannels as fetchChannels, syncChannel as runSync } from '../utils/db.js';

export const getChannels = async (req, res) => {
  try {
    const channels = await fetchChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const syncChannel = async (req, res) => {
  try {
    const result = await runSync(req.params.id);
    if (!result) return res.status(404).json({ error: 'Channel not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
