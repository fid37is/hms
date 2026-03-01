export default function LoadingSpinner({ size = 'md', center = false }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={center ? 'flex justify-center items-center py-12' : 'inline-flex'}>
      <div className={`${s} border-2 border-gray-200 border-t-[#1F4E8C] rounded-full animate-spin`} />
    </div>
  );
}
