import { mkdirSync } from 'fs';
import { rename, rm, mkdir, stat, readdir } from 'fs/promises';
import sharp from 'sharp';

export class ImageStore {
  constructor(imagesPath) {
    this.imagesPath = imagesPath;
    this.imagesTmp = imagesPath + '/tmp';
    mkdirSync(this.imagesTmp, { recursive: true });
  }

  tempPath() {
    return this.imagesTmp;
  }

  async cleanUp(days) {
    try {
      const files = await readdir(this.imagesTmp);
      for (const file of files) {
        const filePath = this.imagesTmp + '/' + file;
        const fstat = await stat(filePath);
        const sinceBirth = new Date() - fstat.birthtime;
        if (sinceBirth > days * 24 * 3600 * 1000 /* two days */) {
          await rm(filePath);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  finalNames(fileList) {
    return fileList.map((f) => f.replace(/^t_/, ''));
  }

  async moveToFinal(type, id, fileList) {
    const result = [];
    try {
      const path = `${this.imagesPath}/${type}/${id}`;
      await mkdir(path, { recursive: true });
      for (const fileName of fileList) {
        if (fileName.startsWith('t_')) {
          const final = fileName.replace(/^t_/, '');
          try {
            await rename(this.imagesTmp + '/' + fileName, path + '/' + final);
            if (!fileName.endsWith('.pdf')) {
              await rename(
                this.imagesTmp + '/s_' + fileName,
                path + '/s_' + final,
              );
            }
            result.push(final);
          } catch (err) {
            console.error(err);
          }
        } else {
          result.push(fileName);
        }
      }
    } catch (err) {
      console.error(err);
    }
    return result;
  }

  async removeTemp(filename) {
    try {
      await rm(this.imagesTmp + '/' + filename);
      if (!filename.endsWith('.pdf')) {
        await rm(this.imagesTmp + '/s_' + filename);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async thumbnail(filename) {
    if (filename.endsWith('.pdf')) return;
    const imagePath = this.imagesTmp + '/' + filename;
    return sharp(imagePath)
      .resize(64, 64)
      .toFile(this.imagesTmp + '/s_' + filename);
  }
}
