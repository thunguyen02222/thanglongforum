const imageConfig = {
  avatar: {
    width: 500,
    height: 500
  },
  thumbnail: {
    width: 200,
    height: 200
  },
  blurThumbnail: {
    width: 65,
    height: 65
  },
  originThumbnail: {
    width: 500,
    height: 500
  },
  maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH || '1920', 10),
  maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT || '1080', 10),
  quality: parseInt(process.env.IMAGE_QUALITY || '80', 10)
};

export default imageConfig;

export const registerAs = () => ({ image: imageConfig });
