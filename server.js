const express = require('express');
const path  = require('path');
const {exec} = require('child_process');
const app = express();

const multer = require('multer');

const fs =  require('fs');
const { download } = require('express/lib/response');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'))

var dir = 'public';
var subDirectory = 'public/uploads';
var list = '';
var listFilePath = 'public/uploads/' + Date.now() + 'list.txt'
var outputFilePath = Date.now() + 'output.mp3'

if(!fs.existsSync(dir)){
    fs.mkdirSync(dir);

    fs.mkdirSync(subDirectory)
}

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/uploads')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))}
})

const videoFilter = function (req, file, cb){
    if(!file.originalname.match(/\.(mp3)$/) && !file.originalname.match(/\.(mp4)$/)){
        req.filleValidationError = 'Solo archivos .mp3 o .mp4';
        return cb(new Error('Solo están permitidos archivos .mp3!'),false);
    }
    cb(null, true);
}

var upload = multer({storage: storage, fileFilter: videoFilter})

app.get('/',(req,res)=>{
    res.sendFile(__dirname + "/index.html")
    
})

app.post('/merge', upload.array('files', 100), (req,res) =>{
   list = '';
   filesPath = [];
   segundos = req.body.duration * 1000;
    if(req.files){
    req.files.forEach(file => {
        console.log(file.path)
        filesPath.push(file.path)
        list += `file ${file.filename}`
        list += '\n'
    });

    var writeStream = fs.createWriteStream(listFilePath)
    writeStream.write(list)
    writeStream.end()
    //ffmpeg -y -i video.mp4 -i 002.ogg.mp3 -i 003.ogg.mp3 -i 004.ogg.mp3 -filter_complex "[1]adelay=1000[s1];[2]adelay=2500[s2];[3]adelay=4000[s3];[s1][s2][s3]amix=3[a]" -map 0:v -map "[a]" -preset ultrafast video_with_audio.mp4
    //ffmpeg -i outputWithAudio.mp4 -i "G:\studio\soundEffects\ting.mp3" -filter_complex "[1]adelay=30000|30000[aud];[0][aud]amix" -c:v copy outWithTing.mp4 -y
    //exec(`ffmpeg -safe 0 -f concat -i ${listFilePath} -c copy ${outputFilePath}`,
    //ffmpeg -i file1.mp4 -i indianBG.mp3 -filter_complex "[0:a][1:a]amerge=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -ac 2 -shortest output.mp4
    exec(`ffmpeg -i ${filesPath[0]} -i ${filesPath[1]} -filter_complex "[1]adelay=${segundos}|${segundos}[aud];[0:a][aud]amix=inputs=2[a]" -map "[a]" ${outputFilePath}`,
    (error,stdout, stderr) =>{
        if(error){
            console.log(`error: ${error.message}`);
        }
        else {
            console.log('Videos are successfully merged')
            res.download(outputFilePath,(err)=>{
                if(err) throw err;
                req.files.forEach(file =>{
                    fs.unlinkSync(file.path)
                });
                fs.unlinkSync(listFilePath)
                fs.unlinkSync(outputFilePath)
            })

        }
    })
   } 
})

app.listen(PORT, () => console.log(`Express listening PORT: ${PORT}`));