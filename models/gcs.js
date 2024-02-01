const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = process.env.GOOGLE_IMAGES_BUCKET;

const getUploadPromise = (file, id) => {
    return new Promise((resolve, reject) => {
        const blob = storage.bucket(bucketName).file(id);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });
        blobStream.on('error', err => {
            reject({ error: "GCS_UPLOAD_ERROR" });
        });
        blobStream.on('finish', () => {
            resolve({});
        });
        blobStream.end(file.buffer);
    });
};

const uploadImage = async (file, id) => {
    let error;
    try {
        const { uploadError } = await getUploadPromise(file, id);
        if (uploadError) error = uploadError;
    } catch (e) {
        error = "GCS_UPLOAD_ERROR";
    }
    return { error };
}

const getImageUrl = async id => {
    let url, error;
    try {
        const options = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 10 * 1000
        };
        const [newUrl] = await storage.bucket(bucketName).file(id).getSignedUrl(options);
        url = newUrl;
    } catch (e) {
        error = "GCS_FETCH_IMAGE_ERROR";
    }
    return { url, error };
}

const deleteImage = async id => {
    let error;
    try {
        await storage.bucket(bucketName).file(id).delete();
    } catch (e) {
        error = "GCS_DELETE_IMAGE_ERROR";
    }
    return { error };
}

module.exports = { uploadImage, getImageUrl, deleteImage };
