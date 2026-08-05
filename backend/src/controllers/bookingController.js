import { createBooking as addBooking, getBookings as fetchBookings } from '../utils/db.js';

export const getBookings = async (req, res) => {
  try {
    const bookings = await fetchBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const booking = await addBooking(req.body);
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
