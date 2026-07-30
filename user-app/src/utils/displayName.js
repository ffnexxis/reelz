// Shared display-name helpers.
// AuthContext stores the user object in localStorage, so `displayName` may be
// missing for sessions that logged in before the social layer shipped —
// always render names through these helpers.

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getDisplayName(user) {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  return capitalize((user.email || '').split('@')[0]);
}

export function getInitial(user) {
  const name = getDisplayName(user);
  return (name[0] || '?').toUpperCase();
}
