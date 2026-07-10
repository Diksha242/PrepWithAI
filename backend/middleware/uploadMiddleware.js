import multer from "multer";

// Keep uploaded audio temporarily in RAM.
// This is suitable here because the file is immediately forwarded
// to the AI service and does not need permanent storage.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith("audio/") ||
        file.mimetype === "application/octet-stream"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Not an audio file"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
});

const uploadSingleAudio = upload.single("audioFile");

export { uploadSingleAudio };