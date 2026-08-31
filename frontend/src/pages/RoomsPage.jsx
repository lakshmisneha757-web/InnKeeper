import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { getRooms, updateRoomAvailability } from '../services/api';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getRooms();
      setRooms(res.data);
    } catch (err) {
      setError('Unable to load rooms.');
      toast.error('Room inventory could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []);

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    const matchesSearch = `${room.roomNumber ?? room.room_number} ${room.roomType ?? room.room_type}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'all' || room.status === status;
    return matchesSearch && matchesStatus;
  }), [rooms, search, status]);

  const handleToggle = async (room) => {
    try {
      await updateRoomAvailability(room.id, { availability: !room.availability, current_price: room.currentPrice ?? room.current_price, status: !room.availability ? 'Occupied' : 'Vacant', previous_price: room.currentPrice ?? room.current_price, reason: 'Inventory changed' });
      toast.success(`Availability updated for ${room.roomNumber ?? room.room_number}`);
      await loadRooms();
    } catch (err) {
      toast.error('Availability update failed.');
    }
  };

  if (loading) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-slate-500">Loading rooms…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Room Management</h2>
            <p className="text-sm text-slate-500">Search, filter, and manage availability.</p>
          </div>
          <div className="flex gap-3">
            <input placeholder="Search room" className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Occupied">Occupied</option>
              <option value="Vacant">Vacant</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRooms.map((room) => (
          <motion.div key={room.id} whileHover={{ y: -4 }} className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Room {room.roomNumber ?? room.room_number}</h3>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{room.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{room.roomType ?? room.room_type}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>₹{room.currentPrice ?? room.current_price}</span>
              <span>{room.availability ? 'Available' : 'Booked'}</span>
            </div>
            <div className="mt-4 text-sm text-slate-500">Connected channels: {room.connectedChannels ?? 0}</div>
            <button onClick={() => handleToggle(room)} className="mt-4 w-full rounded-full bg-violet-600 px-3 py-2 text-sm font-semibold text-white">Toggle Availability</button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
