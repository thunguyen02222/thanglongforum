import { FileService } from '../../modules/file/services/file.service';

/**
 * Resolve avatarUrl từ avatarId cho các populated user data.
 * Dùng chung cho question, answer, comment... sau khi populate userId.
 */
export async function resolveAvatarUrl<T extends Record<string, any>>(
  items: T[],
  fileService: FileService,
  userField = 'userId'
): Promise<T[]> {
  // Thu thập tất cả avatarId chưa có avatarUrl
  const avatarIdSet = new Set<string>();
  for (const item of items) {
    const user = item[userField];
    if (user?.avatarId && !user.avatarUrl) {
      avatarIdSet.add(user.avatarId.toString());
    }
  }

  if (avatarIdSet.size === 0) return items;

  const files = await fileService.findByIds(Array.from(avatarIdSet));
  const urlMap = new Map<string, string>();
  files.forEach((f) => {
    const id = f._id?.toString?.();
    if (id) urlMap.set(id, f.getUrl());
  });

  for (const item of items) {
    const user = item[userField];
    if (user?.avatarId && !user.avatarUrl) {
      user.avatarUrl = urlMap.get(user.avatarId.toString()) || undefined;
    }
  }

  return items;
}
