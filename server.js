const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const multer = require('multer');
const admZip = require("adm-zip");

const fs = require('fs');
const { download } = require('express/lib/response');

const PORT = process.env.PORT || 3000;

const effects = {
    0: "public\\effects\\box.mp3",
    1: "public\\effects\\disparos.mp3"
}

app.use(express.static('public'))

const dir = 'public';
const subDirectory = 'public/uploads';


if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);

    fs.mkdirSync(subDirectory)
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const musicFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(mp3)$/)) {
        req.filleValidationError = 'Solo archivos .mp3';
        return cb(new Error('Solo están permitidos archivos .mp3!'), false);
    }
    cb(null, true);
}

const upload = multer({ storage: storage, fileFilter: musicFilter })

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")

})

app.post('/merge', upload.array('files', 100), (req, res) => {
    list = '';
    filesPath = [];
    milliseconds = [];
    valEffects = req.body.effects;
    numSongs = req.body.numSongs;
    nameDuration = [];
    outputFilePath = [];
    const zip = new admZip();


    for (let index = 0; index < numSongs; index++) {

        nameDuration.push('req.body.duration' + index)
        valNameDuration = eval(nameDuration[index]);
        separate = valNameDuration.split(":", 2);
        minutes = parseInt(separate[0]) * 60;
        seconds = parseInt(separate[1]);
        milliseconds.push((minutes + seconds) * 1000);

    }

    if (req.files) {
        req.files.forEach(file => {
            filesPath.push(file.path)


        });

        for (let index = 0; index < req.files.length; index++) {
            outputFilePath.push(Date.now() + 'output.mp3')
            exec(`ffmpeg -i ${filesPath[index]} -i ${effects[valEffects]} -filter_complex "[1]adelay=${milliseconds[index]}|${milliseconds[index]}}[aud];[0:a][aud]amix=inputs=2[a]" -map "[a]" ${outputFilePath[index]}`,
                (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                    }
                    else {
                        console.log('Mp3 convertido con éxito' + outputFilePath[index])

                        zip.addLocalFile(outputFilePath[index]);
                        fs.writeFileSync("output.zip", zip.toBuffer())
                        fs.unlinkSync(filesPath[index]);
                        fs.unlinkSync(outputFilePath[index])
                    }
                })

        }

        setTimeout(function () {
            res.download("output.zip", (err) => {
                if (err) {
                    res.send("Error al descargar")
                }
            })

        }, 10000);
        setTimeout(function () {
            fs.unlinkSync("output.zip")
        }, 12000);
    }


})

app.listen(PORT, () => console.log(`Express listening PORT: ${PORT}`));