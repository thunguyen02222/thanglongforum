import { join } from 'path';

const fileConfig = {
  publicDir: join(__dirname, '..', '..', 'public'),
  publicPath: '/public',
  avatarDir: join(__dirname, '..', '..', 'public', 'avatars'),
  userAvatarDir: join(__dirname, '..', '..', 'public', 'users', 'avatars'),
  coverDir: join(__dirname, '..', '..', 'public', 'covers'),
  settingDir: join(__dirname, '..', '..', 'public', 'settings'),
  imageDir: join(__dirname, '..', '..', 'public', 'images'),
  uploadsDir: join(__dirname, '..', '..', 'public', 'uploads'),
  uploadsImageDir: join(__dirname, '..', '..', 'public', 'uploads', 'images'),
  inventoryDir: join(__dirname, '..', '..', 'public', 'inventory'),
  documentDir: join(__dirname, '..', '..', 'public', 'documents'),
  videoDir: join(__dirname, '..', '..', 'public', 'videos'),
  videoThumbDir: join(__dirname, '..', '..', 'public', 'videos', 'thumbs'),
  photoDir: join(__dirname, '..', '..', 'public', 'photos'),
  photoThumbDir: join(__dirname, '..', '..', 'public', 'photos', 'thumbs')
};

export default fileConfig;

export const registerAs = () => ({ file: fileConfig });
