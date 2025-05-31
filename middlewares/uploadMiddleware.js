const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Replace escaped \n with actual newlines in private_key
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'stylify254.appspot.com',
});

const bucket = admin.storage().bucket();

async function uploadImagesAndVideos(req, res, next) {
  try {
    const images = req.files?.['images'] || [];
    const videos = req.files?.['videos'] || [];

    const uploadedImages = [];
    const uploadedVideos = [];

    const uploadFile = async (file) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      const destination = `uploads/${fileName}`;

      await bucket.upload(file.path, {
        destination,
        metadata: {
          contentType: file.mimetype,
        },
      });

      const fileRef = bucket.file(destination);
      await fileRef.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      // Delete local temp file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn(`Failed to delete temp file: ${file.path}`, err.message);
      }

      return {
        name: file.originalname,
        url: publicUrl,
      };
    };

    // Upload images
    for (const file of images) {
      const uploaded = await uploadFile(file);
      uploadedImages.push(uploaded);
    }

    // Upload videos
    for (const file of videos) {
      const uploaded = await uploadFile(file);
      uploadedVideos.push(uploaded);
    }

    req.media = { uploadedImages, uploadedVideos };
    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

async function uploadMedia(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const destination = `uploads/${fileName}`;

      await bucket.upload(file.path, {
        destination,
        metadata: {
          contentType: file.mimetype,
        },
      });

      const fileRef = bucket.file(destination);
      await fileRef.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      uploadedFiles.push({ name: file.originalname, url: publicUrl });

      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn(`Failed to delete temp file: ${file.path}`, err.message);
      }
    }

    console.log(uploadedFiles);
    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

async function uploadSingleImage(req, res) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const destination = `uploads/${fileName}`;

    // Upload to Firebase Storage
    await bucket.upload(file.path, {
      destination,
      metadata: {
        contentType: file.mimetype,
      },
    });

    const fileRef = bucket.file(destination);
    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Delete local temp file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn(`Failed to delete temp file: ${file.path}`, err.message);
    }

    console.log({ name: file.originalname, url: publicUrl });
    res.json({
      message: 'Image uploaded successfully',
      file: {
        name: file.originalname,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error('Single image upload error:', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
}

async function upLoadProfilePicture(req, res, next) {
  try {
    const profilePic = req.files['profile_pic']?.[0];

    if (!profilePic) {
      req.image = null;
      return next();
    }

    const file = profilePic;
    const fileName = `${Date.now()}-${file.originalname}`;
    const destination = `uploads/${fileName}`;

    await bucket.upload(file.path, {
      destination,
      metadata: {
        contentType: file.mimetype,
      },
    });

    const fileRef = bucket.file(destination);
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Delete temp file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn(`Failed to delete temp file: ${file.path}`, err.message);
    }

    req.image = publicUrl;
    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
async function upLoadImage(req, res, next) {
  try {
    const profilePic = req.files['image']?.[0];

    if (!profilePic) {
      req.image = null;
      return next();
    }

    const file = profilePic;
    const fileName = `${Date.now()}-${file.originalname}`;
    const destination = `uploads/${fileName}`;

    await bucket.upload(file.path, {
      destination,
      metadata: {
        contentType: file.mimetype,
      },
    });

    const fileRef = bucket.file(destination);
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Delete temp file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn(`Failed to delete temp file: ${file.path}`, err.message);
    }

    req.image = publicUrl;
    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

async function updateProfileAndCover(req, res, next) {
  try {
    const profilePic = req.files['profile_pic']?.[0];
    const coverPic = req.files['cover_pic']?.[0];

    // If neither image is provided, return an error
    if (!profilePic && !coverPic) {     
      req.images = [];
      return next();
    }

    const uploaded = [];

    for (const file of [profilePic, coverPic]) {
      if (!file) continue;

      const fileName = `${Date.now()}-${file.originalname}`;
      const destination = `uploads/${fileName}`;

      await bucket.upload(file.path, {
        destination,
        metadata: {
          contentType: file.mimetype,
        },
      });

      const fileRef = bucket.file(destination);
      await fileRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      uploaded.push({
        field: file.fieldname,
        originalName: file.originalname,
        url: publicUrl,
      });

      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn(`Failed to delete temp file: ${file.path}`, err.message);
      }
    }

    req.images = uploaded;
    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}


async function uploadProfileAndCover(req, res, next) {
  try {
    const profilePic = req.files['profile_pic']?.[0];
    const coverPic = req.files['cover_pic']?.[0];

    const uploaded = [];
    if (!profilePic && !coverPic) {
      
    req.images = uploaded;
    
      return next();
    }


    for (const file of [profilePic, coverPic]) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const destination = `uploads/${fileName}`;

      await bucket.upload(file.path, {
        destination,
        metadata: {
          contentType: file.mimetype,
        },
      });

      const fileRef = bucket.file(destination);
      await fileRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      uploaded.push({
        field: file.fieldname,
        originalName: file.originalname,
        url: publicUrl,
      });

      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn(`Failed to delete temp file: ${file.path}`, err.message);
      }
    }

    req.images = uploaded;
    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}


module.exports = {
  uploadMedia,
  uploadSingleImage,
  uploadProfileAndCover,
  uploadImagesAndVideos,
  upLoadImage,
  upLoadProfilePicture
};
