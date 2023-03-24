const { v4: uuidv4 } = require("uuid");
const { admin } = require('../config/firebase-admin');
const { DEFAULT_BUCKET_NAME } = require('../constants/DefaultConstants');

const uploadImageToBucket = async (file, folderPath) => {
  return new Promise((resolve, reject) => {
    let uuid = uuidv4();
    let bucket = admin.storage().bucket(DEFAULT_BUCKET_NAME);
    let gcsFileName = `${folderPath}/${uuid}-${file.originalname}`;
    let blob = bucket.file(gcsFileName);
    let stream = blob.createWriteStream({
      resumable: false,
      metadata : {
        gzip: true,
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuid
        }
      }
    });
    stream.on('error', (err) => {
      reject("An error occured during image uploading");
    });
    stream.on('finish', () => {
      // we can also use blob.metadata.name instead of gcsfilename
      resolve(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${gcsFileName.replace(/\//g,'%2F')}?alt=media&token=${uuid}`);
    });
    stream.end(file.buffer);
  });
}

module.exports = {
  uploadImageToBucket
}