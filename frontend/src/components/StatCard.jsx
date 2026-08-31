import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border border-violet-100 bg-white/80 p-5 shadow-sm backdrop-blur"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>
          {Icon && <Icon className="h-5 w-5 text-violet-700" />}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </motion.div>
  );
}
