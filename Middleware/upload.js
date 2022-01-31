import multer from 'multer'
import {GridFsStorage} from 'multer-gridfs-storage';


const storage = new GridFsStorage({
    url: "mongodb+srv://AswinRm:projects@cluster0.47e1x.mongodb.net/memogram?retryWrites=true&w=majority",
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        const match = ["image/png", "image/jpeg","image/jpg"];

        if (match.indexOf(file.mimetype) === -1) {
            const filename = `${file.originalname}`;
            return null;
        }

        return {
            bucketName: "photos",
            filename: `${file.originalname}`,
        };
    },
});

export default multer({ storage });