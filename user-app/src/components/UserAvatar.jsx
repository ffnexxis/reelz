import { getInitial } from '../utils/displayName';

const SIZES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

// Circle avatar: solid avatarColor when set, otherwise the brand gradient.
export default function UserAvatar({ user, size = 'md', className = '' }) {
  const base = `rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${SIZES[size] || SIZES.md} ${className}`;
  if (user?.avatarColor) {
    return (
      <div className={base} style={{ backgroundColor: user.avatarColor }}>
        {getInitial(user)}
      </div>
    );
  }
  return (
    <div className={`${base} bg-gradient-to-br from-reelz-500 to-purple-600`}>
      {getInitial(user)}
    </div>
  );
}
