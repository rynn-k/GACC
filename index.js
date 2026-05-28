const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ort = require('onnxruntime-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.set('json spaces', 2);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, './public')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use(express.json());
app.use(cors());

const tagsRaw = fs.readFileSync(path.join(__dirname, 'models', 'selected_tags.csv'));
const tags = parse(tagsRaw, { columns: true, skip_empty_lines: true });

const KITA_GENJOT_TRUS = new Set([
    'large_breasts', 'huge_breasts', 'gigantic_breasts',
    'curvy', 'thick_thighs', 'wide_hips', 'voluptuous',
    'large_ass', 'big_ass', 'plump',
]);

const AKAN_KAMI_GENJOT = new Set([
    'medium_breasts', 'breasts', 'slim',
    'athletic', 'toned', 'fit', 'mature_female',
    'sexy', 'attractive',
]);

const INI_AGAK_ANEH_YA = new Set([
    'flat_chest', 'small_breasts', 'loli',
    'chibi', 'petite', 'tiny',
]);

const VIDEO_MAP = {
    kita_genjot_trus: '/videos/kita-genjot-trus.mp4',
    akan_kami_genjot: '/videos/akan-kami-genjot.mp4',
    ini_agak_aneh_ya: '/videos/ini-agak-aneh-ya.mp4',
};

let session = null;

async function loadModel() {
    session = await ort.InferenceSession.create(
        path.join(__dirname, 'models', 'model.onnx')
    );
}

async function preprocess(buffer) {
    const size = 448;
    const { data } = await sharp(buffer).flatten({ background: { r: 255, g: 255, b: 255 } }).resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255 } }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const float32 = new Float32Array(size * size * 3);

    for (let i = 0; i < size * size; i++) {
        float32[i * 3 + 0] = data[i * 3 + 2];
        float32[i * 3 + 1] = data[i * 3 + 1];
        float32[i * 3 + 2] = data[i * 3 + 0];
    }

    return new ort.Tensor('float32', float32, [1, size, size, 3]);
}

async function predictTags(buffer, threshold = 0.35) {
    const tensor = await preprocess(buffer);
    const inputName = session.inputNames[0];
    const outputs = await session.run({ [inputName]: tensor });
    const scores = outputs[session.outputNames[0]].data;

    const result = {};
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] > threshold) {
            result[tags[i].name] = scores[i];
        }
    }
    return result;
}

function getCharacterName(tagScores) {
    const characterTags = tags.filter(t => String(t.category) === '4').map(t => t.name);
    let best = null;
    let bestScore = -1;

    for (const t of characterTags) {
        if (tagScores[t] !== undefined && tagScores[t] > bestScore) {
            best = t;
            bestScore = tagScores[t];
        }
    }

    if (!best) return 'Unknown';
    return best.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getRelevantTags(tagScores) {
    const allRelevant = new Set([...KITA_GENJOT_TRUS, ...AKAN_KAMI_GENJOT, ...INI_AGAK_ANEH_YA]);
    return Object.entries(tagScores).filter(([t]) => allRelevant.has(t)).sort((a, b) => b[1] - a[1]).map(([t]) => t).join(', ') || 'no relevant tags';
}

function classify(tagScores) {
    const detected = new Set(Object.keys(tagScores));
    const scoreGenjotTrus = [...KITA_GENJOT_TRUS].reduce((s, t) => s + (tagScores[t] || 0), 0);
    const scoreGenjot = [...AKAN_KAMI_GENJOT].reduce((s, t) => s + (tagScores[t] || 0), 0);

    const hasGenjotTrus = [...KITA_GENJOT_TRUS].some(t => detected.has(t));
    const hasGenjot = [...AKAN_KAMI_GENJOT].some(t => detected.has(t));

    if (hasGenjotTrus || scoreGenjotTrus > 0.5) return 'kita_genjot_trus';
    if (hasGenjot || scoreGenjot > 0.4) return 'akan_kami_genjot';
    return 'ini_agak_aneh_ya';
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const tagScores = await predictTags(req.file.buffer);
        const level = classify(tagScores);
        const character = getCharacterName(tagScores);
        const relevantTags = getRelevantTags(tagScores);
        const video = VIDEO_MAP[level];

        res.json({ character, tags: relevantTags, video });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

loadModel().then(() => {
    app.listen(7860, () => console.log('Server running on http://localhost:7860'));
});
