// Public profile fields and bounded, server-validated avatar data.
export const PROFILE_NOTE_MAX = 160;
export const AVATAR_MAX_BYTES = 128 * 1024;

export function avatarUrl(username, present, version) {
  const n = Number(version);
  if (!present || !username || !Number.isSafeInteger(n) || n < 1) return '';
  return `/api/forum-auth?avatar=${encodeURIComponent(username)}&v=${n}`;
}

export function validateProfile(input = {}) {
  if (typeof input.note !== 'string' || input.note.length > PROFILE_NOTE_MAX || /[\u0000-\u001f\u007f]/.test(input.note)) {
    throw new Error(`Profil notu en fazla ${PROFILE_NOTE_MAX} karakter olmalı ve tek satır içermeli.`);
  }
  let avatar = null; // null = leave existing avatar unchanged; '' = remove
  if (input.avatar !== undefined) {
    if (typeof input.avatar !== 'string') throw new Error('Geçersiz profil resmi.');
    avatar = input.avatar;
    if (avatar) {
      if (avatar.length > Math.ceil(AVATAR_MAX_BYTES / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(avatar)) throw new Error('Profil resmi geçersiz veya çok büyük.');
      const bytes = Buffer.from(avatar, 'base64');
      if (bytes.length < 4 || bytes.length > AVATAR_MAX_BYTES || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9 || bytes.toString('base64') !== avatar) {
        throw new Error('Profil resmi JPEG biçiminde olmalı.');
      }
    }
  }
  return { note: input.note.trim(), avatar };
}

export function publicProfile(user) {
  return user ? { username: user.username, profile_note: user.profile_note || '', avatar_url: avatarUrl(user.username, user.avatar_present, user.avatar_version) } : null;
}
