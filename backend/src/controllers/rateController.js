import { getRules as fetchRules, createRule as addRule, getPricingHistory as fetchPricingHistory } from '../utils/db.js';

export const getRules = async (req, res) => {
  try {
    const rules = await fetchRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRule = async (req, res) => {
  try {
    const rule = await addRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPricingHistory = async (req, res) => {
  try {
    const history = await fetchPricingHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
