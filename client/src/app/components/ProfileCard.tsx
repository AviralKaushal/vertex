export function ProfileCard({ name, email }: { name: string; email: string }) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="h-24 bg-gradient-to-br from-blue-400 via-purple-300 to-pink-300 relative">
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center border-4 border-white">
            <span className="text-3xl font-bold text-white">{initial}</span>
          </div>
        </div>
      </div>
      <div className="pt-12 pb-6 text-center">
        <h3 className="text-xl font-bold text-slate-900">{name}</h3>
        <p className="text-sm text-slate-600 mt-1">{email}</p>
      </div>
    </div>
  );
}
