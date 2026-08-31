import { createRoom as addRoom, getRooms as fetchRooms } from '../utils/db.js';

export const getRooms = async (req, res) => {
  try {
    const rooms = await fetchRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const room = await addRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
